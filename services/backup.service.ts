import { supabase } from './supabase';

export interface BackupData {
    timestamp: string;
    version: string;
    appVersion: string;
    data: {
        products: any[];
        sales: any[];
        orders: any[];
        employees: any[];
        customers: any[];
        sites: any[];
        transfers: any[];
        movements: any[];
        settings: any[];
    };
    metadata: {
        totalRecords: number;
        tables: string[];
        size: number;
    };
}

export class BackupService {
    private static readonly TABLES = [
        'products',
        'sales',
        'orders',
        'employees',
        'customers',
        'sites',
        'transfers',
        'movements',
        'settings'
    ];

    /**
     * Export all data to JSON
     */
    static async exportAllData(): Promise<Blob> {
        try {
            const backup: BackupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                appVersion: '1.0.0',
                data: {} as any,
                metadata: {
                    totalRecords: 0,
                    tables: this.TABLES,
                    size: 0
                }
            };

            let totalRecords = 0;

            // Fetch data from each table
            for (const table of this.TABLES) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*');

                    if (error) {
                        console.error(`Error fetching ${table}:`, error);
                        backup.data[table as keyof typeof backup.data] = [];
                    } else {
                        backup.data[table as keyof typeof backup.data] = data || [];
                        totalRecords += (data || []).length;
                    }
                } catch (err) {
                    console.error(`Exception fetching ${table}:`, err);
                    backup.data[table as keyof typeof backup.data] = [];
                }
            }

            backup.metadata.totalRecords = totalRecords;

            // Create blob
            const jsonString = JSON.stringify(backup, null, 2);
            backup.metadata.size = new Blob([jsonString]).size;

            const blob = new Blob([jsonString], { type: 'application/json' });

            return blob;
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error('Failed to create backup');
        }
    }

    /**
     * Download backup file
     */
    static downloadBackup(blob: Blob, filename?: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `siifmart_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Restore from backup
     */
    static async restoreFromBackup(file: File, onProgress?: (progress: number) => void): Promise<boolean> {
        try {
            const text = await file.text();
            const backup: BackupData = JSON.parse(text);

            // Validate backup structure
            if (!backup.data || !backup.timestamp || !backup.version) {
                throw new Error('Invalid backup file format');
            }

            // Validate version compatibility
            if (backup.version !== '1.0') {
                throw new Error(`Unsupported backup version: ${backup.version}`);
            }

            const tables = Object.keys(backup.data);
            let completed = 0;

            // Restore each table
            for (const table of tables) {
                const data = backup.data[table as keyof typeof backup.data];

                if (!Array.isArray(data) || data.length === 0) {
                    completed++;
                    if (onProgress) onProgress((completed / tables.length) * 100);
                    continue;
                }

                try {
                    // Use upsert to avoid conflicts
                    const { error } = await supabase
                        .from(table)
                        .upsert(data, { onConflict: 'id' });

                    if (error) {
                        console.error(`Error restoring ${table}:`, error);
                        // Continue with other tables even if one fails
                    }
                } catch (err) {
                    console.error(`Exception restoring ${table}:`, err);
                }

                completed++;
                if (onProgress) onProgress((completed / tables.length) * 100);
            }

            return true;
        } catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    }

    /**
     * Schedule automatic backups
     */
    static scheduleBackups(intervalHours: number = 24, autoDownload: boolean = false) {
        const intervalMs = intervalHours * 60 * 60 * 1000;

        const performBackup = async () => {
            try {
                const blob = await this.exportAllData();

                if (autoDownload) {
                    this.downloadBackup(blob);
                }

                // Store last backup time
                localStorage.setItem('lastBackupTime', new Date().toISOString());

                console.log('Automatic backup completed');
            } catch (error) {
                console.error('Automatic backup failed:', error);
            }
        };

        // Perform initial backup
        performBackup();

        // Schedule recurring backups
        const intervalId = setInterval(performBackup, intervalMs);

        // Return cleanup function
        return () => clearInterval(intervalId);
    }

    /**
     * Get last backup time
     */
    static getLastBackupTime(): Date | null {
        const lastBackup = localStorage.getItem('lastBackupTime');
        return lastBackup ? new Date(lastBackup) : null;
    }

    /**
     * Export specific table
     */
    static async exportTable(tableName: string): Promise<Blob> {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*');

            if (error) throw error;

            const exportData = {
                timestamp: new Date().toISOString(),
                table: tableName,
                records: data || [],
                count: (data || []).length
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            return new Blob([jsonString], { type: 'application/json' });
        } catch (error) {
            console.error(`Export ${tableName} failed:`, error);
            throw new Error(`Failed to export ${tableName}`);
        }
    }

    /**
     * Export to CSV
     */
    static async exportToCSV(tableName: string): Promise<Blob> {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*');

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('No data to export');
            }

            // Get headers from first record
            const headers = Object.keys(data[0]);

            // Create CSV content
            const csvRows = [
                headers.join(','), // Header row
                ...data.map(row =>
                    headers.map(header => {
                        const value = row[header];
                        // Escape commas and quotes
                        const escaped = String(value).replace(/"/g, '""');
                        return `"${escaped}"`;
                    }).join(',')
                )
            ];

            const csvContent = csvRows.join('\n');
            return new Blob([csvContent], { type: 'text/csv' });
        } catch (error) {
            console.error(`CSV export ${tableName} failed:`, error);
            throw new Error(`Failed to export ${tableName} to CSV`);
        }
    }

    /**
     * Validate backup file
     */
    static async validateBackup(file: File): Promise<{
        valid: boolean;
        error?: string;
        metadata?: BackupData['metadata'];
    }> {
        try {
            const text = await file.text();
            const backup: BackupData = JSON.parse(text);

            if (!backup.data || !backup.timestamp || !backup.version) {
                return { valid: false, error: 'Invalid backup format' };
            }

            if (backup.version !== '1.0') {
                return { valid: false, error: `Unsupported version: ${backup.version}` };
            }

            return {
                valid: true,
                metadata: backup.metadata
            };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Invalid JSON file'
            };
        }
    }
}
