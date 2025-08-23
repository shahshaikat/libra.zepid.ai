/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * logger.ts
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
 * Centralized logging utility for Zepid AI platform
 * Provides structured logging with consistent formatting across all components
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  component?: string
  operation?: string
  userId?: string
  organizationId?: string
  projectId?: string
  sessionId?: string
  requestId?: string
  [key: string]: any
}

class Logger {
  private static instance: Logger
  private minLevel: LogLevel = LogLevel.INFO
  private isDevelopment: boolean = (process.env['NODE_ENV'] as string) === 'development'

  private constructor() {
    // Set log level based on environment
    if (this.isDevelopment) {
      this.minLevel = LogLevel.DEBUG
    } else if (process.env['LOG_LEVEL']) {
      this.minLevel = this.parseLogLevel(process.env['LOG_LEVEL'])
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'DEBUG': return LogLevel.DEBUG
      case 'INFO': return LogLevel.INFO
      case 'WARN': return LogLevel.WARN
      case 'ERROR': return LogLevel.ERROR
      default: return LogLevel.INFO
    }
  }

  private formatMessage(level: string, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    const errorStr = error ? ` | ERROR: ${error.message} | STACK: ${error.stack}` : ''

    return `[${timestamp}] [${level}] ${message}${contextStr}${errorStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  public setLogLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      this.minLevel = this.parseLogLevel(level)
    } else {
      this.minLevel = level
    }
  }

  public getLogLevel(): LogLevel {
    return this.minLevel
  }

  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context))
    }
  }

  public warn(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context, error))
    }
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context, error))
    }
  }

  // Convenience methods for specific operations
  public auth(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const authContext = { ...context, component: 'AUTH' }
    this[level](message, authContext, error)
  }

  public api(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const apiContext = { ...context, component: 'API' }
    this[level](message, apiContext, error)
  }

  public db(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const dbContext = { ...context, component: 'DB' }
    this[level](message, dbContext, error)
  }

  public ai(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const aiContext = { ...context, component: 'AI' }
    this[level](message, aiContext, error)
  }

  public cdn(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const cdnContext = { ...context, component: 'CDN' }
    this[level](message, cdnContext, error)
  }

  public dispatcher(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const dispatcherContext = { ...context, component: 'DISPATCHER' }
    this[level](message, dispatcherContext, error)
  }

  public project(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const projectContext = { ...context, component: 'PROJECT' }
    this[level](message, projectContext, error)
  }

  public subscription(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const subscriptionContext = { ...context, component: 'SUBSCRIPTION' }
    this[level](message, subscriptionContext, error)
  }

  public github(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const githubContext = { ...context, component: 'GITHUB' }
    this[level](message, githubContext, error)
  }

  public deployment(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const deploymentContext = { ...context, component: 'DEPLOYMENT' }
    this[level](message, deploymentContext, error)
  }

  public screenshot(level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error): void {
    const screenshotContext = { ...context, component: 'SCREENSHOT' }
    this[level](message, screenshotContext, error)
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext, error?: Error) => logger.warn(message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),

  // Component-specific loggers
  auth: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.auth(level, message, context, error),
  api: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.api(level, message, context, error),
  db: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.db(level, message, context, error),
  ai: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.ai(level, message, context, error),
  cdn: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.cdn(level, message, context, error),
  dispatcher: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.dispatcher(level, message, context, error),
  project: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.project(level, message, context, error),
  subscription: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.subscription(level, message, context, error),
  github: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.github(level, message, context, error),
  deployment: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.deployment(level, message, context, error),
  screenshot: (level: 'info' | 'warn' | 'error', message: string, context?: LogContext, error?: Error) =>
    logger.screenshot(level, message, context, error),
}