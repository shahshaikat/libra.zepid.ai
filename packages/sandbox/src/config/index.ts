/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * config/index.ts
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

import type {
  ProviderConfig,
  SandboxConfig,
  SandboxFactoryConfig,
  SandboxProviderType,
} from '../types'

/**
 * Container timeout configurations for different user tiers and use cases
 */
export const CONTAINER_TIMEOUTS = {
  /** FREE user container timeout (10 minutes) */
  FREE: 10 * 60_000,
  /** Professional user container timeout (20 minutes) */
  PAID: 20 * 60_000,
  /** Container pause timeout (5 minutes) */
  PAUSE: 5 * 60_000,
  /** API default timeout for container operations (5 minutes) */
  API_DEFAULT: 5 * 60_000,
} as const

/**
 * Deployment-specific configuration constants
 */
export const DEPLOYMENT_CONFIG = {
  /** Template configurations for different providers */
  TEMPLATES: {
    /** E2B template identifier */
    E2B: 'vite-shadcn-template-builder-zepid',
    /** Daytona template identifier with version */
    DAYTONA: 'vite-shadcn-template-builder-zepid:1.0.0',
  },
  /** Default deployment timeout (10 minutes) */
  TIMEOUT: 10 * 60_000,
  /** Project path inside the sandbox container */
  PROJECT_PATH: '/home/user/vite-shadcn-template-builder-zepid',
  /** File patterns to exclude during deployment */
  EXCLUDED_PATTERNS: [
    'node_modules/',
    '.git/',
    '.next/',
    'dist/',
    'build/',
    '.env',
    '.env.local',
    '.DS_Store',
  ],
  /** Specific timeouts for different deployment phases */
  TIMEOUTS: {
    /** Build phase timeout (1 minute) */
    BUILD: 1 * 60_000,
    /** Deploy phase timeout (1 minute) */
    DEPLOY: 1 * 60_000,
    /** Sandbox cleanup timeout (30 seconds) */
    SANDBOX_CLEANUP: 30_000,
  },
} as const

/**
 * Template mapping for different providers
 */
export const TEMPLATE_MAPPINGS = {
  /** Get template for a specific provider */
  getTemplateForProvider: (provider: SandboxProviderType, templateType: 'basic' | 'builder' = 'basic'): string => {
    if (templateType === 'builder') {
      return provider === 'e2b'
        ? DEPLOYMENT_CONFIG.TEMPLATES.E2B
        : DEPLOYMENT_CONFIG.TEMPLATES.DAYTONA
    }
    return provider === 'e2b'
      ? 'vite-shadcn-template-zepid'
      : 'vite-shadcn-template-zepid:1.0.0'
  },
} as const

/**
 * Default sandbox configurations for different templates
 * Now using centralized timeout configurations
 */
export const DEFAULT_SANDBOX_CONFIGS: Record<string, Partial<SandboxConfig>> = {
  'vite-shadcn-template-zepid': {
    template: 'vite-shadcn-template-zepid',
    timeoutMs: CONTAINER_TIMEOUTS.FREE,
    resources: {
      memory: 1024, // MB
      cpu: 2,
      disk: 2048, // MB
    },
    network: {
      enabled: true,
      allowedDomains: ['*.npmjs.org', '*.unpkg.com', '*.jsdelivr.net'],
      blockedPorts: [22, 3306, 5432],
    },
  },
  'vite-shadcn-template-builder-zepid': {
    template: 'vite-shadcn-template-builder-zepid',
    timeoutMs: CONTAINER_TIMEOUTS.FREE,
    resources: {
      memory: 2048, // MB
      cpu: 2,
      disk: 4096, // MB
    },
    network: {
      enabled: true,
      allowedDomains: ['*.npmjs.org', '*.unpkg.com', '*.jsdelivr.net', '*.cloudflare.com'],
      blockedPorts: [22, 3306, 5432],
    },
  },
  default: {
    template: 'default',
    timeoutMs: CONTAINER_TIMEOUTS.FREE,
    resources: {
      memory: 1024, // MB
      cpu: 1,
      disk: 1024, // MB
    },
    network: {
      enabled: true,
      allowedDomains: ['*.npmjs.org', '*.unpkg.com', '*.jsdelivr.net'],
      blockedPorts: [22, 3306, 5432],
    },
  },
}

/**
 * Default provider configurations
 */
