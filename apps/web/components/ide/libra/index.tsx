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

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import ChatPanel from '@/components/ide/libra/chat-panel'
import { CodeExplorer } from '@/components/ide/libra/filetree/code-explorer'
import type { LibraProps } from '@/components/ide/types'
import BrowserPreview from './browser-preview'
import { ChatToggleButton } from './components/chat-toggle-button'
import { ErrorDisplay } from './components/error-display'
import { PANEL_CONFIG, PANEL_EVENTS } from './constants/panelConfig'
import { useFileTree } from './hooks/use-file-tree'
import { usePreviewStore } from './hooks/use-preview-store'
import { useLibraHandlers } from './hooks/useLibraHandlers'
import {
  type ImperativePanelHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './ui/resizable'
import { validateMessages } from './utils/messageValidation'

/**
 * Provide file browsing and editing capabilities
 */
export default function Zepid({
  codePreviewActive = false,
  initialMessages,
  usageData,
  isUsageLoading,
}: LibraProps) {
  // Generate unique IDs for panels
  const browserPanelId = useId()
  const chatPanelId = useId()

  // Validate initial messages
  const validatedMessages = useMemo(() => validateMessages(initialMessages), [initialMessages])

  // Note: usageData is now obtained in LayoutWrapper and passed down through props
  // This avoids duplicate API calls

  // Preview state management
  const { reset: resetPreviewStore } = usePreviewStore()

  // State management
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [inspectorActive, setInspectorActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'code'>('code')
  const [currentPreviewMode, setCurrentPreviewMode] = useState(codePreviewActive)

  // Responsive state
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Error monitoring state
  const [detectedErrors, setDetectedErrors] = useState<
    Array<{
      message: string
      filename?: string
      lineno?: number
      colno?: number
      stack?: string
      blankScreen?: boolean
    }>
  >([])

  // Handle error detection from browser preview
  const handleErrorDetected = (errorInfo: {
    message: string
    filename?: string
    lineno?: number
    colno?: number
    stack?: string
    blankScreen?: boolean
  }) => {
    setDetectedErrors((prev) => {
      // Avoid duplicate errors
      const isDuplicate = prev.some(
        (existing) =>
          existing.message === errorInfo.message &&
          existing.filename === errorInfo.filename &&
          existing.lineno === errorInfo.lineno
      )

      if (isDuplicate) return prev

      // Keep only the latest 5 errors
      return [errorInfo, ...prev.slice(0, 4)]
    })
  }

  // References
  const browserPanelRef = useRef<ImperativePanelHandle>(null)
  const chatPanelRef = useRef<ImperativePanelHandle>(null)
  const browserPreviewRef = useRef<any>(null)
  const chatPanelMethodsRef = useRef<{ addMessage: (message: any) => void } | null>(null)

  // Use file tree hook
  const {
    treeContents,
    currentPath,
    currentCode,
    handleFileSelect,
    prefetchFileContent,
    setCurrentPath,
    error,
    updateFileContent,
    deployChanges,
  } = useFileTree(initialMessages)

  // Use handler functions hook
  const { handleUpdateFileContent, toggleChat, handleSetActiveTab, handleChatFileClick } =
    useLibraHandlers({
      updateFileContent,
      currentPath,
      handleFileSelect,
      setCurrentPath,
      isChatOpen,
      setIsChatOpen,
      browserPanelRef,
      setActiveTab,
    })

  // Handle history update from code editor
  const handleHistoryUpdate = useCallback((message: any) => {
    if (chatPanelMethodsRef.current) {
      chatPanelMethodsRef.current.addMessage(message)
    }
  }, [])

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)

      // Auto-close chat on mobile
      if (width < 768 && isChatOpen) {
        setIsChatOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isChatOpen])

  // Listen for preview mode changes
  useEffect(() => {
    if (currentPreviewMode !== codePreviewActive) {
      setCurrentPreviewMode(codePreviewActive)
    }
  }, [codePreviewActive, currentPreviewMode])

  // Clear preview state when component unmounts
  useEffect(() => {
    return () => {
      resetPreviewStore()
    }
  }, [resetPreviewStore])

  // Display error state
  if (error) {
    return <ErrorDisplay />
  }

  // Get responsive panel sizes
  const getBrowserPanelSize = () => {
    if (isMobile) return PANEL_CONFIG.browser.defaultSize.mobile
    if (isTablet) return PANEL_CONFIG.browser.defaultSize.tablet
    return isChatOpen
      ? PANEL_CONFIG.browser.defaultSize.withChat
      : PANEL_CONFIG.browser.defaultSize.withoutChat
  }

  const getChatPanelSize = () => {
    if (isMobile) return PANEL_CONFIG.chat.defaultSize.mobile
    if (isTablet) return PANEL_CONFIG.chat.defaultSize.tablet
    return PANEL_CONFIG.chat.defaultSize.desktop
  }

  const getBrowserMinSize = () => {
    if (isMobile) return PANEL_CONFIG.browser.minSize.mobile
    if (isTablet) return PANEL_CONFIG.browser.minSize.tablet
    return PANEL_CONFIG.browser.minSize.desktop
  }

  return (
    <div className='h-full mx-auto flex flex-col relative'>
      {/* Mobile chat overlay */}
      {isMobile && isChatOpen && (
        <div className='fixed inset-0 z-50 bg-background'>
          <ChatPanel
            initialMessages={validatedMessages}
            onClose={toggleChat}
            onInspectorChange={setInspectorActive}
            initialInspectorActive={inspectorActive}
            browserPreviewRef={browserPreviewRef}
            onFileClick={handleChatFileClick}
            onFileContentUpdate={handleUpdateFileContent}
            deployChanges={deployChanges}
            usageData={usageData}
            isUsageLoading={isUsageLoading}
            detectedErrors={detectedErrors}
            chatPanelRef={chatPanelMethodsRef}
          />
        </div>
      )}

      {/* Toggle button */}
      {!isChatOpen && <ChatToggleButton onClick={toggleChat} />}

      {/* Main content area */}
      <ResizablePanelGroup
        direction={isMobile ? 'vertical' : 'horizontal'}
        className={PANEL_CONFIG.main.className}
        onLayout={PANEL_EVENTS.onLayout}
      >
        {/* Browser panel */}
        <ResizablePanel
          defaultSize={getBrowserPanelSize()}
          id={browserPanelId}
          order={1}
          minSize={getBrowserMinSize()}
          className={PANEL_CONFIG.browser.className}
          ref={browserPanelRef as any}
          onResize={PANEL_EVENTS.onBrowserResize}
        >
          <div className='h-full w-full'>
            {!currentPreviewMode ? (
              <BrowserPreview
                ref={browserPreviewRef}
                showChat={false}
                inspectorActive={inspectorActive}
                onInspectorChange={setInspectorActive}
                onErrorDetected={handleErrorDetected}
              />
            ) : (
              <div className={PANEL_CONFIG.codeExplorer.className}>
                <CodeExplorer
                  activeTab='code'
                  currentCode={currentCode}
                  currentPath={currentPath}
                  githubContents={treeContents}
                  prefetchFileContent={prefetchFileContent}
                  setActiveTab={handleSetActiveTab}
                  setCurrentPath={setCurrentPath}
                  updateFileContent={updateFileContent}
                  deployChanges={deployChanges}
                  onHistoryUpdate={handleHistoryUpdate}
                />
              </div>
            )}
          </div>
        </ResizablePanel>

        {/* Chat panel - hidden on mobile (uses overlay instead) */}
        {isChatOpen && !isMobile && (
          <>
            <ResizableHandle
              onPointerDown={PANEL_EVENTS.onResizeStart}
              onPointerUp={PANEL_EVENTS.onResizeEnd}
            />
            <ResizablePanel
              defaultSize={getChatPanelSize()}
              id={chatPanelId}
              order={2}
              minSize={PANEL_CONFIG.chat.minSize}
              maxSize={
                isTablet ? PANEL_CONFIG.chat.maxSize.tablet : PANEL_CONFIG.chat.maxSize.desktop
              }
              ref={chatPanelRef as any}
              collapsible={false}
              onResize={PANEL_EVENTS.onChatResize}
            >
              <ChatPanel
                initialMessages={validatedMessages}
                onClose={toggleChat}
                onInspectorChange={setInspectorActive}
                initialInspectorActive={inspectorActive}
                browserPreviewRef={browserPreviewRef}
                onFileClick={handleChatFileClick}
                onFileContentUpdate={handleUpdateFileContent}
                deployChanges={deployChanges}
                usageData={usageData}
                isUsageLoading={isUsageLoading}
                detectedErrors={detectedErrors}
                chatPanelRef={chatPanelMethodsRef}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
