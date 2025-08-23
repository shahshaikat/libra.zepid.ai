/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * github-modal.tsx
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

'use client'

import { useCallback, useEffect, useState } from 'react'

import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@libra/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@libra/ui/components/dialog'
import { cn } from '@libra/ui/lib/utils'

import Github from '@/components/logos/github'
import * as m from '@/paraglide/messages'

import type { GitHubModalProps, GitHubRepository, ProjectRepositoryInfo } from './types'
import { useGitHubIntegration } from './use-github-integration'

// Enhanced step indicator
import { StepIndicator, type Step } from './components/step-indicator'

// Step components
import { InstallStep } from './steps/install-step'
import { OAuthStep } from './steps/oauth-step'
import { RepositoryStep } from './steps/repository-step'

import { AutoCreateStep } from './steps/auto-create-step'
import { PushStep } from './steps/push-step'
import { SuccessStep } from './steps/success-step'

type ModalStep = 'install' | 'oauth' | 'repositories' | 'create' | 'push' | 'success' | 'auto-create'

// Step configuration for the indicator
const STEP_CONFIG: Record<ModalStep, { title: string; description: string }> = {
  install: {
    title: 'Install',
    description: 'Install GitHub App'
  },
  oauth: {
    title: 'Authorize',
    description: 'Grant permissions'
  },
  repositories: {
    title: 'Repository',
    description: 'Select repository'
  },
  'auto-create': {
    title: 'Create',
    description: 'Create repository'
  },
  create: {
    title: 'Create',
    description: 'Create repository'
  },
  push: {
    title: 'Push',
    description: 'Upload code'
  },
  success: {
    title: 'Complete',
    description: 'Integration ready'
  }
}

