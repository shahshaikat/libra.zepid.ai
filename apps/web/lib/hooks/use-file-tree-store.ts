/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * use-file-tree-store.ts
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

import type { FileContentMap, TreeNode } from '@libra/common'
import type { FileStructure } from '@libra/common'
import { selectFile, updateFile } from 'apps/web/components/ide/libra/hooks/file-tree-handlers'
import { downloadProjectAsZip as downloadProjectAsZipUtil } from 'apps/web/components/ide/libra/filetree/utils/download-utils'
import { toast } from 'sonner'
import { create } from 'zustand'
import * as m from '@/paraglide/messages'

/**
 * File tree state management store
 */
interface FileTreeState {
  // Basic state
  isLoading: boolean
  error: Error | null
  fileStructure: FileStructure | null

  // Core state: two states migrated from useState
  treeContents: TreeNode[]
  fileContentMap: FileContentMap

  // Current file state
  currentPath: string
  currentCode: string

  // Download state
  isDownloading: boolean
  downloadProgress: number
  downloadError: string | null

  // State update methods
  setIsLoading: (isLoading: boolean) => void
  setError: (error: Error | null) => void
  setFileStructure: (fileStructure: FileStructure | null) => void
  setTreeContents: (treeContents: TreeNode[]) => void
  setFileContentMap: (fileContentMap: FileContentMap) => void
  setCurrentPath: (path: string) => void
  setCurrentCode: (code: string) => void

  // Download state update methods
  setIsDownloading: (isDownloading: boolean) => void
  setDownloadProgress: (progress: number) => void
  setDownloadError: (error: string | null) => void

  // File operation methods
  handleFileSelect: (path: string) => boolean
  updateFileContent: (path: string, content: string) => boolean

  // Download operation method
  downloadProjectAsZip: () => Promise<void>

  // Reset state
  reset: () => void
}

/**
 * Create file tree state management store
 */
export const useFileTreeStore = create<FileTreeState>((set, get) => ({
  // Initial state
  isLoading: true,
  error: null,
  fileStructure: null,
  treeContents: [],
  fileContentMap: {},
  currentPath: '',
  currentCode: '',

  // Download initial state
  isDownloading: false,
  downloadProgress: 0,
  downloadError: null,

  // State update methods
  setIsLoading: (isLoading: boolean) => {
    set({ isLoading })
  },

  setError: (error: Error | null) => {
    set({ error })
  },

  setFileStructure: (fileStructure: FileStructure | null) => {
    set({ fileStructure })
  },

  setTreeContents: (treeContents: TreeNode[]) => {
    set({ treeContents })
  },

  setFileContentMap: (fileContentMap: FileContentMap) => {
    set({ fileContentMap })
  },

  setCurrentPath: (path: string) => {
    set({ currentPath: path })
  },

  setCurrentCode: (code: string) => {
    set({ currentCode: code })
  },

  // Download state update methods
  setIsDownloading: (isDownloading: boolean) => {
    set({ isDownloading })
  },

  setDownloadProgress: (progress: number) => {
    set({ downloadProgress: progress })
  },

  setDownloadError: (error: string | null) => {
    set({ downloadError: error })
  },

  // File operation methods
  handleFileSelect: (path: string) => {
    const { fileContentMap } = get()
    const content = selectFile(fileContentMap, path)

    if (content !== null) {
      set({
        currentCode: content,
        currentPath: path,
      })
      return true
    }

    return false
  },

  updateFileContent: (path: string, content: string) => {
    const { fileContentMap, treeContents, currentPath } = get()

    if (!path || content == null) {
      return false
    }

    const { updatedFileMap, updatedTreeContents, success } = updateFile(
      fileContentMap,
      treeContents,
      path,
      content
    )

    if (success) {
      // Update state
      set({
        fileContentMap: updatedFileMap,
        treeContents: updatedTreeContents,
      })

      // If currently viewing this file, update current code
      if (currentPath === path) {
        set({ currentCode: content })
      }
    }

    return success
  },

  // Download operation method
  downloadProjectAsZip: async () => {
    const { fileContentMap, setIsDownloading, setDownloadProgress, setDownloadError } = get()

    try {
      // Reset download state
      setDownloadError(null)
      setIsDownloading(true)
      setDownloadProgress(0)

      // Check if there are files to download
      if (!fileContentMap || Object.keys(fileContentMap).length === 0) {

        // Create sample files for testing if no files exist
        const sampleFileMap: FileContentMap = {
          'README.md': {
            content: '# Libra Project\n\nThis is a sample project created by Zepid AI.\n\n## Features\n\n- File tree management\n- Code editing\n- Project download\n',
            isBinary: false,
            type: 'file',
            parentPath: null
          },
          'src/index.js': {
            content: '// Sample JavaScript file\nfunction main() {\n  // Main function implementation\n}\n\nmain();\n',
            isBinary: false,
            type: 'file',
            parentPath: 'src'
          },
          'src/styles.css': {
            content: '/* Sample CSS file */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  background: white;\n  padding: 20px;\n  border-radius: 8px;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}\n',
            isBinary: false,
            type: 'file',
            parentPath: 'src'
          },
          'package.json': {
            content: '{\n  "name": "libra-sample-project",\n  "version": "1.0.0",\n  "description": "A sample project created by Zepid AI",\n  "main": "src/index.js",\n  "scripts": {\n    "start": "node src/index.js"\n  },\n  "keywords": ["libra", "ai", "sample"],\n  "author": "Zepid AI",\n  "license": "MIT"\n}\n',
            isBinary: false,
            type: 'file',
            parentPath: null
          }
        }

        // Use sample files for download
        await downloadProjectAsZipUtil(sampleFileMap, (progress) => {
          setDownloadProgress(progress)
        })

        toast.success(m["lib.fileTree.sampleDownloadSuccess"]())
        return
      }

      // Use download utility with progress callback
      await downloadProjectAsZipUtil(fileContentMap, (progress) => {
        setDownloadProgress(progress)
      })
      toast.success(m["lib.fileTree.downloadSuccess"]())

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed'
      setDownloadError(errorMessage)
      toast.error(m["lib.fileTree.downloadFailed"]({ errorMessage }))
    } finally {
      setIsDownloading(false)
    }
  },

  // Reset state
  reset: () => {
    set({
      isLoading: true,
      error: null,
      fileStructure: null,
      treeContents: [],
      fileContentMap: {},
      currentPath: '',
      currentCode: '',
      isDownloading: false,
      downloadProgress: 0,
      downloadError: null,
    })
  },
}))
