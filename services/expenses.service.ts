import { supabase } from '../lib/supabase';
import type { ExpenseRecord, ExpenseStatus } from '../types';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

// Sovereign operating expense boundaries:
// Level 1: Regional Autonomous Limit <= 2,000,000 ETB / KES (Regional Operations/Finance Manager)
// Level 2/3: Country Autonomous Limit <= 20,000,000 ETB / KES (Country Finance Director / Managing Director)
// Level 4/5: Sovereign Escalation > 20,000,000 ETB / KES (Group CFO / Group CEO)
export const DEFAULT_REGIONAL_EXPENSE_LIMIT = 2000000;
export const DEFAULT_COUNTRY_EXPENSE_LIMIT = 20000000;
export const DEFAULT_CEO_APPROVAL_THRESHOLD = 20000000;

function mapExpenseRow(e: any): ExpenseRecord {
    return {
        id: e.id,
        siteId: e.site_id,
        site_id: e.site_id,
        countryCode: e.country_code || 'ET',
        country_code: e.country_code || 'ET',
        date: e.expense_date,
        expense_date: e.expense_date,
        category: e.category,
        description: e.description,
        amount: Number(e.amount) || 0,
        status: (e.status as ExpenseStatus) || 'Pending',
        approvedBy: e.approved_by || e.approved_by_name,
        approved_by: e.approved_by,
        createdById: e.created_by_id,
        created_by_id: e.created_by_id,
        createdByName: e.created_by_name,
        created_by_name: e.created_by_name,
        approvedById: e.approved_by_id,
        approved_by_id: e.approved_by_id,
        approvedAt: e.approved_at,
        approved_at: e.approved_at,
        voidReason: e.void_reason,
        void_reason: e.void_reason,
        voidedById: e.voided_by_id,
        voided_by_id: e.voided_by_id,
        voidedByName: e.voided_by_name,
        voided_by_name: e.voided_by_name,
        voidedAt: e.voided_at,
        voided_at: e.voided_at,
        paymentRef: e.payment_ref,
        payment_ref: e.payment_ref,
        escalatedToCeo: Boolean(e.escalated_to_ceo),
        escalated_to_ceo: Boolean(e.escalated_to_ceo),
        escalationReason: e.escalation_reason,
        escalation_reason: e.escalation_reason,
        regionCode: e.region_code,
        region_code: e.region_code,
        requiresHqApproval: Boolean(e.requires_hq_approval),
        requires_hq_approval: Boolean(e.requires_hq_approval),
        hqApprovedBy: e.hq_approved_by,
        hq_approved_by: e.hq_approved_by,
        hqApprovedAt: e.hq_approved_at,
        hq_approved_at: e.hq_approved_at,
        createdAt: e.created_at,
        created_at: e.created_at,
        updatedAt: e.updated_at,
        updated_at: e.updated_at
    };
}

