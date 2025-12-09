/**
 * Application Configuration
 * Centralized configuration for intervals, timeouts, and limits
 */

export const APP_CONFIG = {
    // Session Management
    SESSION_REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes
    SESSION_EXPIRY_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
    SESSION_EXPIRY_WARNING_TIME: 5 * 60 * 1000, // Warn 5 minutes before expiry

    // Data Refresh
    DATA_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
    DATA_REFRESH_RETRY_DELAY: 1000, // 1 second
    DATA_REFRESH_MAX_RETRIES: 3,

    // Logs
    MAX_LOG_ENTRIES: 1000,
    LOG_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    LOG_RETENTION_DAYS: 30,

    // Network
    NETWORK_RETRY_DELAY: 2000, // 2 seconds

    // UI
    TOAST_DURATION: 5000, // 5 seconds
    TOAST_WARNING_DURATION: 10000, // 10 seconds for warnings
} as const;

export type AppConfig = typeof APP_CONFIG;
