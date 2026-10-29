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
        const { data, error } = await supabase.rpc('counter_review_queue', { p_site: site, p_country: country });
        if (error) throw error;
        return data as { shifts: Array<{ id: string; cashier_id: string; cashier_name: string; counter_number: string; variance: number; ledger_version: number }>; drops: Array<{ id: string; cashier_id: string; cashier_name: string; amount: number; currency: string; safe_bag_number: string }> };
    },
    async approveDrop(id: string) {
        const { data, error } = await supabase.rpc('approve_counter_drop', { p_drop: id });
        if (error) throw error; return data;
    },
};