export const DEFAULT_PROVIDER_CONFIGS: Record<SandboxProviderType, ProviderConfig> = {
  e2b: {
    type: 'e2b',
    timeout: 30_000,
    retries: 3,
  },
  daytona: {
    type: 'daytona',
    timeout: 30_000,
    retries: 3,
  },
}


/**
 * Configuration builder class
 */
export class SandboxConfigBuilder {
  private config: Partial<SandboxFactoryConfig> = {
    providers: {},
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: SandboxProviderType): this {
    this.config.defaultProvider = provider
    return this
  }

  /**
   * Add E2B provider configuration
   */
  addE2BProvider(config?: Partial<ProviderConfig>): this {
    if (!this.config.providers) {
      this.config.providers = {}
    }
    this.config.providers.e2b = {
      ...DEFAULT_PROVIDER_CONFIGS.e2b,
      ...config,
    }
    return this
  }

  /**
   * Add Daytona provider configuration
   */
  addDaytonaProvider(config?: Partial<ProviderConfig>): this {
    if (!this.config.providers) {
      this.config.providers = {}
    }
    this.config.providers.daytona = {
      ...DEFAULT_PROVIDER_CONFIGS.daytona,
      ...config,
    }
    return this
  }

  /**
   * Load configuration from environment variables
   */
  fromEnvironment(): this {
    // Set default provider from environment
    const defaultProvider = process.env.NEXT_PUBLIC_SANDBOX_BUILDER_DEFAULT_PROVIDER as SandboxProviderType
    if (defaultProvider) {
      this.setDefaultProvider(defaultProvider)
    }

    // Configure E2B from environment
    if (process.env.E2B_API_KEY) {
      this.addE2BProvider({
        apiKey: process.env.E2B_API_KEY,
        timeout: process.env.E2B_TIMEOUT ? Number.parseInt(process.env.E2B_TIMEOUT) : undefined,
        retries: process.env.E2B_RETRIES ? Number.parseInt(process.env.E2B_RETRIES) : undefined,
      })
    }

    // Configure Daytona from environment
    if (process.env.DAYTONA_API_KEY || process.env.DAYTONA_API_URL) {
      this.addDaytonaProvider({
        apiKey: process.env.DAYTONA_API_KEY,
        apiUrl: process.env.DAYTONA_API_URL,
        timeout: process.env.DAYTONA_TIMEOUT
          ? Number.parseInt(process.env.DAYTONA_TIMEOUT)
          : undefined,
        retries: process.env.DAYTONA_RETRIES
          ? Number.parseInt(process.env.DAYTONA_RETRIES)
          : undefined,
      })
    }

    return this
  }

  /**
   * Merge with existing configuration
   */
  merge(config: Partial<SandboxFactoryConfig>): this {
    this.config = {
      ...this.config,
      ...config,
      providers: {
        ...this.config.providers,
        ...config.providers,
      },
    }
    return this
  }

  /**
   * Build the final configuration
   */
  build(): SandboxFactoryConfig {
    // Set default provider if not specified
    if (!this.config.defaultProvider) {
      if (this.config.providers?.e2b) {
        this.config.defaultProvider = 'e2b'
      } else if (this.config.providers?.daytona) {
        this.config.defaultProvider = 'daytona'
      } else {
        throw new Error('No providers configured and no default provider specified')
      }
    }

    // Ensure at least one provider is configured
    if (!this.config.providers || Object.keys(this.config.providers).length === 0) {
      throw new Error('At least one provider must be configured')
    }

    return this.config as SandboxFactoryConfig
  }
}

/**
 * Create a configuration builder
 */
export function createConfigBuilder(): SandboxConfigBuilder {
  return new SandboxConfigBuilder()
}

/**
 * Create default configuration
 */
export function createDefaultConfig(): SandboxFactoryConfig {
  return createConfigBuilder().addE2BProvider().setDefaultProvider('e2b').build()
}

/**
 * Create configuration from environment variables
 */
export function createConfigFromEnvironment(): SandboxFactoryConfig {
  return createConfigBuilder().fromEnvironment().build()
}

/**
 * Get sandbox configuration for a specific template
 */
export function getSandboxConfigForTemplate(template: string): Partial<SandboxConfig> {
  const config = DEFAULT_SANDBOX_CONFIGS[template]
  if (config) {
    return config
  }
  // We know 'default' exists in our configuration
  return DEFAULT_SANDBOX_CONFIGS.default as Partial<SandboxConfig>
}

/**
 * Merge sandbox configurations
 */
