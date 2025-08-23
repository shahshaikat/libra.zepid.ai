/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * file-tree-handlers.ts
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

import { toast } from 'sonner';

import { addFileToTree, findNodeInTree, isBinaryFile, updateNodeInTree } from './file-tree-utils';
import { getFileContent } from '@libra/common';
import type { FileContentMap, TreeNode } from '@libra/common';

/**
 * Handle file selection
 *
 * @param fileContentMap File content mapping
 * @param path File path
 * @returns Selected file content, null if file doesn't exist
 */
export const selectFile = (fileContentMap: FileContentMap, path: string): string | null => {

  // Check path validity
  if (!path || typeof path !== 'string') {
    console.error("[Zepid] Invalid file path:", path);
    return null;
  }

  // Path normalization
  let normalizedPath = path;
  if (path.includes('/')) {
    const pathParts = path.split('/');
    // Remove duplicate parts, e.g. "src/src/app.js" -> "src/app.js"
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (pathParts[i] === pathParts[i + 1]) {
        pathParts.splice(i + 1, 1);
        i--; // Adjust index to compensate for removal
      }
    }
    normalizedPath = pathParts.join('/');
    if (normalizedPath !== path) {
    }
  }

  // Get file content
  const content = getFileContent(fileContentMap, normalizedPath);

  if (content !== null) {
    return content;
  }

  console.error(`[Zepid] File not found or not displayable: ${path}`);
  toast.error(`File not found or not readable: ${path}`);
  return null;
};

/**
 * Try to load default file
 *
 * @param fileContentMap File content mapping
 * @returns Default file path and content, null if not found
 */
export const loadDefaultFile = (fileContentMap: FileContentMap): { path: string; content: string } | null => {

  const availableFiles = Object.keys(fileContentMap);
  if (availableFiles.length === 0) {
    return null;
  }

  // Common main file list
  const commonFiles = [
    "README.md",
    "src/App.tsx",
    "src/App.jsx",
    "src/App.js",
    "src/main.tsx",
    "src/main.jsx",
    "src/main.js",
    "src/index.tsx",
    "src/index.jsx",
    "src/index.js",
    "index.html"
  ];

  // Find the first matching file
  const defaultFile = commonFiles.find(file =>
    availableFiles.includes(file) ||
    availableFiles.some(path => path.endsWith(`/${file}`))
  );

  if (defaultFile) {
    // Found exact match
    if (availableFiles.includes(defaultFile)) {
      const content = getFileContent(fileContentMap, defaultFile);
      return content !== null ? { path: defaultFile, content } : null;
    }

    // Found partial match
    const matchingPath = availableFiles.find(path => path.endsWith(`/${defaultFile}`));
    if (matchingPath) {
      const content = getFileContent(fileContentMap, matchingPath);
      return content !== null ? { path: matchingPath, content } : null;
    }
  }

  // If no common files found, load the first non-binary file
  for (const path of availableFiles) {
    const content = getFileContent(fileContentMap, path);
    if (content !== null) {
      return { path, content };
    }
  }

  return null;
};

/**
 * Update file content
 *
 * @param fileContentMap File content mapping
 * @param treeContents Tree structure content
 * @param path File path
 * @param content File content
 * @returns Update result: {updatedFileMap, updatedTreeContents, success}
 */
export const updateFile = (
  fileContentMap: FileContentMap,
  treeContents: TreeNode[],
  path: string,
  content: string
): { updatedFileMap: FileContentMap; updatedTreeContents: TreeNode[]; success: boolean } => {
  if (!path || content == null) {
    return {
      updatedFileMap: fileContentMap,
      updatedTreeContents: treeContents,
      success: false
    };
  }


  // Update file content mapping
  const updatedFileMap = { ...fileContentMap };

  // Check if file already exists
  if (updatedFileMap[path]) {
    // Update existing file
    updatedFileMap[path] = {
      ...updatedFileMap[path],
      content: content
    };
  } else {
    // Find matching path
    const allPaths = Object.keys(fileContentMap);
    const matchingPath = allPaths.find(p => {
      if (p === path) return true;
      if (path.includes('/')) {
        const fileName = path.split('/').pop();
        return p.endsWith(`/${fileName}`);
      }
      return p === path || p.endsWith(`/${path}`);
    });

    if (matchingPath) {
      // Update file with matching path
      updatedFileMap[matchingPath] = {
        ...(updatedFileMap[matchingPath] || {}),
        content: content,
        isBinary: updatedFileMap[matchingPath]?.isBinary ?? false,
        type: updatedFileMap[matchingPath]?.type ?? 'file'
      };
    } else {
      // Create new file

      // Explicitly set all required properties
      updatedFileMap[path] = {
        content,
        type: 'file',
        isBinary: isBinaryFile(path),
        parentPath: path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : null
      };
    }
  }

  // Update tree structure
  let updatedTreeContents = [...treeContents];

  // Determine whether to update or add based on file existence in tree
  const fileExists = findNodeInTree(updatedTreeContents, path);

  // Update existing file
  if (fileExists) {
    updatedTreeContents = updateNodeInTree(updatedTreeContents, path, content);
  } else {
    // Add new file
    updatedTreeContents = addFileToTree(updatedTreeContents, path, content);
  }

  return {
    updatedFileMap,
    updatedTreeContents,
    success: true
  };
}; 