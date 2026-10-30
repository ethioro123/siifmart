import { supabase } from '../lib/supabase';
export interface PreparedEmployeeAccess {
    employeeId: string; email: string; accountStatus: 'created' | 'existing'; temporaryPassword?: string;
}
export const employeeAccessService = {
    async prepare(employeeId: string, countryCode: string): Promise<PreparedEmployeeAccess> {
        const { data, error } = await supabase.functions.invoke('employee-access', { body: { action: 'prepare', employeeId, countryCode } });
        if (error || data?.error) throw new Error('Login access was not confirmed. Verify the employee account before retrying.');
        if (data?.employeeId !== employeeId || !['created', 'existing'].includes(data?.accountStatus) ||
            typeof data?.email !== 'string' || (data.accountStatus === 'created' && typeof data.temporaryPassword !== 'string')) throw new Error('Invalid login access confirmation');
        return { employeeId, email: data.email, accountStatus: data.accountStatus, ...(data.accountStatus === 'created' ? { temporaryPassword: data.temporaryPassword } : {}) };
    },
    async complete(employeeId: string, countryCode: string): Promise<string> {
        const { data, error } = await supabase.functions.invoke('employee-access', { body: { action: 'complete', employeeId, countryCode } });
        if (error || data?.error || data?.employeeId !== employeeId || typeof data?.handedOverAt !== 'string' || !Number.isFinite(Date.parse(data.handedOverAt))) throw new Error('Handover was not saved. Try again.');
        return data.handedOverAt;
    }
};
