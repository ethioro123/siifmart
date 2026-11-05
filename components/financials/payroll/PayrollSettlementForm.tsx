import React, { useState } from 'react';
import type { PayrollRun } from '../../../types';
import { usePayrollCommands } from '../../../hooks/usePayrollCommands';
interface Props { run: PayrollRun; actorId?: string; role?: string; onSaved: (run: PayrollRun) => void }
export function PayrollSettlementForm({ run, actorId, role, onSaved }: Props) {
    const [reference, setReference] = useState(''), [evidence, setEvidence] = useState('');
    const command = usePayrollCommands();
    const authorized = role && ['group_ceo', 'group_cfo', 'country_finance_director', 'regional_finance_manager', 'treasury_officer'].includes(role) && actorId && ![run.initiatedById, run.hrApprovedById, run.financeApprovedById].includes(actorId);
    const save = async () => { try { onSaved(await command.mutateAsync({ action: 'settle', id: run.id, reference, notes: evidence })); } catch { /* Error is shown below. */ } };
    return <section className="space-y-3 rounded-xl border border-[var(--theme-border)] p-4 text-sm">
        <h4 className="font-semibold">Payroll expense prepared</h4>
        <p>No completed payment has been recorded. An independent Finance or Treasury officer must check the completed payment and record its reference and evidence.</p>
        {authorized && <>
            <label className="block">Completed payment reference<input className="mt-1 min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-[var(--theme-text-primary)]" maxLength={150} value={reference} onChange={e => setReference(e.target.value)} disabled={command.isPending} /></label>
            <label className="block">Settlement evidence<textarea className="mt-1 min-h-24 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 text-[var(--theme-text-primary)]" maxLength={1200} value={evidence} onChange={e => setEvidence(e.target.value)} disabled={command.isPending} /></label>
            <button type="button" className="min-h-11 rounded-lg bg-[var(--theme-primary)] px-4 text-[var(--theme-primary-text)] disabled:opacity-50" disabled={command.isPending || reference.trim().length < 6 || evidence.trim().length < 10} onClick={() => void save()}>Record completed payment</button>
        </>}
        {command.isError && <p role="alert">{command.error instanceof Error ? command.error.message : 'Settlement was not recorded.'}</p>}
    </section>;
}
