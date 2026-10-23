import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import type { PurchaseOrder } from '../../types';
import { getVisibleFulfillmentTabs } from '../../utils/fulfillmentTabPermissions';
import { canAccessModule } from '../../utils/permissions';

export function POReceivingHandoff({ po }: { po: PurchaseOrder }) {
    const { sites, activeSite } = useData();
    const { user } = useStore();
    const destination = sites.find(site => site.id === po.siteId);
    const tabs = getVisibleFulfillmentTabs(user?.role);
    const siteId = user?.role === 'group_ceo' ? activeSite?.id : user?.siteId;
    const canOpen = canAccessModule(user?.role, 'warehouse') && tabs.includes('RECEIVE') && siteId === po.siteId;
    if (!['Approved', 'Ordered', 'Partially Received'].includes(po.status)) return null;
    return <section aria-label="Receiving instructions" className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-4 space-y-2 text-sm text-[var(--theme-text-primary)]">
        <p className="font-semibold">Receive at {destination?.name || 'the PO destination warehouse / DC'}{destination?.code ? ` (${destination.code})` : ''}</p>
        <p>Open Fulfillment → Receive at this facility, choose the PO, then load its items. Confirm the delivered quantities and required checks before saving.</p>
        <p className="text-[var(--theme-text-secondary)]">A receiver needs the RECEIVE task assigned by the warehouse manager in Fulfillment → Assign. Procurement approval does not record a physical receipt.</p>
        {canOpen ? <Link className="inline-flex min-h-11 items-center rounded-xl px-4 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold" to="/wms-ops?tab=RECEIVE">Open Receiving</Link>
            : <p className="text-[var(--theme-text-secondary)]">Use the destination facility’s warehouse manager or assigned receiver login.</p>}
    </section>;
}
