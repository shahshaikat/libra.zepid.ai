/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * index.tsx
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

import { ThemeSwitcher } from '@/components/common/theme-switcher'
import UserButton from '@/components/common/user-button'
import { useProjectContext } from '@/lib/hooks/use-project-id'

import { SegmentedControl } from '@/components/ui/segmented-control'

import { Button } from '@libra/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@libra/ui/components/tooltip'
import { cn } from '@libra/ui/lib/utils'
import { Code, EyeIcon, Search, Rocket, Share } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { usePreviewStore } from '@/components/ide/libra/hooks/use-preview-store'
import { ShareProjectModal } from './components/share-project-modal'
import { isQuotaExceeded } from '@/components/ide/libra/chat-panel/utils/quota-utils'
import { toast } from '@libra/ui/components/sonner'
import Github from '@/components/logos/github'
import GitHubModal from '@/components/ide/libra/github-integration/github-modal'
import { DeploymentDialog } from './components/deployment'
import { useDeployment } from './hooks/use-deployment'
import * as m from '@/paraglide/messages'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'

/**
 * IDE Navbar
 *
 */
export default function Navbar({
  codePreviewActive,
  toggleCodePreview,
  usageData,
  toggleSidebar,
  isUsageLoading,
}: {
  codePreviewActive: boolean
  toggleCodePreview: () => void
  usageData?: any
  toggleSidebar?: () => void
  isUsageLoading?: boolean
}): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showGitHubModal, setShowGitHubModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { projectId } = useProjectContext()
  const { setIsPreviewVisible } = usePreviewStore()
  const { theme } = useTheme()



  // Get deployment functionality from custom hook
  const {
    isDeploying,
    deployProgress,
    deployStage,
    showDeployDialog,
    setShowDeployDialog,
    handleDeployClick,
    handleDeployConfirm,
    deployResult,
    existingDeployUrl,
    customDomainStatus,
    handleSetCustomDomain,
    handleVerifyCustomDomain,
    handleRemoveCustomDomain,
    isCustomDomainLoading,
  } = useDeployment(projectId)

  // Check if quota is exceeded
  const quotaExceeded = isQuotaExceeded(usageData)



  // Handle share functionality
  const handleShare = () => {
    setShowShareModal(true)
  }

  // Handle code preview toggle with quota check
  const handleCodePreviewToggle = () => {
    if (quotaExceeded) {
      toast.error(m['ide.navbar.quotaExceededUpgrade']())
      return
    }
    toggleCodePreview()

    // When switching to preview mode, set preview visible
    if (codePreviewActive) {
      setIsPreviewVisible(true)
    }
  }

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K triggers search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 10)
      }

      // Cmd+D or Ctrl+D triggers deployment
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        handleDeployClick()
      }

      // Esc key closes search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSearch, handleDeployClick])

  return (
    <header
      className={cn(
        'flex items-center justify-between w-full h-[var(--layout-nav-height)] text-fg px-2 sm:px-3 md:px-4 gap-1 sm:gap-2 md:gap-4',
        'backdrop-blur-[2px]',
        'border-b border-border/70',
        'shadow-[0_1px_0_0_hsl(var(--border)/0.3),0_1px_3px_0_rgba(0,0,0,0.04)]',
        'transition-colors duration-200',
        'py-1'
      )}
    >
      {/* Left side - Zepid Logo */}
      <div className='flex items-center pl-1 sm:pl-2'>
        {/* Zepid Logo */}
        <Link
          href='/dashboard'
          className={cn(
            'relative flex items-center justify-center',
            'h-10 sm:h-11 md:h-12 lg:h-14 w-10 sm:w-11 md:w-12 lg:w-14',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
          aria-label={m['ide.navbar.returnToDashboard']()}
        >
          <Image
            src='/libra-logo.svg'
            alt={m['ide.navbar.libraAltText']()}
            width={48}
            height={48}
            className='block dark:hidden w-full h-full object-contain'
            priority
          />
          <Image
            src='/libra-logo-dark.svg'
            alt={m['ide.navbar.libraAltText']()}
            width={48}
            height={48}
            className='hidden dark:block w-full h-full object-contain'
            priority
          />
        </Link>
      </div>

      {/* Right side - Function buttons and User */}
      <div className='flex items-center'>
        {/* Function button groups */}
        <div className='flex items-center gap-1 sm:gap-2 md:gap-3 mr-3 sm:mr-4 md:mr-6'>
          {/* Tool buttons group */}
          <div className='flex items-center gap-2'>
            {/* Small screen search button */}
            {isSmallScreen && (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 md:h-9 md:w-9 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors'
                onClick={() => {
                  setShowSearch(true)
                }}
                aria-label={m['ide.navbar.search']()}
              >
                <Search className='h-3.5 w-3.5 md:h-4 md:w-4' aria-hidden='true' />
              </Button>
            )}

            {/* Code/Preview segmented control */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SegmentedControl
                      options={[
                        {
                          value: 'code',
                          label: m['ide.navbar.code'](),
                          icon: <Code className='h-3.5 w-3.5' />,
                          disabled: quotaExceeded
                        },
                        {
                          value: 'preview',
                          label: m['ide.navbar.preview'](),
                          icon: <EyeIcon className='h-3.5 w-3.5' />,
                          disabled: quotaExceeded
                        }
                      ]}
                      value={codePreviewActive ? 'code' : 'preview'}
                      onValueChange={(value) => {
                        if (quotaExceeded) {
                          return
                        }
                        // Toggle when switching between values
                        if ((value === 'code' && !codePreviewActive) || (value === 'preview' && codePreviewActive)) {
                          handleCodePreviewToggle()
                        }
                      }}
                      disabled={quotaExceeded}
                      size='sm'
                      className='ml-1'
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {quotaExceeded
                      ? m['ide.navbar.quotaExceededUpgrade']()
                      : m['ide.navbar.switchModeTooltip']()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme switcher */}
            <ThemeSwitcher />
          </div>

          {/* Integration and deployment group */}
          <div className='flex items-center gap-2 md:gap-3'>
            {/* GitHub Integration Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowGitHubModal(true)}
                    className='h-8 w-8 md:h-9 md:w-9 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors'
                    aria-label={m['ide.navbar.exportToGitHub']()}
                  >
                    <Github className='h-3.5 w-3.5 md:h-4 md:w-4' aria-hidden='true' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{m['ide.navbar.exportToGitHub']()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Deploy Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleDeployClick}
                    disabled={isDeploying}
                    className={cn(
                      'relative px-2 sm:px-2.5 md:px-3 h-7 sm:h-8 md:h-9 min-w-[50px] sm:min-w-[70px] md:min-w-[90px]',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'text-xs md:text-sm font-medium',
                      // Special styles for deployment status
                      isDeploying && 'bg-accent/20 text-accent-foreground'
                    )}
                    aria-label={
                      isDeploying
                        ? m['ide.navbar.deployingAriaLabel']({ progress: deployProgress })
                        : m['ide.navbar.deployAriaLabel']()
                    }
                    aria-describedby={isDeploying ? 'deploy-progress' : undefined}
                  >
                    {isDeploying ? (
                      <>
                        <Rocket
                          className='h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5 animate-pulse'
                          aria-hidden='true'
                        />
                        <span className='hidden sm:inline'>{m['ide.navbar.deploying']()}</span>
                      </>
                    ) : (
                      <>
                        <Rocket
                          className='h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5 transition-transform hover:scale-110'
                          aria-hidden='true'
                        />
                        <span className='hidden sm:inline'>{m['ide.navbar.deploy']()}</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                  <div className='space-y-1'>
                    <p className='font-medium'>
                      {isDeploying
                        ? m['ide.navbar.deployingProject']()
                        : m['ide.navbar.deployProject']()}
                    </p>
                    {isDeploying && deployStage && (
                      <p className='text-xs text-muted-foreground'>
                        {m['ide.navbar.currentStage']({ stage: deployStage })}
                      </p>
                    )}
                    {!isDeploying && (
                      <p className='text-xs text-muted-foreground'>
                        {m['ide.navbar.deployShortcut']()}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* User actions */}
        <div className='flex items-center gap-3'>
          <RainbowButton
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="h-8 px-3 hover:scale-105 transition-all duration-200"
          >
            <Share className='h-3.5 w-3.5 mr-1.5' aria-hidden='true' />
            <span className="text-sm font-medium">{m['ide.navbar.share']()}</span>
          </RainbowButton>
          <UserButton />
        </div>
      </div>

      {/* GitHub Integration Modal */}
      <GitHubModal
        open={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        projectId={projectId}
      />

      {/* Share Project Modal */}
      <ShareProjectModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        projectId={projectId}
      />

      {/* Deploy Confirmation Dialog */}
      <DeploymentDialog
        open={showDeployDialog}
        onOpenChange={setShowDeployDialog}
        onConfirm={handleDeployConfirm}
        projectId={projectId}
        isDeploying={isDeploying}
        deployProgress={deployProgress}
        deployStage={deployStage}
        deployResult={deployResult}
        existingUrl={existingDeployUrl || ''}
        customDomainStatus={customDomainStatus || { status: null }}
        onSetCustomDomain={handleSetCustomDomain}
        onVerifyCustomDomain={handleVerifyCustomDomain}
        onRemoveCustomDomain={handleRemoveCustomDomain}
        isCustomDomainLoading={isCustomDomainLoading}
      />

      {isDeploying && (
        <div id='deploy-progress' className='sr-only' aria-live='polite' aria-atomic='true'>
          {m['ide.navbar.deployProgress']({
            progress: deployProgress,
            stage: deployStage || 'Preparing',
          })}
        </div>
      )}
    </header>
  )
}
