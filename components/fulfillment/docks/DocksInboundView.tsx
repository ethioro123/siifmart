import React from 'react';
import type { PurchaseOrder } from '../../../types';
import { DocksHistory } from './DocksHistory';
import { DOCK_BAYS } from '../../../utils/shipmentWorkflow';

interface Props {
    orders: PurchaseOrder[];
    arrivals: PurchaseOrder[];
    assignDock: (dock: string, order: PurchaseOrder) => void;
    openReceiving: () => void;
    busy: boolean;
    viewMode: 'Process' | 'History';
    t: (key: string) => string;
}

export const DocksInboundView: React.FC<Props> = ({ orders, arrivals, assignDock, openReceiving, busy, viewMode, t }) => {
    if (viewMode === 'History') return <DocksHistory orders={orders} t={t} />;
    return <div className="space-y-4 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-base font-semibold text-[var(--theme-text-primary)]">Inbound arrivals</h3>
                <p className="text-sm text-[var(--theme-text-secondary)]">Assign a bay if needed, then record the delivery in Receive. Bay assignment is optional.</p></div>
            <button type="button" onClick={openReceiving} className="min-h-11 rounded-xl px-4 text-sm font-semibold bg-[var(--theme-primary)] text-[var(--theme-primary-text)]">Open blind receiving</button>
        </div>
        <p className="text-xs text-[var(--theme-text-secondary)]">Receiving keeps expected quantities hidden. Count the delivered goods, complete quality checks, then hand over for putaway.</p>
        <section className="space-y-3" aria-label="Approved inbound deliveries">
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">Awaiting receiving ({arrivals.length})</h4>
            {arrivals.length === 0 && <p className="rounded-xl border border-dashed border-[var(--theme-border)] p-5 text-sm text-[var(--theme-text-secondary)]">No approved purchase orders awaiting receiving at this facility.</p>}
            {arrivals.map(order => <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
                <div className="min-w-0"><p className="font-semibold text-sm text-[var(--theme-text-primary)] break-words">{order.poNumber || order.po_number || order.id} · {order.supplierName}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">{order.status}{order.expectedDelivery ? ` · Expected ${order.expectedDelivery.slice(0,10)}` : ''}</p></div>
                <label className="text-xs text-[var(--theme-text-secondary)] space-y-1">Bay (optional)
                    <select aria-label={`Bay for ${order.poNumber || order.po_number || order.id}`} value={DOCK_BAYS.some(bay => bay === order.dockSlot) ? order.dockSlot : ''} disabled={busy}
                        onChange={event => assignDock(event.target.value, order)} className="block min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-sm text-[var(--theme-text-primary)] disabled:opacity-50">
                        <option value="">No bay assigned</option>
                        {DOCK_BAYS.map(bay => <option key={bay} value={bay} disabled={arrivals.some(other => other.id !== order.id && other.dockSlot === bay)}>{bay}</option>)}
                    </select>
                </label>
            </article>)}
        </section>
        <details className="rounded-xl border border-[var(--theme-border)] p-3 text-sm text-[var(--theme-text-secondary)]">
            <summary className="cursor-pointer min-h-11 flex items-center font-semibold">Bay availability</summary>
            <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">{DOCK_BAYS.map(bay => {
                const order = arrivals.find(candidate => candidate.dockSlot === bay);
                return <li key={bay} className="rounded-lg bg-[var(--theme-bg-subtle)] p-3">{bay}: {order ? `Occupied · ${order.poNumber || order.po_number || 'PO'}` : 'Available'}</li>;
            })}</ul>
        </details>
    </div>;
};
