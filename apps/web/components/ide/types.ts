/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * types.ts
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

import type { FileStructure, HistoryType } from '@libra/common'

// Basic message type
export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// File content mapping type
export interface FileContentMap {
  [path: string]: {
    content: string
    isBinary: boolean
    type: string
    parentPath?: string | null
  }
}

// Tree node structure interface
export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  _links: { self: string }
  depth: number
  // Explicitly set parentPath as optional
  parentPath: string | null
  // Keep the following fields optional
  children?: TreeNode[]
  content?: string
}

// Zepid component properties
export interface LibraProps {
  codePreviewActive: boolean
  initialMessages: HistoryType
  usageData?: any
  isUsageLoading?: boolean
}

/**
 * Return type for file tree hook
 */
export interface UseFileTreeReturn {
  isLoadingFileTree: boolean
  fileStructure: FileStructure | null
  treeContents: TreeNode[]
  fileContentMap: FileContentMap
  currentPath: string
  currentCode: string
  handleFileSelect: (path: string) => void
  prefetchFileContent: (path: string) => void
  setCurrentPath: (path: string) => void
  error: Error | null
  /** Update file content - used to update Map after AI modifies file content */
  updateFileContent: (path: string, content: string) => boolean
  /** Deploy project changes - trigger deployment and set URL */
  deployChanges: () => Promise<void>
}
