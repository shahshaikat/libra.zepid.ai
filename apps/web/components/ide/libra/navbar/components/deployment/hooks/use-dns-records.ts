/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * use-dns-records.ts
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

import { useMemo } from 'react'
import type { CustomDomainStatus } from '../../../types/deployment'
import * as m from '@/paraglide/messages'

/**
 * DNS record interface
 */
export interface DNSRecord {
  type: string
  name: string
  target: string
  status: 'pending' | 'verified' | 'active'
  description?: string
}

/**
 * Check if a domain is an apex domain (top-level domain like example.com)
 * vs a subdomain (like blog.example.com)
 */
function isApexDomain(domain: string): boolean {
  if (!domain) return false

  // Remove protocol if present and clean the domain
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()

  // Split by dots and check if it has exactly 2 parts (domain.tld)
  const parts = cleanDomain.split('.')

  // An apex domain should have exactly 2 parts (e.g., example.com)
  // More than 2 parts indicates a subdomain (e.g., blog.example.com)
  return parts.length === 2
}

/**
 * Custom hook for managing DNS records based on custom domain status
 */
export function useDnsRecords(customDomainStatus?: CustomDomainStatus): DNSRecord[] {
  return useMemo(() => {
    if (!customDomainStatus) return []

    const records: DNSRecord[] = []

    // Unified customer gateway domain, can be overridden by environment variable
    const customerOrigin = process.env.NEXT_PUBLIC_CUSTOMERS_ORIGIN_SERVER || 'customers.zapid.dev'

    // Phase 1: TXT record for ownership verification
    if (
      customDomainStatus.ownershipVerification &&
      (customDomainStatus.status === 'pending' || customDomainStatus.status === 'failed')
    ) {
      records.push({
        type: (customDomainStatus.ownershipVerification.type || 'TXT').toUpperCase(),
        name: customDomainStatus.ownershipVerification.name,
        target: customDomainStatus.ownershipVerification.value,
        status: 'pending',
        description: m["ide.deployment.customDomain.ownershipVerificationDescription"](),
      })
    }

    // Phase 2: SSL certificate and domain resolution records after hostname verification
    if (
      (customDomainStatus.status === 'verified' ||
        (customDomainStatus.status === 'active' && customDomainStatus.sslStatus === 'pending_validation')) &&
      customDomainStatus.customDomain
    ) {
      const domain = customDomainStatus.customDomain
      const isApex = isApexDomain(domain)

      // DCV delegation record for SSL certificate verification
      const dcvId = process.env.NEXT_PUBLIC_CLOUDFLARE_DCV_VERIFICATION_ID
      const needsSSLVerification =
        customDomainStatus.sslStatus === 'pending_validation' ||
        customDomainStatus.sslStatus === 'pending'

      if (dcvId && needsSSLVerification) {
        records.push({
          type: 'CNAME',
          name: `_acme-challenge.${domain}`,
          target: `${domain}.${dcvId}.dcv.cloudflare.com`,
          status: 'pending',
          description: m["ide.deployment.customDomain.sslCertificateVerificationDescription"]()
        })
      }

      if (isApex) {
        // For apex domains, provide A record as primary option
        const customerIP = process.env.NEXT_PUBLIC_CUSTOMERS_IP_ADDRESS || '192.0.2.1'
        records.push({
          type: 'A',
          name: domain,
          target: customerIP,
          status: 'pending',
          description: m["ide.deployment.customDomain.domainResolutionDescription"](),
        })

        // Also provide CNAME option for providers that support CNAME flattening
        records.push({
          type: 'CNAME',
          name: domain,
          target: customerOrigin,
          status: 'pending',
          description: m["ide.deployment.customDomain.cnameFlatteningDescription"](),
        })
      } else {
        // For subdomains, use CNAME record
        records.push({
          type: 'CNAME',
          name: domain,
          target: customerOrigin,
          status: 'pending',
          description: m["ide.deployment.customDomain.domainResolutionDescription"](),
        })
      }
    }

    return records
  }, [customDomainStatus])
}

/**
 * Get status color classes for different domain statuses
 */
export function getStatusColor(status?: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    case 'verified':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

/**
 * Get localized status text for different domain statuses
 */
export function getStatusText(status?: string): string {
  switch (status) {
    case 'active':
      return m["ide.deployment.customDomain.statusActive"]()
    case 'verified':
      return m["ide.deployment.customDomain.statusVerified"]()
    case 'pending':
      return m["ide.deployment.customDomain.statusPending"]()
    case 'failed':
      return m["ide.deployment.customDomain.statusFailed"]()
    default:
      return m["ide.deployment.customDomain.statusUnknown"]()
  }
}

/**
 * Check if domain is apex domain (exported for external use)
 */
export { isApexDomain }
