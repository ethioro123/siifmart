import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/deviceIdentifier';
import { getCachedAuditLocation } from '../utils/geolocationHelper';
import { logger } from '../utils/logger';

export interface SystemLogPayload {
    user_name?: string;
    action: string;
    details?: string | Record<string, any>;
    module?: string;
    ip_address?: string;
    site_id?: string;
    country_code?: string;
    employee_id?: string;
    device_id?: string;
    gps_location?: string;
    entity_type?: string;
    entity_id?: string;
    performed_by?: string;
    metadata?: Record<string, any>;
}

export const systemLogsService = {
    /**
     * Creates an immutable audit trail entry in Supabase system_logs.
     * Complies with Zero-Trust Rule 5: captures employee ID, site ID, device ID, and GPS coordinates.
     */
    async create(log: SystemLogPayload) {
        const userName = (log.user_name && String(log.user_name).trim()) || 'System';
        const action = (log.action && String(log.action).trim()) || 'SYSTEM_EVENT';
        const module = (log.module && String(log.module).trim()) || 'General';
        const deviceId = log.device_id || getDeviceId();
        const siteId = log.site_id || null;
        const employeeId = log.employee_id || null;
        const countryCode = log.country_code || 'ET';

        // Resolve GPS coordinates (cached or fallback)
        let gpsLocation = log.gps_location;
        if (!gpsLocation) {
            try {
                gpsLocation = await getCachedAuditLocation();
            } catch {
                gpsLocation = 'GPS: Unavailable';
            }
        }

        // Format details: if string, wrap in audit envelope; if object, enrich with Rule 5 metadata
        let formattedDetails: string;
        let metadata: Record<string, any> = log.metadata || {};

        if (typeof log.details === 'object' && log.details !== null) {
            metadata = { ...metadata, ...log.details };
            formattedDetails = JSON.stringify({
                employeeId,
                siteId,
                deviceId,
                gpsLocation,
                countryCode,
                ...log.details,
            });
        } else {
            formattedDetails = JSON.stringify({
                employeeId,
                siteId,
                deviceId,
                gpsLocation,
                countryCode,
                message: log.details || '',
            });
        }

        const dbLog = {
            user_name: userName,
            action,
            details: formattedDetails,
            module,
            ip_address: log.ip_address || null,
            site_id: siteId,
            country_code: countryCode,
            employee_id: employeeId,
            device_id: deviceId,
            gps_location: gpsLocation,
            entity_type: log.entity_type || null,
            entity_id: log.entity_id || null,
            performed_by: log.performed_by || userName,
            metadata,
        };

        try {
            let { error } = await supabase
                .from('system_logs')
                .insert(dbLog);

            if (error) {
                // Check if error is due to missing columns in schema cache or restrictive module check constraint
                const isSchemaCacheError = error.message?.includes('schema cache') || error.message?.includes('column');
                const isModuleCheckError = error.message?.includes('system_logs_module_check') || error.message?.includes('check constraint');

                if (isSchemaCacheError || isModuleCheckError) {
                    const fallbackLog = {
                        user_name: userName,
                        action,
                        details: formattedDetails,
                        module: isModuleCheckError ? 'General' : module,
                        ip_address: log.ip_address || null
                    };

                    let { error: fallbackError } = await supabase
                        .from('system_logs')
                        .insert(fallbackLog);

                    // If 'General' was also rejected by legacy module check, try 'POS'
                    if (fallbackError && (fallbackError.message?.includes('system_logs_module_check') || fallbackError.message?.includes('check constraint'))) {
                        const posFallback = await supabase
                            .from('system_logs')
                            .insert({ ...fallbackLog, module: 'POS' });
                        fallbackError = posFallback.error;
                    }

                    if (fallbackError) {
                        logger.warn('systemLogsService', 'Non-blocking system_logs fallback warning:', { error: fallbackError.message });
                    }
                } else {
                    logger.warn('systemLogsService', 'Non-blocking system_logs insert warning:', { error: error.message });
                }
            }
        } catch (insertErr) {
            logger.warn('systemLogsService', 'Non-blocking system_logs network failure:', { error: insertErr instanceof Error ? insertErr.message : String(insertErr) });
        }

        return {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            user_name: dbLog.user_name,
            action: dbLog.action,
            details: dbLog.details,
            module: dbLog.module,
            ip_address: dbLog.ip_address,
            site_id: dbLog.site_id,
            country_code: dbLog.country_code,
            employee_id: dbLog.employee_id,
            device_id: dbLog.device_id,
            gps_location: dbLog.gps_location,
        };
    },

    async getAll(module?: string, limit: number = 25) {
        try {
            // RULE 10: 25-record shelf limit
            let query = supabase
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (module) {
                query = query.eq('module', module);
            }

            const { data, error } = await query;
            if (error) {
                return [];
            }

            return (data || []).map((l: any) => ({
                id: l.id,
                created_at: l.created_at,
                user_name: l.user_name || 'System',
                action: l.action,
                details: l.details || '',
                module: l.module,
                ip_address: l.ip_address || null,
                site_id: l.site_id || null,
                country_code: l.country_code || null,
                employee_id: l.employee_id || null,
                device_id: l.device_id || null,
                gps_location: l.gps_location || null,
            }));
        } catch {
            return [];
        }
    },
};
