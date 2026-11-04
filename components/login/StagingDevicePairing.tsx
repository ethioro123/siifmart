import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { checkIsLocalhost, isStagingQuickLoginAvailable } from '../../utils/stagingQuickLogin';
import { useStagingDevicePairing } from '../../hooks/useStagingQuickLogin';

export function StagingDevicePairing() {
    const { status, code, pair } = useStagingDevicePairing();
    const [enteredCode, setEnteredCode] = useState('');
    if (!isStagingQuickLoginAvailable()) return null;
    const local = checkIsLocalhost();
    const button = 'min-h-[44px] rounded-xl px-4 py-2 border border-[var(--theme-border)] text-sm text-[var(--theme-text-primary)] disabled:opacity-50';
    return <section className="my-4 rounded-2xl border border-[var(--theme-border)] p-4 space-y-3" aria-label="Mobile staging quick login">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--theme-text-primary)]"><Smartphone size={16} />Mobile staging quick login</h3>
        {local ? <>
            <p className="text-xs text-[var(--theme-text-secondary)]">Generate a one-time code, then enter it on your phone’s staging login page. The code expires in five minutes.</p>
            <button type="button" className={button} disabled={code.isPending} onClick={() => code.mutate()}>Generate pairing code</button>
            {code.data && <output aria-live="polite" className="block font-mono text-2xl tracking-[.2em] text-[var(--theme-text-primary)]">{code.data.code}</output>}
        </> : status.data?.paired ? <p role="status" className="text-sm text-[var(--theme-text-primary)]">Phone paired. Open Quick Login below to choose a test account.</p> : <>
            <p className="text-xs text-[var(--theme-text-secondary)]">On your Mac, open localhost:3000 and generate a pairing code. Enter it here to unlock staging test accounts on this phone for two hours.</p>
            <label htmlFor="staging-device-code" className="block text-sm text-[var(--theme-text-primary)]">Pairing code</label>
            <input id="staging-device-code" inputMode="numeric" autoComplete="off" maxLength={8} value={enteredCode}
                onChange={e => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                className="w-full min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-[var(--theme-text-primary)]" />
            <button type="button" className={button} disabled={enteredCode.length !== 8 || pair.isPending}
                onClick={() => pair.mutate(enteredCode, { onSuccess: () => setEnteredCode('') })}>Pair this phone</button>
        </>}
        {(code.error || pair.error) && <p role="alert" className="text-sm text-[var(--theme-status-danger-text)]">{(code.error || pair.error)?.message}</p>}
        {status.isError && <button type="button" className={button} onClick={() => void status.refetch()}>Retry pairing connection</button>}
    </section>;
}
