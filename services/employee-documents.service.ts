import { supabase } from '../lib/supabase';
import type { EmployeeDocumentRecord, DocumentType } from '../types/hr-zero-trust';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const mapDBToDoc = (row: any): EmployeeDocumentRecord => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    employee_id: row.employee_id,
    name: row.name,
    doc_type: row.doc_type as DocumentType,
    file_url: row.file_url,
    file_size: row.file_size ? Number(row.file_size) : undefined,
    mime_type: row.mime_type || undefined,
    expiry_date: row.expiry_date || undefined,
    verified: Boolean(row.verified),
    verified_by: row.verified_by || undefined,
    verified_at: row.verified_at || undefined,
    uploaded_by: row.uploaded_by || 'HR Staff',
    created_at: row.created_at || new Date().toISOString()
});

export const employeeDocumentsService = {
    async fetchDocuments(employeeId: string, countryCode: string = 'ET'): Promise<EmployeeDocumentRecord[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            const { data, error } = await supabase
                .from('employee_documents')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false });

            if (error) {
                logger.warn('employeeDocumentsService', 'Supabase fetch error', { message: error.message });
                // Never leak cached documents across users or on RLS permission denial
                return [];
            }

            return (data || []).map(mapDBToDoc);
        } catch (err) {
            logger.warn('employeeDocumentsService', 'Exception fetching docs', { error: String(err) });
            return [];
        }
    },

    async addDocument(docData: {
        country_code: string;
        employee_id: string;
        name: string;
        doc_type: DocumentType;
        file_url: string;
        file_size?: number;
        mime_type?: string;
        expiry_date?: string;
        uploaded_by: string;
    }): Promise<EmployeeDocumentRecord> {
        const country = (docData.country_code || 'ET').toUpperCase();
        const newDoc: EmployeeDocumentRecord = {
            ...docData,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            verified: false,
            created_at: new Date().toISOString()
        };

        try {
            const { data: dbData, error } = await supabase
                .from('employee_documents')
                .insert([{
                    id: newDoc.id,
                    country_code: country,
                    employee_id: newDoc.employee_id,
                    name: newDoc.name,
                    doc_type: newDoc.doc_type,
                    file_url: newDoc.file_url,
                    file_size: newDoc.file_size,
                    mime_type: newDoc.mime_type,
                    expiry_date: newDoc.expiry_date,
                    verified: false,
                    uploaded_by: newDoc.uploaded_by
                }])
                .select()
                .single();

            if (error) {
                logger.warn('employeeDocumentsService', 'Supabase insert error', { message: error.message });
                throw error;
            } else if (dbData) {
                return mapDBToDoc(dbData);
            }
        } catch (err) {
            logger.warn('employeeDocumentsService', 'Exception inserting doc', { error: String(err) });
            throw err;
        }

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: docData.uploaded_by,
                action: 'EMPLOYEE_DOCUMENT_UPLOADED',
                module: 'Human Resources',
                details: JSON.stringify({
                    docId: newDoc.id,
                    employeeId: docData.employee_id,
                    docType: docData.doc_type,
                    fileName: docData.name,
                    country: country
                })
            });
        } catch (logErr) {
            logger.warn('employeeDocumentsService', 'Audit log failed', { error: String(logErr) });
        }

        return newDoc;
    },

    async deleteDocument(id: string, employeeId: string, actorName: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('employee_documents')
                .delete()
                .eq('id', id);

            if (error) {
                logger.warn('employeeDocumentsService', 'Supabase delete error', { message: error.message });
            }
        } catch (err) {
            logger.warn('employeeDocumentsService', 'Exception deleting doc', { error: String(err) });
        }


        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: actorName,
                action: 'EMPLOYEE_DOCUMENT_DELETED',
                module: 'Human Resources',
                details: JSON.stringify({ docId: id, employeeId })
            });
        } catch (logErr) {
            logger.warn('employeeDocumentsService', 'Audit log failed', { error: String(logErr) });
        }

        return true;
    }
};
