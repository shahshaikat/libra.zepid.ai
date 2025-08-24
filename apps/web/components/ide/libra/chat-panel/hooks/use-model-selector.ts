/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * use-model-selector.ts
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

import type { KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AIModel,
  findModelById,
  getAvailableModels,
  getDefaultModelForPlan,
} from '@/configs/ai-models'

interface UseModelSelectorProps {
  selectedModelId?: string | undefined
  onModelChange?: ((modelId: string) => void) | undefined
  usageData?: any
  isUsageLoading?: boolean | undefined
}

export const useModelSelector = ({
  selectedModelId,
  onModelChange,
  usageData,
  isUsageLoading,
}: UseModelSelectorProps) => {
  // Create mock error states for compatibility
  const usageError = null
  const isUsageError = false

  // Get user's current plan
  const userPlan = usageData?.plan || 'zepid free'

  // Get available models based on user's plan
  const availableModels = getAvailableModels(userPlan)

  // Model selector related state
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (selectedModelId) {
      const model = findModelById(selectedModelId)
      // Check if user can access this model
      const canAccess = availableModels.some((m) => m.id === model.id)
      if (canAccess) {
        return model
      }
    }
    // Return default model for user's plan
    return getDefaultModelForPlan(userPlan)
  })

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, bottom: 0, opacity: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Update dropdown menu position
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
        opacity: 1,
      })
    }
  }, [])

  // Update position when dropdown menu is open
  // @ts-ignore
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition()
      window.addEventListener('resize', updateDropdownPosition)
      return () => window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [isDropdownOpen, updateDropdownPosition])

  // Update selected model when user plan changes or available models change
  useEffect(() => {
    // Check if current selected model is still available
    const isCurrentModelAvailable = availableModels.some((m) => m.id === selectedModel.id)

    if (!isCurrentModelAvailable) {
      // Switch to default model for user's plan
      const defaultModel = getDefaultModelForPlan(userPlan)
      setSelectedModel(defaultModel)
      onModelChange?.(defaultModel.id)
    }
  }, [availableModels, selectedModel.id, userPlan, onModelChange])

  // Handle clicking outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle model selection
  const handleModelSelect = useCallback(
    (model: AIModel) => {
      setSelectedModel(model)
      setIsDropdownOpen(false)
      onModelChange?.(model.id)
    },
    [onModelChange]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, model: AIModel) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleModelSelect(model)
      }
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    },
    [handleModelSelect]
  )

  // Toggle dropdown menu
  const toggleDropdown = useCallback(() => {
    if (!isDropdownOpen) {
      updateDropdownPosition()
    }
    setIsDropdownOpen((prev) => !prev)
  }, [isDropdownOpen, updateDropdownPosition])

  return {
    selectedModel,
    isDropdownOpen,
    dropdownPosition,
    dropdownRef,
    buttonRef,
    handleModelSelect,
    handleKeyDown,
    toggleDropdown,
    models: availableModels,
    userPlan,
    usageError,
    isUsageError,
  }
}