export function mergeSandboxConfig(
  base: Partial<SandboxConfig>,
  override: Partial<SandboxConfig>
): SandboxConfig {
  return {
    template: override.template || base.template || 'default',
    timeoutMs: override.timeoutMs || base.timeoutMs || 10 * 60_000,
    env: {
      ...base.env,
      ...override.env,
    },
    resources: {
      ...base.resources,
      ...override.resources,
    },
    network: {
      ...base.network,
      ...override.network,
    },
  }
}

/**
 * Validate sandbox configuration
 */
export function validateSandboxConfig(config: SandboxConfig): void {
  if (!config.template) {
    throw new Error('Sandbox template is required')
  }

  if (config.timeoutMs && config.timeoutMs <= 0) {
    throw new Error('Timeout must be positive')
  }

  if (config.resources) {
    if (config.resources.memory && config.resources.memory <= 0) {
      throw new Error('Memory must be positive')
    }
    if (config.resources.cpu && config.resources.cpu <= 0) {
      throw new Error('CPU count must be positive')
    }
    if (config.resources.disk && config.resources.disk <= 0) {
      throw new Error('Disk size must be positive')
    }
  }
}

/**
 * Validate factory configuration
 */
export function validateFactoryConfig(config: SandboxFactoryConfig): void {
  if (!config.defaultProvider) {
    throw new Error('Default provider is required')
  }

  if (!config.providers || Object.keys(config.providers).length === 0) {
    throw new Error('At least one provider must be configured')
  }

  if (!config.providers[config.defaultProvider]) {
    throw new Error(`Default provider '${config.defaultProvider}' is not configured`)
  }

  // Validate each provider configuration
  for (const [providerType, providerConfig] of Object.entries(config.providers)) {
    if (!providerConfig.type) {
      throw new Error(`Provider type is required for ${providerType}`)
    }
    if (providerConfig.type !== providerType) {
      throw new Error(
        `Provider type mismatch for ${providerType}: expected '${providerType}', got '${providerConfig.type}'`
      )
    }
  }
}

/**
 * Get timeout for user tier
 */
export function getTimeoutForUserTier(tier: 'FREE' | 'PAID'): number {
  switch (tier) {
    case 'FREE':
      return CONTAINER_TIMEOUTS.FREE
    default:
      return CONTAINER_TIMEOUTS.PAID
  }
}

/**
 * Get deployment template for provider
 */
export function getDeploymentTemplate(provider: SandboxProviderType): string {
  return TEMPLATE_MAPPINGS.getTemplateForProvider(provider, 'builder')
}

/**
 * Get the default builder provider from environment variable
 * @returns {SandboxProviderType} The selected sandbox builder provider type
 */
export function getBuilderDefaultProvider(): SandboxProviderType {
  const envProvider = process.env.NEXT_PUBLIC_SANDBOX_BUILDER_DEFAULT_PROVIDER as SandboxProviderType
  if (envProvider && (envProvider === 'e2b' || envProvider === 'daytona')) {
    return envProvider
  }
  // Default to daytona if not specified (as per .env.example)
  return 'e2b'
}

/**
 * Get deployment template based on SANDBOX_BUILDER_DEFAULT_PROVIDER environment variable
 * This replaces the hardcoded DEPLOYMENT_CONFIG.TEMPLATE usage
 * @returns {string} The template name for the configured builder provider
 */
export function getDynamicDeploymentTemplate(): string {
  const provider = getBuilderDefaultProvider()
  return getDeploymentTemplate(provider)
}

/**
 * Check if file should be excluded during deployment
 */
export function isExcludedFile(path: string): boolean {
  return DEPLOYMENT_CONFIG.EXCLUDED_PATTERNS.some(pattern => path.includes(pattern))
}

/**
 * Get deployment timeout for specific phase
 */
export function getDeploymentTimeout(phase: 'build' | 'deploy' | 'cleanup' | 'default'): number {
  switch (phase) {
    case 'build':
      return DEPLOYMENT_CONFIG.TIMEOUTS.BUILD
    case 'deploy':
      return DEPLOYMENT_CONFIG.TIMEOUTS.DEPLOY
    case 'cleanup':
      return DEPLOYMENT_CONFIG.TIMEOUTS.SANDBOX_CLEANUP
    case 'default':
      return DEPLOYMENT_CONFIG.TIMEOUT
    default:
      return DEPLOYMENT_CONFIG.TIMEOUT
  }
}
