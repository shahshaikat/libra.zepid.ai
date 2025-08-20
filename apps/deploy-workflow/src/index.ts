/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.ts
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { WorkflowEntrypoint, WorkflowStep, type WorkflowEvent } from 'cloudflare:workers';
import { buildFiles as buildFilesWithHistory, getCdnStaticAssetUrl, type HistoryType } from '@libra/common';
import { templateConfigs } from '@libra/templates';

import { project, getDbForWorkflow, hasPremiumMembership } from '@libra/db';
import { checkAndUpdateDeployUsageForWorkflow } from './utils/deploy-quota';
import { eq, and } from 'drizzle-orm';
import app from './app';
import type { Bindings, DeploymentParams, ValidationResult, SandboxResult, SyncResult, BuildResult, DeployResult, CleanupResult } from './types';
import {
    DEPLOYMENT_CONFIG,
    executeStep,
    logStep,
    connectToSandbox,
    executeCommand,
    createDeploymentSandbox,
    terminateDeploymentSandbox,
} from './utils/deployment';
import { getDynamicDeploymentTemplate } from '@libra/sandbox';
import { isExcludedFile } from "./utils/common";

/**
 * Parse message history from JSON string
 */
function parseMessageHistory(messageHistory: string | null) {
    return JSON.parse(messageHistory || '[]') as HistoryType
}

export class DeploymentWorkflow extends WorkflowEntrypoint<Bindings, DeploymentParams> {
    async run(event: WorkflowEvent<DeploymentParams>, step: WorkflowStep) {
        const { projectId, customDomain, orgId, userId } = event.payload;

        console.log(`[Workflow] Starting deployment for project ${projectId}`);

        // Step 1: Validate permissions and prepare deployment
        const validationResult = await step.do(
            'validate-and-prepare',
            {
                retries: { limit: 3, delay: 2, backoff: 'linear' },
                timeout: '1 minutes'
            },
            async (): Promise<ValidationResult> => {
                return this.validateAndPrepare(projectId, customDomain, orgId, userId);
            }
        );

        // Step 2: Create sandbox
        const sandboxResult = await step.do(
            'create-sandbox',
            {
                retries: { limit: 2, delay: 5, backoff: 'exponential' },
                timeout: '1 minutes'
            },
            async (): Promise<SandboxResult> => {
                return this.createSandbox(validationResult.deploymentConfig);
            }
        );

        // Step 3: Sync files to sandbox
        await step.do('sync-files', { retries: { limit: 3, delay: 3, backoff: 'linear' }, timeout: '1 minutes' },
            async (): Promise<SyncResult> => this.syncFiles(sandboxResult.sandboxId, projectId, orgId));

        // Step 4: Build project
        await step.do('build-project', { retries: { limit: 2, delay: 10, backoff: 'linear' }, timeout: '1 minutes' },
            async (): Promise<BuildResult> => this.buildProject(sandboxResult.sandboxId));

        // Step 5: Deploy to Cloudflare Workers
        const deployResult = await step.do('deploy-to-cloudflare', { retries: { limit: 5, delay: 5, backoff: 'exponential' }, timeout: '1 minutes' },
            async (): Promise<DeployResult> => this.deployToCloudflare(sandboxResult.sandboxId, validationResult.deploymentConfig.workerName, this.env));

        // Step 6: Update database and cleanup
        await step.do('update-database-and-cleanup', { retries: { limit: 3, delay: 2, backoff: 'linear' }, timeout: '1 minutes' },
            async (): Promise<CleanupResult> => this.updateDatabaseAndCleanup(projectId, deployResult.workerUrl, sandboxResult.sandboxId));

        logStep('Workflow', `Deployment completed successfully for project ${projectId}`);
        return { success: true, workerUrl: deployResult.workerUrl, message: 'Project deployed successfully via Workflow' };
    }

    async validateAndPrepare(projectId: string, customDomain: string | undefined, orgId: string, userId: string): Promise<ValidationResult> {
        return executeStep('Validation', async () => {
            logStep('Validation', `Validating project ${projectId} for user ${userId}`);

            if (!projectId || !orgId || !userId) throw new Error('Missing required parameters');
            if (!this.env.CLOUDFLARE_ACCOUNT_ID || !this.env.CLOUDFLARE_API_TOKEN) {
                throw new Error('Missing Cloudflare credentials');
            }

            // Check and deduct deploy quota FIRST to avoid duplicate deductions during retries
            logStep('Validation', `Checking deploy quota for organization ${orgId}`);
            const hasQuota = await checkAndUpdateDeployUsageForWorkflow(orgId, this.env);
            if (!hasQuota) {
                throw new Error(`Deploy quota exhausted for organization ${orgId}. Please upgrade your plan or wait for quota reset.`);
            }
            logStep('Validation', `Deploy quota deducted successfully for organization ${orgId}`);

            const db = await getDbForWorkflow(this.env);
            const projectData = await db.select().from(project)
                .where(and(eq(project.id, projectId), eq(project.organizationId, orgId))).limit(1);

            if (!projectData?.[0]?.isActive) {
                throw new Error(`Project ${projectId} not found or inactive`);
            }

            logStep('Validation', `Project validation successful for ${projectId}`);
            return {
                projectData: projectData[0],
                deploymentConfig: {
                    projectId,
                    workerName: `${projectId}-worker`,
                    customDomain,
                    template: getDynamicDeploymentTemplate(),
                    timeout: DEPLOYMENT_CONFIG.TIMEOUT
                }
            };
        });
    }

