/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * cloudflare-domain.ts
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

import { tryCatch } from '@libra/common'
import { env } from '../../env.mjs'

/**
 * Domain verification result interface
 */
export interface DomainVerificationResult {
  verified: boolean
  error?: string
  txtRecord?: string
}

/**
 * DNS query response interface
 */
interface DNSQueryResponse {
  Status: number
  Answer?: Array<{
    type: number
    data: string
  }>
}

/**
 * Cloudflare API error response interface
 */
interface CloudflareErrorResponse {
  errors?: Array<{
    message: string
  }>
}

/**
 * Cloudflare API response interface
 */
interface CloudflareResponse {
  success: boolean
  errors?: Array<{
    message: string
  }>
  result?: any
}

/**
 * DNS configuration result interface
 */
export interface DNSConfigurationResult {
  success: boolean
  error?: string
  recordId?: string
}

/**
 * Cloudflare ownership verification interface
 */
export interface OwnershipVerification {
  type: string
  name: string
  value: string
}

/**
 * Cloudflare custom hostname creation result
 */
export interface CustomHostnameResult {
  success: boolean
  error?: string
  customHostnameId?: string
  ownershipVerification?: OwnershipVerification
  sslStatus?: string
  status?: string
  verificationErrors?: string[]
}

/**
 * Generate DCV delegation CNAME record for domain ownership verification
 */
export function generateDCVRecord(domain: string): {
  name: string
  target: string
} {
  return {
    name: `_acme-challenge.${domain}`,
    target: `${domain}.dcv.cloudflare.com`
  }
}

/**
 * Verify domain ownership using DCV delegation CNAME record
 */
export async function verifyDomainOwnership(
  domain: string,
  _projectId?: string
): Promise<DomainVerificationResult> {
  const dcvRecord = generateDCVRecord(domain)

  const [result, error] = await tryCatch(async () => {
    // Use DNS over HTTPS to check CNAME records for DCV delegation
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${dcvRecord.name}&type=CNAME`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.statusText}`)
    }

    const dnsData = await response.json() as DNSQueryResponse

    if (dnsData.Status !== 0) {
      throw new Error('DNS query returned error status')
    }

    // Check if CNAME record points to the correct DCV target
    const cnameRecords = dnsData.Answer?.filter((record) => record.type === 5) || []
    const hasCorrectCNAME = cnameRecords.some((record) =>
      record.data === dcvRecord.target || record.data === `${dcvRecord.target}.`
    )

    return {
      verified: hasCorrectCNAME,
      txtRecord: `${dcvRecord.name} CNAME ${dcvRecord.target}`,
    }
  })

  if (error) {
    return {
      verified: false,
      error: error.message,
      txtRecord: `${dcvRecord.name} CNAME ${dcvRecord.target}`,
    }
  }

  return result
}

/**
 * Create custom hostname using Cloudflare for SaaS API
 */
export async function createCustomHostname(
  domain: string,
  zoneId: string
): Promise<CustomHostnameResult> {
  const cloudflareApiToken = env.CLOUDFLARE_API_TOKEN

  if (!cloudflareApiToken) {
    return {
      success: false,
      error: 'Cloudflare API token not configured',
    }
  }

  const [result, error] = await tryCatch(async () => {
    // Create custom hostname with TXT record verification
    const hostnameData = {
      hostname: domain,
      // Use custom origin server from environment variable if provided, otherwise fall back to default
      custom_origin_server:
        env.CUSTOMERS_ORIGIN_SERVER || 'customers.zapid.dev',
      ssl: {
        method: 'txt',
        type: 'dv',
        settings: {
          http2: 'on',
          min_tls_version: '1.2',
          tls_1_3: 'on',
        },
      }
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hostnameData),
      }
    )

    if (!response.ok) {
      const errorData = await response.json() as CloudflareErrorResponse
      throw new Error(errorData.errors?.[0]?.message || 'Failed to create custom hostname')
    }

    const data = await response.json() as CloudflareResponse

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Custom hostname creation failed')
    }

    const result = data.result

    return {
      success: true,
      customHostnameId: result.id,
      ownershipVerification: result.ownership_verification,
      sslStatus: result.ssl?.status || 'pending',
    }
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return result
}

/**
 * Get custom hostname status from Cloudflare
 */
