import React, { useState, useEffect } from 'react';
import { Truck, Navigation } from 'lucide-react';
import type { User, WMSJob } from '../../../../types';
import type { ShipmentAction } from '../../../../hooks/useShipmentWorkflow';
import { DOCK_BAYS, getShipmentDepartureError, getShipmentUnits } from '../../../../utils/shipmentWorkflow';
import { formatJobId } from '../../../../utils/jobIdFormatter';

interface Props {
    dock: string;
    occupiedDocks?: string[];
    destination?: string;
    job?: WMSJob;
    drivers: User[];
    canManage: boolean;
    busy: boolean;
    onOpen: (job: WMSJob) => void;
    onAction: (job: WMSJob, action: ShipmentAction) => Promise<void>;
}

export function OutboundDockCard({ dock, job, occupiedDocks = [], destination, drivers, canManage, busy, onOpen, onAction }: Props) {
    const [carrier, setCarrier] = useState(job?.externalCarrierName || '');
    useEffect(() => setCarrier(job?.externalCarrierName || ''), [job?.id, job?.externalCarrierName]);
    const inputClass = 'min-w-0 min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-2 text-xs text-[var(--theme-text-primary)] disabled:opacity-50';
    return <section className="space-y-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3">
        <h4 className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-primary)]"><Truck size={15} /> {dock} <span className="ml-auto text-[var(--theme-text-secondary)]">{job ? (dock === 'Staging' ? 'Awaiting loading' : 'Loading') : 'Open'}</span></h4>
        {!job ? <p className="py-5 text-xs text-[var(--theme-text-secondary)]">Choose this dock from the staging queue.</p> : <>
            <button type="button" onClick={() => onOpen(job)} className="min-h-11 w-full break-words text-left text-xs font-semibold text-[var(--theme-primary)] underline underline-offset-2">#{formatJobId(job)} · {getShipmentUnits(job)} units · Manifest</button>
            {destination && <p className="text-xs text-[var(--theme-text-secondary)] break-words">Destination: {destination}</p>}
            <label className="block space-y-1 text-xs text-[var(--theme-text-secondary)]">Loading bay
                <select aria-label={`Loading bay for ${formatJobId(job)}`} className={inputClass} value={dock === 'Staging' ? '' : dock} disabled={!canManage || busy}
                    onChange={event => { if (event.target.value) void onAction(job, { type: 'load', dock: event.target.value }); }}>
                    <option value="" disabled>Select bay after loading</option>
                    {DOCK_BAYS.map(bay => <option key={bay} value={bay} disabled={occupiedDocks.includes(`Dock ${bay}`)}>{bay}</option>)}
                </select>
            </label>
            <label className="block space-y-1 text-xs text-[var(--theme-text-secondary)]">Transport
                <select aria-label={`Transport for ${formatJobId(job)}`} className={inputClass} value={job.deliveryMethod || 'Internal'} disabled={!canManage || busy}
                    onChange={event => void onAction(job, { type: 'transport', method: event.target.value as 'Internal' | 'External' })}>
                    <option value="Internal">Internal driver</option><option value="External">External carrier</option>
                </select>
            </label>
            {job.deliveryMethod === 'External' ? <form className="flex gap-1" onSubmit={event => { event.preventDefault(); void onAction(job, { type: 'carrier', name: carrier }); }}>
                <input aria-label={`Carrier for ${formatJobId(job)}`} placeholder="Carrier name" value={carrier} className={inputClass} disabled={!canManage || busy} onChange={event => setCarrier(event.target.value)} />
                <button disabled={!canManage || busy || !carrier.trim() || carrier.trim() === job.externalCarrierName} className="min-h-11 px-2 text-xs font-semibold text-[var(--theme-primary)] disabled:opacity-40">Save</button>
            </form> : <label className="block space-y-1 text-xs text-[var(--theme-text-secondary)]">Verified driver
                <select aria-label={`Driver for ${formatJobId(job)}`} className={inputClass} value={job.assignedTo || ''} disabled={!canManage || busy}
                    onChange={event => void onAction(job, { type: 'assign', driverId: event.target.value })}>
                    <option value="">Assign driver</option>
                    {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
            </label>}
            {getShipmentDepartureError(job) && <p className="text-xs text-[var(--theme-text-secondary)]">{getShipmentDepartureError(job)}</p>}
            <button type="button" disabled={!canManage || busy || Boolean(getShipmentDepartureError(job)) || (job.deliveryMethod === 'External' && carrier.trim() !== job.externalCarrierName)}
                onClick={() => void onAction(job, { type: 'depart' })}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] px-2 text-xs font-semibold text-[var(--theme-primary-text)] disabled:opacity-40"><Navigation size={14} /> Release shipment</button>
            {dock !== 'Staging' && <button type="button" disabled={!canManage || busy} onClick={() => void onAction(job, { type: 'unstage' })}
                className="min-h-11 w-full text-xs text-[var(--theme-text-secondary)] disabled:opacity-40">Return to staging</button>}
        </>}
    </section>;
}
