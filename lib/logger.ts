/**
 * Production-Safe Logger
 * 
 * Strips all debug/info/warn logs in production builds.
 * Only console.error is preserved (critical failures only).
 * 
 * USAGE: Replace `console.log(...)` with `logger.log(...)` throughout the app.
 * 
 * WHY: console.log in production leaks system architecture, user roles,
 * site IDs, product data, and database queries to anyone opening DevTools.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /** Debug logs — stripped in production */
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },

  /** Info logs — stripped in production */
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },

  /** Warning logs — stripped in production */
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },

  /** Debug logs — stripped in production */
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args);
  },

  /** Error logs — KEPT in production (needed for debugging real failures) */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

export default logger;
