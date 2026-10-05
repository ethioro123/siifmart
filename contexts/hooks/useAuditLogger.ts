import { useCallback } from 'react';
import { User, SystemLog } from '../../types';
import { systemLogsService, SystemLogPayload } from '../../services/system-logs.service';
import { logger } from '../../utils/logger';

export interface AuditLogOptions {
    employeeId?: string;
    siteId?: string;
    countryCode?: string;
    deviceId?: string;
    gpsLocation?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
}

interface UseAuditLoggerParams {
    user?: User | null;
    activeSiteId?: string;
    setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
}

export function useAuditLogger({ user, activeSiteId, setSystemLogs }: UseAuditLoggerParams) {
    const logSystemEvent = useCallback(
        async (
            action: string,
            details: string | Record<string, any>,
            userName?: string,
            module: SystemLog['module'] = 'General',
            options?: AuditLogOptions
        ) => {
            try {
                const resolvedUser = userName || user?.name || 'System';
                const resolvedEmployeeId = options?.employeeId || user?.id || undefined;
                const resolvedSiteId = options?.siteId || activeSiteId || user?.siteId || undefined;
                const resolvedCountry = options?.countryCode || (user as any)?.country || 'ET';

                const payload: SystemLogPayload = {
                    action,
                    details,
                    user_name: resolvedUser,
                    module,
                    employee_id: resolvedEmployeeId,
                    site_id: resolvedSiteId,
                    country_code: resolvedCountry,
                    device_id: options?.deviceId,
                    gps_location: options?.gpsLocation,
                    entity_type: options?.entityType,
                    entity_id: options?.entityId,
                    metadata: options?.metadata,
                };

                const newLog = await systemLogsService.create(payload);
                setSystemLogs(prev => [newLog as SystemLog, ...prev]);
                return newLog;
            } catch (error) {
                logger.error('useAuditLogger', 'Failed to log system event:', error);
            }
        },
        [user, activeSiteId, setSystemLogs]
    );

    return { logSystemEvent };
}
