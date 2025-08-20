/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * domains.ts
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

/**
 * Domain configuration for the dispatcher
 * Centralized management of supported domains and routing rules
 */

export interface DomainConfig {
  /** List of supported domains for subdomain routing */
  supportedDomains: string[]
  /** Reserved subdomain names that cannot be used as worker names */
  reservedSubdomains: string[]
  /** Default domain for development */
  developmentDomain: string
  /** Production domains */
  productionDomains: string[]
}

/**
 * Main domain configuration
 */
export const DOMAIN_CONFIG: DomainConfig = {
  supportedDomains: ['zapid.dev', 'dispatcher.zapid.dev', 'localhost'],
  reservedSubdomains: [
    'dispatcher',
    'api',
    'health',
    'admin',
    'system',
    'www',
    'mail',
    'ftp',
    'cdn',
    'assets',
    'static',
  ],
  developmentDomain: 'localhost',
  productionDomains: ['zapid.dev', 'dispatcher.zapid.dev'],
}

/**
 * Check if a hostname matches any supported domain pattern
 * Note: Domain restrictions have been removed - all domains are now supported
 */
export function isSupportedDomain(_hostname: string): boolean {
  // Accept all domains - no restrictions
  return true
}

/**
 * Extract subdomain from hostname
 * For zapid.dev domains, only extract subdomain if it's actually a subdomain (not the root domain)
 * For other domains, extract the first part before the first dot
 */
export function extractSubdomain(hostname: string): string | null {
  // Split hostname by dots
  const parts = hostname.split('.')

  // For zapid.dev domains (including root domain), we need at least 3 parts to have a subdomain
  // e.g., worker.zapid.dev has 3 parts, zapid.dev has 2 parts
  if (hostname === 'zapid.dev' || hostname.endsWith('.zapid.dev')) {
    if (parts.length >= 3) {
      const subdomain = parts[0]
      // Ensure it's a valid subdomain (not empty)
      if (subdomain && subdomain.trim() !== '') {
        return subdomain
      }
    }
    return null
  }

  // For other domains, extract subdomain if there are at least 3 parts
  // This ensures we don't treat root domains like "example.com" as having a subdomain
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Ensure it's a valid subdomain (not empty)
    if (subdomain && subdomain.trim() !== '') {
      return subdomain
    }
  }

  return null
}

/**
 * Validate if a subdomain can be used as a worker name
 */
export function isValidWorkerSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!subdomain || subdomain.trim() === '') {
    return { valid: false, error: 'Subdomain is required' }
  }

  // Check if subdomain is reserved
  if (DOMAIN_CONFIG.reservedSubdomains.includes(subdomain.toLowerCase())) {
    return { valid: false, error: `Subdomain '${subdomain}' is reserved` }
  }

  // Basic format validation
  if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
    return { valid: false, error: 'Subdomain can only contain letters, numbers, and hyphens' }
  }

  // Length validation
  if (subdomain.length > 63) {
    return { valid: false, error: 'Subdomain must be 63 characters or less' }
  }

  // Cannot start or end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { valid: false, error: 'Subdomain cannot start or end with a hyphen' }
  }

  return { valid: true }
}
