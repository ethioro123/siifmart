import React from 'react';
import { CheckCircle, Navigation, Truck } from 'lucide-react';
import type { User, WMSJob } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useShipmentWorkflow } from '../../../hooks/useShipmentWorkflow';
import { canManageDispatch, getShipmentDepartureError, getShipmentPhase, isShipment } from '../../../utils/shipmentWorkflow';

interface Props {
    job: WMSJob;
    user: User | null;
    onRefresh: () => Promise<void>;
    onArrival: () => void;
    onNavigate: () => void;
    onDeparted: () => void;
}

export function ShipmentActions({ job, user, onRefresh, onArrival, onNavigate, onDeparted }: Props) {
    const { addNotification, employees } = useData();
    const workflow = useShipmentWorkflow(onRefresh);
    if (!isShipment(job)) return null;
    const phase = getShipmentPhase(job);
    const manager = canManageDispatch(user?.role);
    const employee = employees.find(candidate => candidate.id === user?.id ||
        (user?.email && candidate.email.toLowerCase() === user.email.toLowerCase()));
    const assigned = Boolean(job.assignedTo && [user?.id, employee?.id].includes(job.assignedTo));
    const canArrive = manager || (user?.role === 'driver' && assigned);
    if (phase === 'ready') {
        const error = getShipmentDepartureError(job);
        return <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs text-[var(--theme-text-secondary)]">{manager ? error || 'Ready for dispatch release.' : 'Awaiting dispatch release from the outbound dock.'}</p>
            {manager && <button type="button" disabled={workflow.isPending || Boolean(error)} onClick={async () => {
                try {
                    await workflow.mutateAsync({ job, action: { type: 'depart' } });
                    addNotification('success', 'Shipment released. The driver can now record arrival.');
                    onDeparted();
                } catch (cause) {
                    addNotification('alert', cause instanceof Error ? cause.message : 'Could not release shipment.');
                }
            }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-semibold text-[var(--theme-primary-text)] disabled:opacity-40"><Truck size={16} /> Release shipment</button>}
        </div>;
    }
    if (phase === 'in-transit') return <>
        <button type="button" onClick={onNavigate} className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-primary)]"><Navigation size={14} /> Navigate</button>
        <button type="button" onClick={onArrival} disabled={!canArrive} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-3 text-xs font-semibold text-[var(--theme-primary-text)] disabled:opacity-40"><CheckCircle size={16} /> Record arrival</button>
    </>;
    return <p className="flex-1 text-xs text-[var(--theme-text-secondary)]" role="status">{phase === 'awaiting-receipt' ? 'Arrival logged · awaiting destination receiving inspection' : phase === 'closed' ? 'Transport job closed' : 'Shipment is not ready for transport.'}</p>;
}