    async createSandbox(deploymentConfig: { template: string; timeout: number }): Promise<SandboxResult> {
        return executeStep('Sandbox Creation', async () => {
            logStep('Sandbox Creation', `Creating sandbox for ${deploymentConfig.template}`);

            const container = await createDeploymentSandbox(deploymentConfig.template, {
                timeoutMs: deploymentConfig.timeout,
                envs: {
                    CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID,
                    CLOUDFLARE_API_TOKEN: this.env.CLOUDFLARE_API_TOKEN,
                }
            });

            // Get sandbox ID from abstraction layer
            const sandboxId = container.id;

            logStep('Sandbox Creation', `Sandbox created successfully: ${sandboxId}`);
            return {
                sandboxId,
                sandboxInfo: {
                    template: deploymentConfig.template,
                    timeout: deploymentConfig.timeout,
                    envs: {
                        CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID,
                        CLOUDFLARE_API_TOKEN: this.env.CLOUDFLARE_API_TOKEN
                    }
                }
            };
        });
    }

    async syncFiles(sandboxId: string, projectId: string, orgId: string): Promise<SyncResult> {
        return executeStep('File Sync', async () => {
            logStep('File Sync', `Syncing files to sandbox ${sandboxId} for project ${projectId}`);

            // Get project data from database
            const db = await getDbForWorkflow(this.env);
            const projectData = await db.select().from(project)
                .where(and(eq(project.id, projectId), eq(project.organizationId, orgId)))
                .limit(1);

            if (!projectData?.[0]) {
                throw new Error(`Project ${projectId} not found or access denied`);
            }
            // Get initial file structure from template
            const initFiles = templateConfigs.vite;

            // Parse message history from project data
            const historyMessages = parseMessageHistory(projectData[0].messageHistory);

            logStep('File Sync', `Processing ${historyMessages.length} history messages`);

            const { fileMap } = buildFilesWithHistory(initFiles, historyMessages) || { fileMap: {} };
            // Add badge.js for free users TODO
            // const isPremiumUser = await hasPremiumMembership(orgId).catch(() => false);
            // if (!isPremiumUser && fileMap && 'index.html' in fileMap) {
            //     const indexFile = fileMap['index.html'] as any;
            //     if (indexFile?.type === 'file' && !indexFile.isBinary) {
            //         try {
            //             const content = indexFile.content;
            //             const badgeScript = `<script src="${getCdnStaticAssetUrl('badge.js')}"></script>`;
            //             const bodyMatch = content.match(/(\s*)<\/body>/i);
            //
            //             indexFile.content = bodyMatch
            //                 ? content.replace(/(\s*)<\/body>/i, `${badgeScript}\n$1</body>`)
            //                 : `${content}\n${badgeScript}`;
            //
            //             logStep('File Sync', 'Added badge.js script to index.html');
            //         } catch (error) {
            //             console.error('[Workflow] Error adding badge.js:', error);
            //         }
            //     }
            // }

            const filesToWrite = Object.entries(fileMap)
                .filter(([path]) => !isExcludedFile(path))
                .map(([path, fileInfo]) => ({
                    path: `/home/user/vite-shadcn-template-builder-libra/${path}`,
                    data:
                        fileInfo.type === 'file' && !fileInfo.isBinary
                            ? fileInfo.content
                            : JSON.stringify(fileInfo.content),
                }));

            const sandbox = await connectToSandbox(sandboxId);
            // Use abstraction layer method
            const sandboxFiles = filesToWrite.map(file => ({
                path: file.path,
                content: file.data,
                isBinary: false
            }))

            const result = await sandbox.writeFiles(sandboxFiles)

            // Check for errors in the result
            if (!result.success) {

                const errorDetails = result.results
                    .filter((r: { success: boolean }) => !r.success)
                    // @ts-ignore
                    .map((r: { path: string; error?: string }) => `${r.path}: ${r.error || 'Unknown error'}`)
                    .join(', ')
                throw new Error(`Failed to sync files: ${errorDetails}`)
            }
            return { filesSynced: filesToWrite.length, buildReady: true };
        });
    }

