import { supabase } from '../lib/supabase';
import type { ShiftRecord } from '../types';
import { mapShiftRow } from './shifts.service';
export interface CounterSummary { cash: number; card: number; mobile: number; drops: number; total: number; expected: number; blind: boolean }
export const counterControlService = {
    async open(site: string, counter: string, float: number, request: string) {
        const { data, error } = await supabase.rpc('open_counter_shift', { p_site: site, p_counter: counter, p_float: float, p_request: request });
        if (error) throw error;
        if (!data?.id) throw new Error('Counter opening was not confirmed');
        return mapShiftRow(data);
    },
    async close(shift: ShiftRecord) {
        const { data, error } = await supabase.rpc('submit_counter_count', { p_shift: shift.id, p_denominations: shift.denominations || {}, p_reason: shift.discrepancyReason || '' });
        if (error) throw error;
        if (!data?.count_submitted_at) throw new Error('Counter count was not confirmed');
        return mapShiftRow(data);
    },
    async summary(id: string): Promise<CounterSummary> {
        const { data, error } = await supabase.rpc('counter_shift_summary', { p_shift: id });
        if (error) throw error;
        return data;
    },
    async review(id: string, stage: 'supervisor' | 'finance', action: 'Reconciled' | 'Flagged', notes: string) {
        const { data, error } = await supabase.rpc('review_counter_shift', { p_shift: id, p_stage: stage, p_action: action, p_notes: notes });
        if (error) throw error;
        return data;
    },
    async queue(site: string, country: string) {
        const [shifts, drops] = await Promise.all([
            supabase.from('shifts').select('id,cashier_id,cashier_name,counter_number,status,count_submitted_at,variance,variance_flagged,supervisor_id,reconciliation_status,ledger_version')
                .eq('site_id', site).eq('country_code', country).eq('status', 'Closed').is('supervisor_id', null).order('end_time').limit(25),
            supabase.from('pos_cash_drops').select('id,cashier_id,cashier_name,amount,currency,safe_bag_number').eq('site_id', site).eq('country_code', country).eq('status', 'pending_supervisor').order('created_at').limit(25),
        ]);
        if (shifts.error) throw shifts.error; if (drops.error) throw drops.error;
        return { shifts: shifts.data || [], drops: drops.data || [] };
    },
    async approveDrop(id: string) {
        const { data, error } = await supabase.rpc('approve_counter_drop', { p_drop: id });
        if (error) throw error; return data;
    },
};
