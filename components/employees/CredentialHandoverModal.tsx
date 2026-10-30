import React, { useState } from 'react';
import { Copy, Printer, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Modal from '../Modal';
import type { Employee } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { isManagerialRole, getEmployeeJobTitle } from '../../utils/roles';
import { useEmployeeAccessHandover } from '../../hooks/useEmployeeAccessHandover';
import { formatDisplayEmployeeId } from '../../utils/employeeIdGenerator';
import { escapeHtml } from '../../utils/labels/escapeHtml';
import { printHtmlContent } from '../../utils/printHelper';

interface Props {
    employee: Employee | null; isOpen: boolean; onClose: () => void;
    onHandoverComplete?: (employeeId: string) => void;
}
export function CredentialHandoverModal(props: Props) {
    const { user } = useStore();
    const { effectiveCountry, activeSite } = useData();
    if (!props.isOpen || !props.employee || !user?.id || !isManagerialRole(user.role) || !effectiveCountry) return null;
    return <HandoverSession key={`${user.id}:${user.role}:${activeSite?.id}:${effectiveCountry}:${props.employee.id}`} {...props} employee={props.employee} countryCode={effectiveCountry} />;
}
function HandoverSession({ employee, countryCode, onClose, onHandoverComplete }: Omit<Props, 'employee'> & { employee: Employee; countryCode: string }) {
    const { sites, addNotification } = useData();
    const { access, prepare, complete } = useEmployeeAccessHandover(employee.id, countryCode);
    const [showPassword, setShowPassword] = useState(false);
    const [outputBusy, setOutputBusy] = useState(false);
    const [outputError, setOutputError] = useState('');
    const site = sites.find(item => item.id === employee.siteId);
    const busy = prepare.isPending || complete.isPending || outputBusy;
    const portalUrl = window.location.origin;
    const slip = [
        'SIIFMART — STAFF ACCESS HANDOVER', employee.name, getEmployeeJobTitle(employee),
        `Staff code: ${formatDisplayEmployeeId(employee, sites)}`, `Workplace: ${site?.name || 'Assigned workplace'}`,
        `Portal: ${portalUrl}`, `Login: ${access?.email || employee.email}`,
        access?.temporaryPassword ? `Temporary password: ${access.temporaryPassword}` : 'Existing account: password is not displayed or changed.',
        'Keep credentials private. Change the temporary password after signing in.',
        'Terminal access must be configured through its authorized access workflow.'
    ].join('\n');
    const copy = async () => {
        setOutputBusy(true); setOutputError('');
        try { await navigator.clipboard.writeText(slip); addNotification('info', 'Access slip copied.'); }
        catch { setOutputError('Could not copy the access slip.'); }
        finally { setOutputBusy(false); }
    };
    const print = async () => {
        setOutputBusy(true); setOutputError('');
        try {
            const result = await printHtmlContent(`<!doctype html><html><head><meta charset="utf-8"><title>Staff access handover</title></head><body><pre style="white-space:pre-wrap;font:14px sans-serif">${escapeHtml(slip)}</pre></body></html>`);
            if (!result?.success) throw new Error('Print handoff unavailable');
            addNotification('info', 'Access slip sent to printing. Confirm the printed output.');
        } catch { setOutputError('Could not hand off the access slip for printing.'); }
        finally { setOutputBusy(false); }
    };
    const confirm = async () => {
        try {
            await complete.mutateAsync();
            addNotification('success', `Access handover saved for ${employee.name}.`);
            onHandoverComplete?.(employee.id); onClose();
        } catch { /* The mutation error remains visible; keep the handover open. */ }
    };
    const button = 'min-h-11 px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-sm text-[var(--theme-text-primary)] disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
    return <Modal isOpen onClose={() => { if (!busy) onClose(); }} title="Staff access handover" size="lg">
        <div className="space-y-5">
            <div><h3 className="text-base font-semibold text-[var(--theme-text-primary)]">{employee.name}</h3><p className="text-sm text-[var(--theme-text-secondary)]">{getEmployeeJobTitle(employee)} · {site?.name || 'Assigned workplace'}</p><p className="text-sm font-mono">{formatDisplayEmployeeId(employee, sites)}</p></div>
            <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] space-y-2">
                <p className="text-sm">Login: {access?.email || employee.email}</p><p className="text-sm break-all">Portal: {portalUrl}</p>
                {!access && <p className="text-sm text-[var(--theme-text-secondary)]">Prepare access to verify the approved employee and login account. Existing passwords are never retrieved or reset here.</p>}
                {access?.accountStatus === 'existing' && <p role="status" className="text-sm">Existing login account verified. Use the employee’s private password or the authorized password reset process.</p>}
                {access?.temporaryPassword && <><p className="text-sm">New account created. This password is available only during this handover session.</p><div className="flex items-center gap-3"><span className="font-mono text-sm break-all">{showPassword ? access.temporaryPassword : '••••••••••••'}</span><button type="button" aria-label={showPassword ? 'Hide temporary password' : 'Show temporary password'} onClick={() => setShowPassword(!showPassword)} className={button}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></>}
            </div>
            <p className="text-sm text-[var(--theme-text-secondary)]">Hand over access privately. Terminal PINs are configured separately and are never inferred from the staff code.</p>
            {(prepare.error || complete.error || outputError) && <p role="alert" className="text-sm text-[var(--theme-status-danger-text)]">{outputError || prepare.error?.message || complete.error?.message}</p>}
            <div className="flex flex-wrap gap-2">
                {!access && <button type="button" disabled={busy} onClick={() => { void prepare.mutateAsync().catch(() => undefined); }} className={button}>{prepare.isPending ? 'Verifying access…' : 'Prepare login access'}</button>}
                {access && <><button type="button" disabled={busy} onClick={copy} className={button}><Copy aria-hidden="true" size={15} className="inline mr-2" />Copy access slip</button><button type="button" disabled={busy} onClick={print} className={button}><Printer aria-hidden="true" size={15} className="inline mr-2" />Print access slip</button></>}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--theme-border)] pt-4"><button type="button" onClick={onClose} disabled={busy} className={button}>Close</button><button type="button" disabled={!access || busy} onClick={confirm} className={button}><ShieldCheck aria-hidden="true" size={15} className="inline mr-2" />{complete.isPending ? 'Saving handover…' : 'Confirm access handover'}</button></div>
        </div>
    </Modal>;
}
export default CredentialHandoverModal;