export const expensesService = {
    async getAll(
        siteId?: string,
        limit: number = 25,
        offset: number = 0,
        filters?: {
            startDate?: string;
            endDate?: string;
            category?: string;
            status?: string;
            search?: string;
            countryCode?: string;
        }
    ) {
        let query = supabase
            .from('expenses')
            .select('id,site_id,country_code,expense_date,category,description,amount,status,created_by_id,created_by_name,approved_by_id,approved_by,approved_at,escalated_to_ceo,region_code,requires_hq_approval,hq_approved_by,hq_approved_at,void_reason,voided_by_id,voided_by_name,voided_at,payment_ref,escalation_reason,created_at,updated_at', { count: 'exact' })
            .order('expense_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        if (filters?.countryCode) {
            query = query.eq('country_code', filters.countryCode);
        }

        if (filters?.startDate) {
            query = query.gte('expense_date', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('expense_date', filters.endDate);
        }

        if (filters?.category && filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }

        if (filters?.status && filters.status !== 'All') {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.ilike('description', `%${filters.search}%`);
        }

        const { data, error, count } = await query;
        if (error) {
            logger.error('expensesService', 'getAll failed:', error);
            throw error;
        }

        return {
            data: (data || []).map(mapExpenseRow),
            count: count || 0
        };
    },

    async getById(id: string): Promise<ExpenseRecord | null> {
        const { data, error } = await supabase
            .from('expenses')
            .select('id,site_id,country_code,expense_date,category,description,amount,status,created_by_id,created_by_name,approved_by_id,approved_by,approved_at,escalated_to_ceo,region_code,requires_hq_approval,hq_approved_by,hq_approved_at,void_reason,voided_by_id,voided_by_name,voided_at,payment_ref,escalation_reason,created_at,updated_at')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data ? mapExpenseRow(data) : null;
    },

    async create(
        expense: Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'> & {
            creatorUser?: { id: string; name: string; role?: string };
            thresholdLimit?: number;
            regionalLimit?: number;
        }
    ) {
        const regionalLimit = expense.regionalLimit || DEFAULT_REGIONAL_EXPENSE_LIMIT;
        const countryLimit = expense.thresholdLimit || DEFAULT_COUNTRY_EXPENSE_LIMIT;
        const isEscalatedToCeo = expense.amount > countryLimit;
        const requiresHqApproval = expense.amount > regionalLimit;

        const dbExpense = {
            site_id: expense.siteId || expense.site_id,
            region_code: expense.regionCode || expense.region_code || null,
            country_code: expense.countryCode || expense.country_code || 'ET',
            expense_date: expense.date || expense.expense_date || new Date().toISOString().split('T')[0],
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            status: 'Pending', // Zero-trust: Creators can never log directly as Paid/Approved
            created_by_id: expense.createdById || expense.creatorUser?.id || null,
            created_by_name: expense.createdByName || expense.creatorUser?.name || 'Staff Member',
            requires_hq_approval: requiresHqApproval,
            escalated_to_ceo: isEscalatedToCeo,
            escalation_reason: isEscalatedToCeo
                ? `Amount exceeds country autonomous limit (${countryLimit.toLocaleString()}). Requires Group CFO / Group CEO executive authorization.`
                : requiresHqApproval
                    ? `Amount exceeds regional autonomous limit (${regionalLimit.toLocaleString()}). Requires Country Finance Director sign-off.`
                    : null
        };

        const { data, error } = await supabase
            .from('expenses')
            .insert(dbExpense)
            .select()
            .single();

        if (error) {
            logger.error('expensesService', 'create failed:', error);
            throw error;
        }

        // Rule 5: Tamper-proof audit logging
        await systemLogsService.create({
            user_name: dbExpense.created_by_name,
            action: isEscalatedToCeo ? 'EXPENSE_CREATED_ESCALATED' : 'EXPENSE_CREATED',
            module: 'Financials',
            details: `Logged expense of ${expense.amount} (${expense.category}): "${expense.description}". Status: Pending.${
                isEscalatedToCeo ? ' Auto-escalated to Group CEO / CFO.' : requiresHqApproval ? ' Flagged for Country Finance Director.' : ''
            }`
        });

        return mapExpenseRow(data);
    },

    async approve(
        id: string,
        approver: { id: string; name: string; role: string; countryCode?: string; notes?: string }
    ) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error(`Expense record not found: ${id}`);
        }

        // Zero Self-Approval Invariant: Creator can NEVER approve their own expense
        const isSelfApproval = Boolean(
            (existing.createdById && (existing.createdById === approver.id || existing.created_by_id === approver.id)) ||
            (existing.createdByName && approver.name && existing.createdByName.trim().toLowerCase() === approver.name.trim().toLowerCase()) ||
            (existing.created_by_name && approver.name && existing.created_by_name.trim().toLowerCase() === approver.name.trim().toLowerCase())
        );

        if (isSelfApproval) {
            throw new Error('Maker-Checker violation: Expense creator cannot approve their own expense (4-Eyes Principle).');
        }

        const approverRole = (approver.role || '').toLowerCase().trim();
        const expenseCountry = (existing.countryCode || existing.country_code || 'ET').toUpperCase();

        // Multi-Country Sovereignty & Isolation: Non-group approvers cannot approve cross-border
        const isGroupExec = ['group_ceo', 'group_cfo', 'cfo', 'super_admin'].includes(approverRole);
        if (!isGroupExec && approver.countryCode && approver.countryCode.toUpperCase() !== expenseCountry) {
            throw new Error(`Country Isolation Violation: Approver from ${approver.countryCode.toUpperCase()} cannot approve expenses in ${expenseCountry}. Cross-border approvals are strictly prohibited.`);
        }

        // Authority Tiers:
        const isCountryLead = isGroupExec || [
            'country_finance_director',
            'country_managing_director',
            'country_operations_director',
            'finance_manager',
            'managing_director'
        ].includes(approverRole);

        const isRegionalMgr = isCountryLead || [
            'regional_operations_manager',
            'regional_finance_manager',
            'regional_manager'
        ].includes(approverRole);

        if (!isRegionalMgr) {
            throw new Error(`Role "${approver.role}" is not authorized to approve operating expenses.`);
        }

        // Tier 3: > 20M ETB / KES or escalated_to_ceo requires Group CFO / Group CEO
        if (existing.amount > DEFAULT_COUNTRY_EXPENSE_LIMIT || existing.escalatedToCeo) {
            if (!isGroupExec) {
                throw new Error('Executive Authorization required: This expense exceeds the country autonomous limit (20,000,000) and requires Group CFO / Group CEO approval.');
            }
        } else if (existing.amount > DEFAULT_REGIONAL_EXPENSE_LIMIT) {
            // Tier 2: 2M - 20M ETB / KES requires Country Leadership
            if (!isCountryLead) {
                throw new Error('Autonomous Cap Exceeded: Expense amount exceeds regional autonomous limit (2,000,000). Requires Country Finance Director or Country Managing Director approval.');
            }
        }

        const { data, error } = await supabase.rpc('decide_expense', { p_expense_id: id, p_decision: 'Approved', p_reason: approver.notes?.trim() || 'Expense approval' });
        if (error) throw error;
        if (!data?.success || data.status !== 'Approved') throw new Error('Expense approval was not confirmed.');
        const fresh = await this.getById(id);
        if (!fresh || fresh.status !== 'Approved') throw new Error('Approved expense could not be verified.');
        return fresh;
    },

    async recordPayment(
        id: string,
        payment: { paymentRef: string; paidById: string; paidByName: string }
    ) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error(`Expense record not found: ${id}`);
        }

        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('expenses')
            .update({
                status: 'Paid',
                payment_ref: payment.paymentRef,
                updated_at: now
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('expensesService', 'recordPayment failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: payment.paidByName,
            action: 'EXPENSE_SETTLED',
            module: 'Financials',
            details: `Settled expense #${id.slice(0, 8)} (${existing.amount}). Payment ref: ${payment.paymentRef}.`
        });

        return mapExpenseRow(data);
    },

    async update(id: string, updates: Record<string, any>) {
        const dbUpdates: Record<string, any> = {
            updated_at: new Date().toISOString()
        };
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.approvedBy) {
            dbUpdates.approved_by = updates.approvedBy;
            dbUpdates.approved_by_name = updates.approvedBy;
            dbUpdates.approved_at = new Date().toISOString();
        }
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.amount) dbUpdates.amount = updates.amount;
        if (updates.description) dbUpdates.description = updates.description;

        const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('expensesService', 'update failed:', error);
            throw error;
        }

        return mapExpenseRow(data);
    },

    async reject(
        id: string,
        rejector: { id: string; name: string; role: string; reason?: string }
    ) {
        if (!rejector.reason?.trim()) throw new Error('A rejection reason is required.');
        const { data, error } = await supabase.rpc('decide_expense', { p_expense_id: id, p_decision: 'Rejected', p_reason: rejector.reason.trim() });
        if (error) throw error;
        if (!data?.success || data.status !== 'Rejected') throw new Error('Expense rejection was not confirmed.');
        const fresh = await this.getById(id);
        if (!fresh || fresh.status !== 'Rejected') throw new Error('Rejected expense could not be verified.');
        return fresh;
    },

    /**
     * Replaces hard deletion with a Zero-Trust Soft-Void audit action.
     */
    async voidExpense(
        id: string,
        voidData: { reason: string; voidedById: string; voidedByName: string }
    ) {
        if (!voidData.reason || voidData.reason.trim().length < 5) {
            throw new Error('Mandatory void reason required: Must provide at least 5 characters explaining the void.');
        }

        const existing = await this.getById(id);
        if (!existing) {
            throw new Error(`Expense record not found: ${id}`);
        }

        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('expenses')
            .update({
                status: 'Voided',
                void_reason: voidData.reason.trim(),
                voided_by_id: voidData.voidedById,
                voided_by_name: voidData.voidedByName,
                voided_at: now,
                updated_at: now
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('expensesService', 'voidExpense failed:', error);
            throw error;
        }

        await systemLogsService.create({
            user_name: voidData.voidedByName,
            action: 'EXPENSE_VOIDED',
            module: 'Financials',
            details: `Voided expense #${id.slice(0, 8)} (${existing.amount} - ${existing.category}). Reason: "${voidData.reason}".`
        });

        return mapExpenseRow(data);
    },

    /**
     * Prohibited: Zero-trust rules prohibit hard deletion of financial records.
     */
    async delete(_id: string): Promise<never> {
        throw new Error('Zero-Trust Policy Violation: Hard deletion of financial records is prohibited. Use voidExpense() with mandatory reason code.');
    },

    // Server-Side Financial Analytics with Multi-Country Tenant Isolation
    async getFinancialMetrics(siteId?: string, startDate?: string, endDate?: string, countryCode?: string) {
        const params: Record<string, any> = {
            p_country_code: countryCode || 'ET'
        };
        if (siteId && siteId !== 'All') params.p_site_id = siteId;
        if (startDate) params.p_start_date = startDate;
        if (endDate) params.p_end_date = endDate;

        const { data, error } = await supabase
            .rpc('get_financial_metrics', params);

        if (error) throw error;
        return data;
    }
};