    async buildProject(sandboxId: string): Promise<BuildResult> {
        return executeStep('Build', async () => {
            logStep('Build', `Building project in sandbox ${sandboxId}`);

            const container = await connectToSandbox(sandboxId);

            // Install dependencies
            await executeCommand(container, `cd ${DEPLOYMENT_CONFIG.PROJECT_PATH} && bun install`, 0, 'Install');
            logStep('Build', 'Dependencies installed');

            // Build project
            await executeCommand(container, `cd ${DEPLOYMENT_CONFIG.PROJECT_PATH} && bun run build`, DEPLOYMENT_CONFIG.TIMEOUTS.BUILD, 'Build');
            logStep('Build', 'Build completed successfully');

            return { buildSuccess: true, buildOutput: 'Build completed successfully' };
        });
    }

    async deployToCloudflare(sandboxId: string, workerName: string, env: Bindings): Promise<DeployResult> {
        return executeStep('Deploy', async () => {
            logStep('Deploy', `Deploying ${workerName} to Cloudflare Workers`);

            const container = await connectToSandbox(sandboxId);
            await executeCommand(
                container,
                `cd ${DEPLOYMENT_CONFIG.PROJECT_PATH} && bun wrangler deploy --dispatch-namespace libra-dispatcher --name ${workerName}`,
                DEPLOYMENT_CONFIG.TIMEOUTS.DEPLOY,
                'Deploy'
            );

            // Use NEXT_PUBLIC_DISPATCHER_URL environment variable instead of hardcoded domain
            const rawDispatcherUrl = env.NEXT_PUBLIC_DISPATCHER_URL;
            const dispatcherUrl = rawDispatcherUrl || 'https://zapid.dev';

            logStep('Deploy', `Environment NEXT_PUBLIC_DISPATCHER_URL: ${rawDispatcherUrl}`);
            logStep('Deploy', `Using dispatcher URL: ${dispatcherUrl}`);
            logStep('Deploy', `Dispatcher URL type: ${typeof dispatcherUrl}, length: ${dispatcherUrl?.length}`);

            // Validate and extract the domain from the dispatcher URL
            let dispatcherDomain: string;
            try {
                // Ensure the URL is valid and has a proper format
                if (!dispatcherUrl || typeof dispatcherUrl !== 'string' || dispatcherUrl.trim() === '') {
                    throw new Error('Dispatcher URL is empty or invalid');
                }

                const urlObj = new URL(dispatcherUrl.trim());
                dispatcherDomain = urlObj.hostname;
                logStep('Deploy', `Extracted dispatcher domain: ${dispatcherDomain}`);
            } catch (urlError) {
                logStep('Deploy', `Invalid dispatcher URL: "${dispatcherUrl}", error: ${urlError}`);
                // Fallback to zapid.dev if URL parsing fails
                dispatcherDomain = 'zapid.dev';
                logStep('Deploy', `Using fallback domain: ${dispatcherDomain}`);
            }

            const workerUrl = `https://${workerName}.${dispatcherDomain}`;
            logStep('Deploy', `Deployment completed. Worker URL: ${workerUrl}`);

            return { workerUrl, deploymentSuccess: true };
        });
    }

    async updateDatabaseAndCleanup(projectId: string, workerUrl: string, sandboxId: string): Promise<CleanupResult> {
        return executeStep('Cleanup', async () => {
            logStep('Cleanup', `Updating database for project ${projectId} and cleaning up sandbox ${sandboxId}`);

            let databaseUpdated = false;
            let sandboxCleaned = false;

            // Update database
            const db = await getDbForWorkflow(this.env);
            try {
                await db.update(project).set({ productionDeployUrl: workerUrl }).where(eq(project.id, projectId));
                databaseUpdated = true;
                logStep('Cleanup', `Database updated with URL ${workerUrl}`);
            } catch (dbError) {
                console.error('[Workflow] Database update failed:', dbError);
            } finally {
                // Clean up database connection
                // Note: In workflow context, we don't have c.executionCtx, but the connection will be cleaned up when the workflow completes
                try {
                    await db.$client.end();
                } catch (cleanupError) {
                    console.error('[Workflow] Database connection cleanup failed:', cleanupError);
                }
            }

            // Clean up sandbox
            try {
                sandboxCleaned = await terminateDeploymentSandbox(sandboxId, {
                    timeoutMs: DEPLOYMENT_CONFIG.TIMEOUTS.SANDBOX_CLEANUP
                });

                if (sandboxCleaned) {
                    logStep('Cleanup', `Sandbox ${sandboxId} cleaned up successfully`);
                } else {
                    logStep('Cleanup', `Sandbox ${sandboxId} cleanup failed`);
                }
            } catch (sandboxError) {
                console.error('[Workflow] Sandbox cleanup failed:', sandboxError);
                sandboxCleaned = false;
            }

            if (!databaseUpdated) throw new Error('Failed to update database with production URL');
            return { databaseUpdated, sandboxCleaned };
        });
    }
}

export default app;
