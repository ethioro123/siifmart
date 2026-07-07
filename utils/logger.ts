/**
 * Structured Logger for SIIFMART
 *
 * Provides consistent, searchable logging with module context.
 * All logs include module name + action for easy filtering.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.error('POS', 'processPayment', err, { orderId, amount });
 *   logger.warn('Fulfillment', 'Job assignment skipped — no workers available');
 *   logger.info('Inventory', 'Stock adjusted', { productId, delta: -5 });
 */

type LogContext = Record<string, unknown>;

const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';

function formatPrefix(module: string, action: string): string {
  return `[${module}] ${action}`;
}

function serializeContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return '';
  try {
    return ` | ${JSON.stringify(context)}`;
  } catch {
    return ' | [unserializable context]';
  }
}

export const logger = {
  /**
   * Log an error with module context.
   * Always logged (dev + prod).
   */
  error(module: string, action: string, error: unknown, context?: LogContext): void {
    const prefix = formatPrefix(module, action);
    const contextStr = serializeContext(context);

    if (error instanceof Error) {
      console.error(`❌ ${prefix}: ${error.message}${contextStr}`, error);
    } else {
      console.error(`❌ ${prefix}: ${String(error)}${contextStr}`);
    }
  },

  /**
   * Log a warning with module context.
   * Always logged (dev + prod).
   */
  warn(module: string, message: string, context?: LogContext): void {
    const prefix = formatPrefix(module, message);
    const contextStr = serializeContext(context);
    console.warn(`⚠️ ${prefix}${contextStr}`);
  },

  /**
   * Log informational messages.
   * Only logged in development.
   */
  info(module: string, message: string, context?: LogContext): void {
    if (!isDev) return;
    const prefix = formatPrefix(module, message);
    const contextStr = serializeContext(context);
    console.info(`ℹ️ ${prefix}${contextStr}`);
  },

  /**
   * Log debug messages.
   * Only logged in development.
   */
  debug(module: string, message: string, context?: LogContext): void {
    if (!isDev) return;
    const prefix = formatPrefix(module, message);
    const contextStr = serializeContext(context);
    console.debug(`🔍 ${prefix}${contextStr}`);
  },
};
