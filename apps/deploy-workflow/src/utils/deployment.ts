/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * deployment.ts
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
import { log, tryCatch } from '@libra/common'

// Import unified sandbox configuration
import {
    DEPLOYMENT_CONFIG,
    getSandboxFactory,
    initializeSandboxFactory,
    createConfigFromEnvironment,
    getBuilderDefaultProvider,
    type ISandbox,
    type SandboxProviderType
} from '@libra/sandbox'

// Re-export for backward compatibility
export { DEPLOYMENT_CONFIG }


//
// // File exclusion check - now uses unified configuration
// export function isExcludedFile(path: string): boolean {
//     return DEPLOYMENT_CONFIG.EXCLUDED_PATTERNS.some(pattern => path.includes(pattern));
// }

// Unified error handling wrapper
export async function executeStep<T>(stepName: string, operation: () => Promise<T>): Promise<T> {
    const [result, error] = await tryCatch(operation);
    if (error) {
        console.error(`[Workflow] ${stepName} failed:`, error);
        throw new Error(`${stepName} failed: ${error.message || 'Unknown error'}`);
    }

    return result;
}

// Unified logging function
export function logStep(stepName: string, message: string, data?: any): void {
    const logMessage = `[Workflow] ${stepName}: ${message}`;
    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
}

// Sandbox abstraction layer imports are now consolidated above

/**
 * Get the default sandbox provider for deployment environment
 * @returns {SandboxProviderType} The selected sandbox provider type
 */
function getDefaultSandboxProvider(): SandboxProviderType {
    // Use the builder default provider from environment variable
    // This allows dynamic switching between e2b and daytona based on NEXT_PUBLIC_SANDBOX_BUILDER_DEFAULT_PROVIDER
    return getBuilderDefaultProvider();
}


export function getTemplateForProviderForBuilder(provider: SandboxProviderType): string {
    switch (provider) {
        case 'e2b':
            return DEPLOYMENT_CONFIG.TEMPLATES.E2B;
        case 'daytona':
            return DEPLOYMENT_CONFIG.TEMPLATES.DAYTONA;
        default:
            logStep('Sandbox Config', `Unknown provider ${provider}, using E2B template`);
            return DEPLOYMENT_CONFIG.TEMPLATES.E2B;
    }
}

/**
 * Sandbox connection helper using abstraction layer
 * @param sandboxId - The sandbox ID to connect to
 * @returns {Promise<ISandbox>} Sandbox instance
 */
export async function connectToSandbox(sandboxId: string): Promise<ISandbox> {
    logStep('Sandbox Connect', `Connecting to sandbox: ${sandboxId}`);

    // Initialize factory if needed
    const config = createConfigFromEnvironment();
    await initializeSandboxFactory(config);

    const factory = getSandboxFactory();
    const provider = getDefaultSandboxProvider();
    const sandbox = await factory.connectToSandbox(sandboxId, provider);

    logStep('Sandbox Connect', 'Connected successfully', {
        sandboxId: sandbox.id,
        provider
    });
    return sandbox;
}

/**
 * Create sandbox using abstraction layer
 * @param baseTemplate - The sandbox template to use
 * @param options - Creation options including timeout and environment variables
 * @returns {Promise<ISandbox>} Created sandbox instance
 */
export async function createDeploymentSandbox(
    baseTemplate: string,
    options: { timeoutMs?: number; envs?: Record<string, string> } = {}
): Promise<ISandbox> {
    const provider = getDefaultSandboxProvider();
    const template = getTemplateForProviderForBuilder(provider);

    logStep('Sandbox Create', `Creating sandbox with template: ${template}`, {
        provider,
        baseTemplate,
        resolvedTemplate: template,
        ...options
    });

    // Initialize factory if needed
    const config = createConfigFromEnvironment();
    await initializeSandboxFactory(config);

    const factory = getSandboxFactory();
    const sandbox = await factory.createSandbox({
        provider,
        template,
        timeoutMs: options.timeoutMs,
        env: options.envs
    });

    logStep('Sandbox Create', 'Created successfully', {
        sandboxId: sandbox.id,
        provider,
        template
    });
    return sandbox;
}

/**
 * Terminate sandbox using abstraction layer
 * @param sandboxId - The sandbox ID to terminate
 * @param options - Termination options including timeout
 * @returns {Promise<boolean>} True if termination was successful
 */
export async function terminateDeploymentSandbox(
    sandboxId: string,
    options: { timeoutMs?: number } = {}
): Promise<boolean> {
    if (!sandboxId || sandboxId.startsWith('sandbox-')) {
        logStep('Sandbox Terminate', `Skipping termination for mock sandbox: ${sandboxId}`);
        return true;
    }

    logStep('Sandbox Terminate', `Terminating sandbox: ${sandboxId}`, options);

    // Initialize factory if needed
    const config = createConfigFromEnvironment();
    await initializeSandboxFactory(config);

    const factory = getSandboxFactory();
    const provider = getDefaultSandboxProvider();

    const result = await factory.getProvider(provider).terminate(sandboxId, {
        timeoutMs: options.timeoutMs || 30_000
    });

    logStep('Sandbox Terminate', 'Terminated successfully', {
        sandboxId,
        success: result.success
    });
    return result.success;
}


// Command execution helper
export async function executeCommand(
    container: ISandbox,
    command: string,
    timeoutMs: number,
    stepName: string
) {
    logStep(stepName, `Executing: ${command}`, { timeoutMs });

    const result = await container.executeCommand(command, {
        timeoutMs,
        onStderr: (data: string) => console.error(`[Workflow ${stepName} Error] ${data}`)
    });

    // Check exit code
    if (result.exitCode !== 0) {
        const errorDetails = [];
        if (result.stdout) errorDetails.push(`STDOUT: ${result.stdout}`);
        if (result.stderr) errorDetails.push(`STDERR: ${result.stderr}`);

        const errorMessage = `${stepName} failed with exit code ${result.exitCode}${errorDetails.length > 0 ? `\n${errorDetails.join('\n')}` : ''
            }`;

        logStep(stepName, errorMessage);
        throw new Error(errorMessage);
    }

    logStep(stepName, 'Command completed successfully', {
        exitCode: result.exitCode,
        hasStdout: !!result.stdout,
        hasStderr: !!result.stderr
    });
    return result;
}
