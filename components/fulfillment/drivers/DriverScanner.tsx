import React, { useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import type { WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface DriverScannerProps {
    jobs: WMSJob[];
    onClose: () => void;
    onSelect: (job: WMSJob) => void;
}

/** Shipment lookup never changes custody or delivery status. */
export const DriverScanner: React.FC<DriverScannerProps> = ({ jobs, onClose, onSelect }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    return <div role="dialog" aria-modal="true" aria-labelledby="driver-scan-title"
        className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--theme-bg-app)] p-4">
        <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h2 id="driver-scan-title" className="flex items-center gap-2 text-base font-semibold text-[var(--theme-text-primary)]"><ScanLine size={20} /> Find shipment</h2>
                <button type="button" onClick={onClose} aria-label="Close shipment lookup" className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]"><X size={20} /></button>
            </div>
            <p className="text-sm text-[var(--theme-text-secondary)]">Scan with your handheld scanner or enter the shipment or tracking code to open its manifest.</p>
            <form className="space-y-3" onSubmit={event => {
                event.preventDefault();
                const scan = code.trim().replace(/^#/, '').toLowerCase();
                const job = scan ? jobs.find(candidate => [candidate.id, candidate.jobNumber, candidate.trackingNumber, formatJobId(candidate)]
                    .some(value => value?.toLowerCase() === scan)) : undefined;
                if (!job) { setError('No authorized active shipment matches this code. Check your assignment with dispatch.'); return; }
                onSelect(job);
            }}>
                <label className="block text-xs font-medium text-[var(--theme-text-primary)]" htmlFor="shipment-scan-code">Shipment or tracking code</label>
                <input id="shipment-scan-code" autoFocus autoComplete="off" value={code} onChange={event => { setCode(event.target.value); setError(''); }}
                    className="min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 font-mono text-sm text-[var(--theme-text-primary)] focus:outline-2 focus:outline-[var(--theme-primary)]" />
                {error && <p role="alert" className="text-xs text-[var(--theme-text-secondary)]">{error}</p>}
                <button type="submit" className="min-h-11 w-full rounded-xl bg-[var(--theme-primary)] px-4 text-sm font-semibold text-[var(--theme-primary-text)]">Open manifest</button>
            </form>
        </div>
    </div>;
};