export default function GitHubModal({ open, onClose, projectId }: GitHubModalProps) {
  // Start with null to avoid showing install step before checking actual state
  const [currentStep, setCurrentStep] = useState<ModalStep | null>(null)
  const [projectRepoInfo, setProjectRepoInfo] = useState<ProjectRepositoryInfo | null>(null)
  const [isCreatingProjectRepo, setIsCreatingProjectRepo] = useState(false)

  const {
    state,
    authenticateWithGitHub,
    authorizeUserAccess,
    checkInstallationStatus,
    selectRepository,
    pushToRepository,
    setForcePush,
    getProjectRepository,
    createProjectRepository
  } = useGitHubIntegration()

  // Generate steps for the indicator based on current context
  const generateSteps = useCallback((): Step[] => {
    const baseSteps: ModalStep[] = ['install', 'oauth', 'repositories', 'push', 'success']

    // Modify steps based on project context
    if (projectId && projectRepoInfo !== null) {
      if (!projectRepoInfo.hasRepository) {
        // Replace repositories with auto-create for projects without repos
        const index = baseSteps.indexOf('repositories')
        if (index !== -1) {
          baseSteps[index] = 'auto-create'
        }
      }
    }

    return baseSteps.map(stepId => ({
      id: stepId,
      title: STEP_CONFIG[stepId].title,
      description: STEP_CONFIG[stepId].description,
      status: stepId === currentStep ? 'current' : 'pending'
    }))
  }, [currentStep, projectId, projectRepoInfo])

  // Check project repository status when modal opens
  useEffect(() => {
    if (open && projectId && state.auth.isAuthenticated) {
      getProjectRepository(projectId).then(setProjectRepoInfo)
    }
  }, [open, projectId, state.auth.isAuthenticated, getProjectRepository])

  // Determine current step based on installation and auth state
  useEffect(() => {
    if (open && !state.isCheckingInstallation) {
      const installation = state.installation

      console.log('[GitHub Modal] Determining step with state:', {
        hasInstallation: !!installation,
        isInstalled: installation?.isInstalled,
        requiresOAuth: installation?.requiresOAuth,
        isAuthenticated: state.auth.isAuthenticated,
        projectId,
        projectRepoInfo,
        isCheckingInstallation: state.isCheckingInstallation
      })

      // Priority 1: If authenticated and connected, proceed with integration flow
      if (state.auth.isAuthenticated) {
        if (projectId && projectRepoInfo !== null) {
          if (projectRepoInfo.hasRepository) {
            console.log('[GitHub Modal] Setting step to success - project has repository')
            setCurrentStep('success')
          } else {
            console.log('[GitHub Modal] Setting step to auto-create - project needs repository')
            setCurrentStep('auto-create')
          }
        } else if (projectId && projectRepoInfo === null) {
          console.log('[GitHub Modal] Waiting for project repository info to load')
          return
        } else {
          console.log('[GitHub Modal] Setting step to repositories - show repository selection')
          setCurrentStep('repositories')
        }
      }
      // Priority 2: If installed but requires OAuth authorization
      else if (installation?.isInstalled && installation.requiresOAuth) {
        console.log('[GitHub Modal] Setting step to oauth - installation requires OAuth')
        setCurrentStep('oauth')
      }
      // Priority 3: If explicitly not installed, show install step
      else if (installation && !installation.isInstalled) {
        console.log('[GitHub Modal] Setting step to install - GitHub app not installed')
        setCurrentStep('install')
      }
      // Priority 4: If no installation data available, show install step
      else if (!installation) {
        console.log('[GitHub Modal] Setting step to install - no installation data available')
        setCurrentStep('install')
      }
      // Fallback: If we have installation but not authenticated, show install step
      else {
        console.log('[GitHub Modal] Setting step to install - fallback case')
        setCurrentStep('install')
      }
    }
  }, [open, state.installation, state.auth.isAuthenticated, state.isCheckingInstallation, projectId, projectRepoInfo])

  const handleClose = () => {
    onClose()
    setTimeout(() => setCurrentStep(null), 300)
  }

  const handleInstallApp = async () => {
    await authenticateWithGitHub()
    setTimeout(async () => {
      await checkInstallationStatus()
    }, 1000)
  }

  const handleRepositorySelect = (repository: GitHubRepository) => {
    selectRepository(repository)
    setCurrentStep('push')
  }

  const handleAutoCreateRepository = useCallback(async () => {
    if (!projectId || !projectRepoInfo) return

    setIsCreatingProjectRepo(true)
    try {
      const result = await createProjectRepository({
        projectId,
        description: `Repository for ${projectRepoInfo.projectName} - Created with Zepid AI`,
        private: true
      })

      if (result) {
        setProjectRepoInfo(prev => prev ? {
          ...prev,
          gitUrl: result.repository.clone_url,
          gitBranch: result.repository.default_branch || 'main',
          hasRepository: true
        } : null)

        setCurrentStep('success')
      }
    } catch (error) {
      console.error('Failed to auto-create repository:', error)
    } finally {
      setIsCreatingProjectRepo(false)
    }
  }, [projectId, projectRepoInfo, createProjectRepository])

  // Auto-trigger repository creation
  useEffect(() => {
    if (currentStep === 'auto-create' && projectId && projectRepoInfo && !projectRepoInfo.hasRepository && !isCreatingProjectRepo) {
      handleAutoCreateRepository()
    }
  }, [currentStep, projectId, projectRepoInfo, isCreatingProjectRepo, handleAutoCreateRepository])

  const handlePushCode = async () => {
    console.log('[GitHub] handlePushCode called', {
      hasSelectedRepository: !!state.selectedRepository,
      selectedRepository: state.selectedRepository?.name,
      hasProjectRepoInfo: !!projectRepoInfo,
      projectRepoInfo: projectRepoInfo?.gitUrl,
      projectId,
      isAuthenticated: state.auth.isAuthenticated,
      isPushing: state.isPushing
    })

    if (!projectId) {
      console.log('[GitHub] No project ID available, aborting push')
      return
    }

    // Determine repository info to use: prioritize selectedRepository, otherwise use projectRepoInfo
    let targetRepository = state.selectedRepository

    if (!targetRepository && projectRepoInfo?.gitUrl) {
      // Create a virtual GitHubRepository object from projectRepoInfo
      console.log('[GitHub] Using projectRepoInfo to create virtual repository')

      // Extract repository name from gitUrl
      const gitUrl = projectRepoInfo.gitUrl
      const repoName = gitUrl.split('/').pop()?.replace('.git', '') || projectRepoInfo.projectName
      const htmlUrl = gitUrl.replace('.git', '').replace('https://github.com/', 'https://github.com/')

      // Extract owner and repo name from URL
      const urlParts = htmlUrl.replace('https://github.com/', '').split('/')
      const fullName = urlParts.length >= 2 ? `${urlParts[0]}/${urlParts[1]}` : `unknown/${repoName}`

      // Use special ID to identify this is a repository created from projectRepoInfo
      // Backend will handle this case through repositoryFullName
      const realRepositoryId = -1 // Special identifier, backend needs special handling

      targetRepository = {
        id: realRepositoryId,
        name: repoName,
        full_name: fullName,
        description: `Repository for ${projectRepoInfo.projectName}`,
        private: true,
        html_url: htmlUrl,
        clone_url: gitUrl,
        ssh_url: gitUrl.replace('https://github.com/', 'git@github.com:'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pushed_at: new Date().toISOString(),
        size: 0,
        stargazers_count: 0,
        watchers_count: 0,
        language: null,
        forks_count: 0,
        archived: false,
        disabled: false,
        open_issues_count: 0,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'private' as const,
        default_branch: projectRepoInfo.gitBranch || 'main',
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true
        }
      }
    }

    if (!targetRepository) {
      console.log('[GitHub] No repository available (neither selectedRepository nor projectRepoInfo), aborting push')
      return
    }

    console.log('[GitHub] Using repository:', {
      name: targetRepository.name,
      source: state.selectedRepository ? 'selectedRepository' : 'projectRepoInfo'
    })

    console.log('[GitHub] Calling pushToRepository with batch API and forcePush: true')
    const success = await pushToRepository({
      repository: targetRepository,
      projectId, // Pass project ID, let backend handle file retrieval
      commitMessage: 'Sync files from Zepid AI Web Coding',
      forcePush: true // Force push to ensure local changes override remote repository state
    })

    console.log('[GitHub] pushToRepository result:', success)
    if (success) {
      setCurrentStep('success')
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'install': return m['dashboard.integrations.github.modal.step_install']()
      case 'oauth': return m['dashboard.integrations.github.modal.step_oauth']()
      case 'repositories': return m['dashboard.integrations.github.modal.step_repositories']()
      case 'auto-create': return m['dashboard.integrations.github.modal.step_create']()
      case 'push': return m['dashboard.integrations.github.modal.step_push']()
      case 'success': return m['dashboard.integrations.github.modal.step_success']()
      case null: return 'GitHub Integration' // Fallback for null state
      default: return m['dashboard.integrations.github.modal.step_success']()
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'install': return m['dashboard.integrations.github.modal.description_install']()
      case 'oauth': return m['dashboard.integrations.github.modal.description_oauth']()
      case 'repositories': return m['dashboard.integrations.github.modal.description_repositories']()
      case 'auto-create': return m['dashboard.integrations.github.modal.description_create']()
      case 'push': return m['dashboard.integrations.github.modal.description_push']()
      case 'success': return m['dashboard.integrations.github.modal.description_success']()
      case null: return 'Setting up GitHub integration for your project' // Fallback for null state
      default: return ''
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'install':
        return (
          <InstallStep
            isLoading={state.auth.isLoading || state.isCheckingInstallation}
            error={state.auth.error}
            onInstall={handleInstallApp}
          />
        )
      case 'oauth':
        return (
          <OAuthStep
            installation={state.installation}
            isLoading={state.auth.isLoading}
            error={state.auth.error}
            onAuthorize={authorizeUserAccess}
          />
        )
      case 'repositories':
        return (
          <RepositoryStep
            installation={state.installation}
            repositories={state.repositories}
            onRepositorySelect={handleRepositorySelect}
          />
        )

      case 'auto-create':
        return (
          <AutoCreateStep
            projectRepoInfo={projectRepoInfo}
            isCreating={isCreatingProjectRepo}
            onSelectExisting={() => setCurrentStep('repositories')}
          />
        )
      case 'push':
        return (
          <PushStep
            selectedRepository={state.selectedRepository}
            isPushing={state.isPushing}
            pushError={state.pushError}
            onBack={() => setCurrentStep('repositories')}
            onPush={handlePushCode}
          />
        )
      case 'success':
        return (
          <SuccessStep
            installation={state.installation}
            selectedRepository={state.selectedRepository}
            projectRepoInfo={projectRepoInfo}
            isPushing={state.isPushing}
            isAuthLoading={state.auth.isLoading}
            forcePush={state.forcePush}
            onAuthorize={authorizeUserAccess}
            onPushCode={handlePushCode}
            onForcePushChange={setForcePush}
          />
        )
      default:
        return null
    }
  }

  const canGoBack = () => {
    return currentStep !== 'install' &&
      currentStep !== 'success' &&
      currentStep !== 'oauth' &&
      currentStep !== null
  }

  const handleBackNavigation = () => {
    if (currentStep === 'push') {
      setCurrentStep('repositories')
    } else if (currentStep === 'auto-create') {
      setCurrentStep('repositories')
    }
    // Add more navigation logic as needed
  }



  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-labelledby="github-modal-title"
        aria-describedby="github-modal-description"
      >
        {/* Enhanced Header with Step Indicator */}
        <DialogHeader className="space-y-6 pb-6 border-b border-border/50">
          <DialogTitle
            id="github-modal-title"
            className="flex items-center gap-3 text-xl font-bold"
          >
            {canGoBack() && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 -ml-2 hover:bg-muted/80 transition-colors"
                onClick={handleBackNavigation}
                aria-label="Go back to previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
                <Github className="w-5 h-5 text-foreground" aria-hidden="true" />
              </div>
              <span>{getStepTitle()}</span>
            </div>
          </DialogTitle>

          {/* Step Indicator */}
          {currentStep && (
            <div className="px-4">
              <StepIndicator
                steps={generateSteps()}
                currentStepId={currentStep}
                orientation="horizontal"
                showDescriptions={false}
                className="max-w-2xl mx-auto"
              />
            </div>
          )}

          <DialogDescription
            id="github-modal-description"
            className="text-center text-muted-foreground"
          >
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Content Area with Enhanced Loading State */}
        <div className="flex-1 overflow-y-auto">
          {state.isCheckingInstallation || currentStep === null ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center mx-auto border border-primary/10">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {state.isCheckingInstallation ? 'Checking Connection' : 'Loading'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {state.isCheckingInstallation
                      ? m['dashboard.integrations.github.modal.checking_connection']()
                      : m["ide.github.modal.loadingStatus"]()
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="max-w-2xl mx-auto">
                {renderCurrentStep()}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
