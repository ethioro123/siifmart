import { supabase } from '../lib/supabase';
import type { PerformanceReview, TrainingRecord, TrainingModule, TrainingStatus } from '../types/hr-advanced';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_REVIEWS = 'siifmart_perf_reviews_backup';
const LOCAL_STORAGE_TRAINING = 'siifmart_training_backup';

let inMemoryReviews: PerformanceReview[] = [];
let inMemoryTraining: TrainingRecord[] = [];

const getLocalReviews = (): PerformanceReview[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_REVIEWS);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryReviews;
};

const saveLocalReviews = (records: PerformanceReview[]): void => {
    const map = new Map<string, PerformanceReview>();
    for (const r of inMemoryReviews) map.set(r.id, r);
    for (const r of records) map.set(r.id, r);
    inMemoryReviews = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_REVIEWS, JSON.stringify(inMemoryReviews));
        }
    } catch {
        // Safe
    }
};

const getLocalTraining = (): TrainingRecord[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_TRAINING);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryTraining;
};

const saveLocalTraining = (records: TrainingRecord[]): void => {
    const map = new Map<string, TrainingRecord>();
    for (const t of inMemoryTraining) map.set(t.id, t);
    for (const t of records) map.set(t.id, t);
    inMemoryTraining = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_TRAINING, JSON.stringify(inMemoryTraining));
        }
    } catch {
        // Safe
    }
};

const mapDBToReview = (row: any): PerformanceReview => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    review_period: row.review_period,
    operational_speed_score: Number(row.operational_speed_score) || 0,
    shrinkage_prevention_score: Number(row.shrinkage_prevention_score) || 0,
    attendance_score: Number(row.attendance_score) || 0,
    collaboration_score: Number(row.collaboration_score) || 0,
    composite_score: Number(row.composite_score) || 0,
    strengths: row.strengths,
    growth_areas: row.growth_areas,
    pip_required: Boolean(row.pip_required),
    reviewer_id: row.reviewer_id,
    reviewer_name: row.reviewer_name,
    reviewer_role: row.reviewer_role,
    created_at: row.created_at
});

const mapDBToTraining = (row: any): TrainingRecord => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    module_name: row.module_name as TrainingModule,
    status: row.status as TrainingStatus,
    score: row.score ? Number(row.score) : undefined,
    trainer_name: row.trainer_name,
    certified_at: row.certified_at,
    expires_at: row.expires_at || undefined,
    certificate_url: row.certificate_url || undefined,
    created_at: row.created_at
});

export const performanceTrainingService = {
    async fetchReviews(countryCode: string = 'ET', employeeId?: string): Promise<PerformanceReview[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            let query = supabase
                .from('performance_reviews')
                .select('*')
                .eq('country_code', country)
                .order('created_at', { ascending: false });

            if (employeeId) query = query.eq('employee_id', employeeId);

            const { data, error } = await query;
            if (error) {
                return getLocalReviews().filter(r => 
                    (r.country_code || 'ET').toUpperCase() === country &&
                    (!employeeId || r.employee_id === employeeId)
                );
            }

            const mapped = (data || []).map(mapDBToReview);
            saveLocalReviews(mapped);
            return mapped;
        } catch {
            return getLocalReviews().filter(r => 
                (r.country_code || 'ET').toUpperCase() === country &&
                (!employeeId || r.employee_id === employeeId)
            );
        }
    },

    async submitReview(data: {
        country_code: string;
        employee_id: string;
        employee_name: string;
        review_period: string;
        operational_speed_score: number;
        shrinkage_prevention_score: number;
        attendance_score: number;
        collaboration_score: number;
        strengths: string;
        growth_areas: string;
        pip_required: boolean;
        reviewer_id: string;
        reviewer_name: string;
        reviewer_role: string;
    }): Promise<PerformanceReview> {
        const country = (data.country_code || 'ET').toUpperCase();
        // Calculate composite score (Speed 25%, Shrinkage 30%, Attendance 25%, Collab 20%)
        const composite = Math.round(
            data.operational_speed_score * 0.25 +
            data.shrinkage_prevention_score * 0.30 +
            data.attendance_score * 0.25 +
            data.collaboration_score * 0.20
        );

        const newReview: PerformanceReview = {
            ...data,
            country_code: country,
            composite_score: composite,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString()
        };

        try {
            await supabase.from('performance_reviews').insert([newReview]);
        } catch {
            // Safe
        }
        saveLocalReviews([newReview]);

        // Neural Mesh: Update employee performanceScore in Supabase
        try {
            await supabase
                .from('employees')
                .update({ performanceScore: composite })
                .eq('id', data.employee_id);
        } catch {
            // Fallback
        }

        return newReview;
    },

    async fetchTrainingRecords(countryCode: string = 'ET', employeeId?: string): Promise<TrainingRecord[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            let query = supabase
                .from('training_records')
                .select('*')
                .eq('country_code', country)
                .order('certified_at', { ascending: false });

            if (employeeId) query = query.eq('employee_id', employeeId);

            const { data, error } = await query;
            if (error) {
                return getLocalTraining().filter(t => 
                    (t.country_code || 'ET').toUpperCase() === country &&
                    (!employeeId || t.employee_id === employeeId)
                );
            }

            const mapped = (data || []).map(mapDBToTraining);
            saveLocalTraining(mapped);
            return mapped;
        } catch {
            return getLocalTraining().filter(t => 
                (t.country_code || 'ET').toUpperCase() === country &&
                (!employeeId || t.employee_id === employeeId)
            );
        }
    },

    async recordCertification(data: {
        country_code: string;
        employee_id: string;
        employee_name: string;
        module_name: TrainingModule;
        status: TrainingStatus;
        score?: number;
        trainer_name: string;
        expires_at?: string;
        certificate_url?: string;
    }): Promise<TrainingRecord> {
        const country = (data.country_code || 'ET').toUpperCase();
        const newRecord: TrainingRecord = {
            ...data,
            country_code: country,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `train-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            certified_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        try {
            await supabase.from('training_records').insert([newRecord]);
        } catch {
            // Safe
        }
        saveLocalTraining([newRecord]);
        return newRecord;
    }
};
