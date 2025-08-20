/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * custom-domain-manager.tsx
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

import { useState, useId } from 'react'

import { Copy, ExternalLink, RefreshCw } from 'lucide-react'

import * as m from '@/paraglide/messages'

import { Badge } from '@libra/ui/components/badge'
import { Button } from '@libra/ui/components/button'
import { Card, CardContent } from '@libra/ui/components/card'

interface CustomDomainManagerProps {
  domain: string
  status: 'pending' | 'verified' | 'active' | 'failed'
  baseUrl: string
  onVerify?: () => void
  onRemove?: () => void
  isLoading?: boolean
}

interface DNSRecord {
  type: string
  name: string
  target: string
  status: 'pending' | 'verified' | 'active'
}

export function CustomDomainManager({
  domain,
  status,
  baseUrl,
  onVerify,
  onRemove,
  isLoading = false
}: CustomDomainManagerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const componentId = useId()

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
    }
  }

  const getStatusColor = (recordStatus: string) => {
    switch (recordStatus) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'verified':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (recordStatus: string) => {
    switch (recordStatus) {
      case 'active':
        return m["ide.deployment.customDomain.active"]()
      case 'verified':
        return m["ide.deployment.customDomain.verified"]()
      case 'pending':
        return m["ide.deployment.customDomain.pending"]()
      case 'failed':
        return m["ide.deployment.customDomain.failed"]()
      default:
        return m["ide.deployment.dialog.statusUnknown"]()
    }
  }

  // Generate DNS records based on domain and status
  const dnsRecords: DNSRecord[] = [
    {
      type: 'CNAME',
      name: `_acme-challenge.${domain}`,
      target: `${domain}.dcv.cloudflare.com`,
      status: status === 'active' ? 'active' : 'pending'
    },
    {
      type: 'CNAME',
      name: domain,
      target: 'customers.zapid.dev',
      status: status === 'active' ? 'active' : 'pending'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Base URL Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{m["ide.deployment.customDomain.baseUrl"]()}</h3>
        <div className="text-sm text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg">
          {baseUrl}
        </div>
      </div>

      {/* Your Domain Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{m["ide.deployment.customDomain.yourDomain"]()}</h3>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {getStatusText(status)}
            </Badge>
            {onVerify && (status === 'pending' || status === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={onVerify}
                disabled={isLoading}
                className="h-8"
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{m["ide.deployment.customDomain.visitYourDomain"]()}</span>
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono flex items-center gap-1"
          >
            {domain}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* DNS Records Section */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">{m["ide.deployment.customDomain.setFollowingRecords"]()}</h3>

        <div className="space-y-3">
          {dnsRecords.map((record) => {
            const recordKey = `${componentId}-record-${record.type}-${record.name}`
            return (
              <Card key={recordKey} className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{m["ide.deployment.customDomain.record"]()}</h4>
                    <Badge className={getStatusColor(record.status)}>
                      {getStatusText(record.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">{m["ide.deployment.customDomain.type"]()}</div>
                      <div className="font-mono font-medium">{record.type}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground mb-1">{m["ide.deployment.customDomain.name"]()}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs break-all">{record.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(record.name, `name-${recordKey}`)}
                          className="h-6 w-6 p-0 shrink-0"
                        >
                          {copiedField === `name-${recordKey}` ? (
                            <Copy className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground mb-1">{m["ide.deployment.customDomain.target"]()}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs break-all">{record.target}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(record.target, `target-${recordKey}`)}
                          className="h-6 w-6 p-0 shrink-0"
                        >
                          {copiedField === `target-${recordKey}` ? (
                            <Copy className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {m["ide.deployment.customDomain.dnsPropagationTime"]()}
        </p>
      </div>

      {/* Actions */}
      {onRemove && (
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            disabled={isLoading}
          >
            {m["ide.deployment.customDomain.removeDomain"]()}
          </Button>
        </div>
      )}
    </div>
  )
}
