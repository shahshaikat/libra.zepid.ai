/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * message-list.tsx
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

import { CircleHelp } from 'lucide-react'
import { memo } from 'react'
import { Logo } from '@/components/common/logo/LogoImage'
import { MessageGroup as MessageGroupComponent } from './message-group'
import type { MessageGroup, BaseMessage } from './types'
import { isUserGroup } from './types'
import { UserMessageComponent } from './user-message'

// Define SelectedItem interface for better type safety
interface SelectedItem {
  id: string
  type: string
  content?: string
  [key: string]: unknown
}

interface MessageListProps {
  groupedMessages: MessageGroup[]
  isLoading: boolean
  loading: string | null
  onFileClick: (filePath: string) => void
  selectedItems: any[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  revertHistory?: (planId: string) => Promise<void>
  removeSelectedItem: (index: number) => void
  onContentHeightChange?: () => void
  allMessages?: BaseMessage[] // Add allMessages prop for accessing original message array including TimingMessages
}

const LibraHeader = memo(({ formattedDate }: { formattedDate: string }) => {
  return (
    <div className='flex items-center justify-between px-2 py-2 mb-1.5 rounded-lg bg-card/30'>
      <div className='flex items-center gap-1'>
        <Logo />
        <div className='flex flex-col'>
          <span className='text-accent text-accent-foreground'>Zepid AI</span>
          {formattedDate && <span className='text-xs text-fg-subtle'>{formattedDate}</span>}
        </div>
      </div>
    </div>
  )
})
LibraHeader.displayName = 'LibraHeader'

const EmptyState = memo(() => (
  <div className='flex flex-col items-center justify-center h-full py-12 px-4 text-center'>
    <div className='w-16 h-16 rounded-full flex items-center justify-center mb-4'>
      <CircleHelp className='w-8 h-8 text-accent' />
    </div>
    <h3 className='text-lg font-heading font-light uppercase text-fg mb-2'>
      Start your conversation
    </h3>
    <p className='text-sm text-fg-subtle max-w-md'>
      Ask questions in the input box below, and the AI assistant will help you solve problems. You
      can also use the selector to reference elements on the page.
    </p>
  </div>
))
EmptyState.displayName = 'EmptyState'

const MessageList = memo(
  ({
    groupedMessages,
    isLoading,
    loading: _loading,
    onFileClick,
    selectedItems,
    messagesEndRef,
    revertHistory,
    removeSelectedItem,
    onContentHeightChange,
    allMessages, // Add allMessages prop to access original message array
  }: MessageListProps) => {
    if (groupedMessages.length === 0) {
      return <EmptyState />
    }

    return (
      <div
        className='space-y-6 pb-4 pt-2 w-full'
        role='log'
        aria-live='polite'
        aria-label='Chat message list'
      >
        {groupedMessages.map((group, index) => {
          if (isUserGroup(group)) {
            if (group.messages && group.messages.length > 0) {
              return (
                <UserMessageComponent
                  key={`user-${group.messages[0]?.id || index}`}
                  group={group}
                  index={index}
                  isLastGroup={index === groupedMessages.length - 1}
                  selectedItems={selectedItems}
                  removeSelectedItem={removeSelectedItem}
                />
              )
            }
            return <div key={`empty-user-${group.planId || `fallback-${index}`}`} />
          }

          const isLastGroup = index === groupedMessages.length - 1

          // Extract timestamp from the first message in the group
          const getMessageTimestamp = (group: MessageGroup): Date | null => {
            if (!group.messages || group.messages.length === 0) {
              return null // No messages, no timestamp
            }

            // First, look for a timing message in allMessages for this planId (highest priority)
            if (allMessages && group.planId) {
              const timingMessage = allMessages.find(
                (msg) => msg.type === 'timing' && 'planId' in msg && (msg as BaseMessage & { planId: string }).planId === group.planId
              )
              if (timingMessage) {
                const timingMsgWithTimestamp = timingMessage as { timestamp?: number }
                if (timingMsgWithTimestamp.timestamp) {
                  return new Date(timingMsgWithTimestamp.timestamp)
                }
              }
            }

            // Fallback to first message timestamp field
            const firstMessage = group.messages[0]
            if (firstMessage?.timestamp && typeof firstMessage.timestamp === 'number') {
              return new Date(firstMessage.timestamp)
            }

            // Try to extract timestamp from planId (e.g., "update-1750136131527")
            const messageWithPlanId = firstMessage as { planId?: string }
            const planId = group.planId || messageWithPlanId.planId
            if (planId && typeof planId === 'string') {
              const timestampMatch = planId.match(/(\d{10,})/)
              if (timestampMatch?.[1]) {
                const timestamp = Number.parseInt(timestampMatch[1], 10)
                // Check if it's a valid timestamp (should be reasonable Unix timestamp)
                if (timestamp > 1000000000 && timestamp < 9999999999999) {
                  return new Date(timestamp)
                }
              }
            }

            // Return null if no valid timestamp found
            return null
          }

          const messageTimestamp = getMessageTimestamp(group)
          const formattedDate = messageTimestamp
            ? `${messageTimestamp.getHours().toString().padStart(2, '0')}:${messageTimestamp.getMinutes().toString().padStart(2, '0')} on ${messageTimestamp.toLocaleString('en-US', { month: 'short' })} ${messageTimestamp.getDate().toString().padStart(2, '0')}, ${messageTimestamp.getFullYear()}`
            : ''

          return (
            <div
              key={`ai-${group.planId || index}`}
              className='w-full animate-in fade-in slide-in-from-left-2 duration-300'
            >
              <LibraHeader formattedDate={formattedDate} />
              <div className='flex flex-col w-full rounded-lg border border-border shadow-sm hover:shadow transition-all duration-300 overflow-hidden bg-card/10'>
                <div className='w-full'>
                  <MessageGroupComponent
                    messages={group.messages}
                    onFileClick={onFileClick}
                    isLoading={isLastGroup && isLoading}
                    isLastMessageGroup={isLastGroup}
                    planId={group.planId}
                    onRevert={revertHistory}
                    onContentHeightChange={onContentHeightChange}
                  />
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} className='h-0.5 w-full' />
      </div>
    )
  }
)

MessageList.displayName = 'MessageList'

export { MessageList }
