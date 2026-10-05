import { supabase } from '../lib/supabase';
import type { DepartmentBudgetRecord, TenderReconciliationRecord } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

export const budgetReconciliationService = {
    /**
     * Get departmental budgets with country & site isolation
     */
    async getBudgets(
        countryCode: string = 'ET',
        siteId?: string,
        fiscalYear: number = new Date().getFullYear(),
        fiscalQuarter: number = Math.floor((new Date().getMonth() + 3) / 3)
    ): Promise<DepartmentBudgetRecord[]> {
        try {
            let query = supabase
                .from('department_budgets')
                .select('*')
                .eq('country_code', countryCode)
                .eq('fiscal_year', fiscalYear)
                .eq('fiscal_quarter', fiscalQuarter);

            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((b: any) => ({
                id: b.id,
                countryCode: b.country_code,
                siteId: b.site_id,
                department: b.department,
                category: b.category,
                fiscalYear: b.fiscal_year,
                fiscalQuarter: b.fiscal_quarter,
                budgetedAmount: Number(b.budgeted_amount) || 0,
                actualSpent: Number(b.actual_spent) || 0,
                alertThresholdPct: Number(b.alert_threshold_pct) || 85,
                approvedById: b.approved_by_id,
                createdAt: b.created_at,
                updatedAt: b.updated_at
            }));
        } catch (error) {
            logger.error('budgetReconciliationService', 'getBudgets failed:', error as Error);
            return [];
        }
    },

    /**
     * Upsert a department/category budget
     */
    async saveBudget(
        budget: Omit<DepartmentBudgetRecord, 'id' | 'actualSpent' | 'createdAt' | 'updatedAt'>,
        user: { id: string; name: string }
    ): Promise<DepartmentBudgetRecord> {
        const { data, error } = await supabase
            .from('department_budgets')
            .upsert({
                country_code: budget.countryCode,
                site_id: budget.siteId,
                department: budget.department,
                category: budget.category,
                fiscal_year: budget.fiscalYear,
                fiscal_quarter: budget.fiscalQuarter,
                budgeted_amount: budget.budgetedAmount,
                alert_threshold_pct: budget.alertThresholdPct || 85,
                approved_by_id: user.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            logger.error('budgetReconciliationService', 'saveBudget failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: user.name,
            action: 'BUDGET_CONFIGURED',
            module: 'Financials',
            details: `Configured budget for ${budget.department} (${budget.category}) in ${budget.countryCode}: ${budget.budgetedAmount}.`
        });

        return {
            id: data.id,
            countryCode: data.country_code,
            siteId: data.site_id,
            department: data.department,
            category: data.category,
            fiscalYear: data.fiscal_year,
            fiscalQuarter: data.fiscal_quarter,
            budgetedAmount: Number(data.budgeted_amount),
            actualSpent: Number(data.actual_spent || 0),
            alertThresholdPct: Number(data.alert_threshold_pct),
            approvedById: data.approved_by_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    /**
     * Get Tender Reconciliations (Telebirr, CBE Birr, M-Pesa, Card)
     */
    async getTenderReconciliations(
        countryCode: string = 'ET',
        siteId?: string,
        reconciliationDate?: string
    ): Promise<TenderReconciliationRecord[]> {
        try {
            let query = supabase
                .from('tender_reconciliations')
                .select('*')
                .eq('country_code', countryCode)
                .order('reconciliation_date', { ascending: false });

            if (siteId && siteId !== 'All') {
                query = query.eq('site_id', siteId);
            }

            if (reconciliationDate) {
                query = query.eq('reconciliation_date', reconciliationDate);
            }

            const { data, error } = await query;
            if (error) throw error;

            return (data || []).map((t: any) => ({
                id: t.id,
                countryCode: t.country_code,
                siteId: t.site_id,
                reconciliationDate: t.reconciliation_date,
                tenderType: t.tender_type,
                posReportedAmount: Number(t.pos_reported_amount) || 0,
                statementAmount: Number(t.statement_amount) || 0,
                variance: Number(t.variance) || 0,
                feeDeductions: Number(t.fee_deductions) || 0,
                status: t.status,
                statementReference: t.statement_reference,
                reconciledById: t.reconciled_by_id,
                reconciledByName: t.reconciled_by_name,
                reconciledAt: t.reconciled_at,
                notes: t.notes,
                createdAt: t.created_at
            }));
        } catch (error) {
            logger.error('budgetReconciliationService', 'getTenderReconciliations failed:', error as Error);
            return [];
        }
    },

    /**
     * Submit Tender / Gateway Reconciliation
     */
    async submitTenderReconciliation(
        record: Omit<TenderReconciliationRecord, 'id' | 'variance' | 'status' | 'createdAt'>,
        user: { id: string; name: string }
    ): Promise<TenderReconciliationRecord> {
        const variance = record.statementAmount - record.posReportedAmount - record.feeDeductions;
        const status = Math.abs(variance) > 1.0 ? 'Variance_Flagged' : 'Reconciled';
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('tender_reconciliations')
            .insert({
                country_code: record.countryCode,
                site_id: record.siteId,
                reconciliation_date: record.reconciliationDate,
                tender_type: record.tenderType,
                pos_reported_amount: record.posReportedAmount,
                statement_amount: record.statementAmount,
                variance,
                fee_deductions: record.feeDeductions,
                status,
                statement_reference: record.statementReference || null,
                reconciled_by_id: user.id,
                reconciled_by_name: user.name,
                reconciled_at: now,
                notes: record.notes || null
            })
            .select()
            .single();

        if (error) {
            logger.error('budgetReconciliationService', 'submitTenderReconciliation failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: user.name,
            action: status === 'Reconciled' ? 'TENDER_RECONCILED' : 'TENDER_VARIANCE_FLAGGED',
            module: 'Financials',
            details: `Reconciled ${record.tenderType} tender for site ${record.siteId}: POS=${record.posReportedAmount}, Statement=${record.statementAmount}, Variance=${variance}.`
        });

        return {
            id: data.id,
            countryCode: data.country_code,
            siteId: data.site_id,
            reconciliationDate: data.reconciliation_date,
            tenderType: data.tender_type,
            posReportedAmount: Number(data.pos_reported_amount),
            statementAmount: Number(data.statement_amount),
            variance: Number(data.variance),
            feeDeductions: Number(data.fee_deductions),
            status: data.status,
            statementReference: data.statement_reference,
            reconciledById: data.reconciled_by_id,
            reconciledByName: data.reconciled_by_name,
            reconciledAt: data.reconciled_at,
            notes: data.notes,
            createdAt: data.created_at
        };
    }
};