export async function getCustomHostnameStatus(
  customHostnameId: string,
  zoneId: string
): Promise<CustomHostnameResult> {
  const cloudflareApiToken = env.CLOUDFLARE_API_TOKEN

  if (!cloudflareApiToken) {
    return {
      success: false,
      error: 'Cloudflare API token not configured',
    }
  }

  const [result, error] = await tryCatch(async () => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${customHostnameId}`,
      {
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json() as CloudflareErrorResponse
      throw new Error(errorData.errors?.[0]?.message || 'Failed to get custom hostname status')
    }

    const data = await response.json() as CloudflareResponse

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to get custom hostname status')
    }

    const result = data.result

    return {
      success: true,
      customHostnameId: result.id,
      ownershipVerification: result.ownership_verification,
      sslStatus: result.ssl?.status || 'pending',
      status: result.status,
      verificationErrors: result.verification_errors || [],
    }
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return result
}

/**
 * Delete custom hostname from Cloudflare
 */
export async function deleteCustomHostname(
  customHostnameId: string,
  zoneId: string
): Promise<{ success: boolean; error?: string }> {
  const cloudflareApiToken = env.CLOUDFLARE_API_TOKEN

  if (!cloudflareApiToken) {
    return {
      success: false,
      error: 'Cloudflare API token not configured',
    }
  }

  const [result, error] = await tryCatch(async () => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${customHostnameId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json() as CloudflareErrorResponse
      throw new Error(errorData.errors?.[0]?.message || 'Failed to delete custom hostname')
    }

    return { success: true }
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return result
}

/**
 * Configure DNS record for custom domain using Cloudflare API
 */
export async function configureDomainDNS(
  domain: string,
  _workerName?: string
): Promise<DNSConfigurationResult> {
  const cloudflareApiToken = env.CLOUDFLARE_API_TOKEN

  if (!cloudflareApiToken) {
    return {
      success: false,
      error: 'Cloudflare API token not configured',
    }
  }

  const [result, error] = await tryCatch(async () => {
    // First, get the zone ID for the domain
    const zoneResult = await getZoneId(domain, cloudflareApiToken)
    if (!zoneResult.success) {
      throw new Error(zoneResult.error || 'Failed to get zone ID')
    }

    // Create CNAME record pointing to dispatcher
    const recordData = {
      type: 'CNAME',
      name: domain,
      content: 'libra-dispatcher.zapid.dev',
      ttl: 1, // Auto TTL
      proxied: true, // Enable Cloudflare proxy
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneResult.zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      }
    )

    if (!response.ok) {
      const errorData = await response.json() as CloudflareErrorResponse
      throw new Error(errorData.errors?.[0]?.message || 'Failed to create DNS record')
    }

    const data = await response.json() as CloudflareResponse

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'DNS record creation failed')
    }

    return {
      success: true,
      recordId: data.result.id,
    }
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return result
}

/**
 * Get Cloudflare zone ID for a domain
 */
async function getZoneId(domain: string, apiToken: string): Promise<{
  success: boolean
  zoneId?: string
  error?: string
}> {
  const [result, error] = await tryCatch(async () => {
    // Extract root domain (e.g., example.com from subdomain.example.com)
    const domainParts = domain.split('.')
    const rootDomain = domainParts.slice(-2).join('.')

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${rootDomain}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.statusText}`)
    }

    const data = await response.json() as CloudflareResponse

    if (!data.success || data.result.length === 0) {
      throw new Error('Domain not found in Cloudflare account')
    }

    return {
      success: true,
      zoneId: data.result[0].id,
    }
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return result
}

/**
 * Check SSL certificate status for a domain
 */
export async function checkSSLStatus(domain: string): Promise<{
  active: boolean
  error?: string
}> {
  const [result, error] = await tryCatch(async () => {
    // Simple SSL check by making HTTPS request
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    return {
      active: response.ok || response.status < 500, // Consider 4xx as SSL working
    }
  })

  if (error) {
    return {
      active: false,
      error: error.message,
    }
  }

  return result
}

/**
 * Validate domain name format
 */
export function validateDomainFormat(domain: string): {
  valid: boolean
  error?: string
} {
  if (!domain || domain.trim() === '') {
    return { valid: false, error: 'Domain name is required' }
  }

  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  // Basic domain format validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!domainRegex.test(cleanDomain)) {
    return { valid: false, error: 'Invalid domain name format' }
  }

  // Check for reserved domains
  const reservedDomains = [
    'localhost',
    'zapid.dev',
    'zepid.dev',
    'workers.dev',
  ]

  if (reservedDomains.some(reserved =>
    cleanDomain === reserved || cleanDomain.endsWith(`.${reserved}`)
  )) {
    return { valid: false, error: 'This domain is reserved and cannot be used' }
  }

  return { valid: true }
}
