import { PriceRetentionHold } from './PriceRetentionHold';
import { isPriceProposal } from '../../utils/priceApproval';
import { proposalApprovalBlock } from '../../utils/proposalReviewPolicy';
import React, { useState,useEffect } from 'react';
import type { Product } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { useProductChanges } from '../../hooks/useProductChanges';
import { checkRequiresFinanceSignoff } from '../../utils/pricingGovernance';
import { canViewCostPrice } from '../../utils/roles';
import { ProductEditApprovalProgress } from '../inventory/ProductEditApprovalProgress';
import { FloorAuditTimeline } from '../fulfillment/discrepancies/FloorAuditTimeline';
import { controlInput, ControlSection } from '../merchandising/product-control/ControlPrimitives';
function display(value: unknown): string {
    if (value === null || value === undefined || value === '') return 'Not recorded';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map(display).join(', ');
    if (typeof value === 'object') return Object.entries(value).filter(([key]) => !/cost|price|margin|credential|token|password/i.test(key)).map(([key, child]) => `${key.replace(/([a-z])([A-Z])/g, '$1 $2')}: ${display(child)}`).join(' · ');
    return String(value);
}
export function ProductChangesTab({ product, country, currency, changes, allowDecisions = false }: { product: Product; country: string; currency: string; changes: ReturnType<typeof useProductChanges>; allowDecisions?: boolean }) {
    const { user } = useStore();
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [notice, setNotice] = useState('');
    const [searchDraft,setSearchDraft]=useState(changes.historySearch);
    useEffect(()=>setSearchDraft(changes.historySearch),[changes.historySearch,product.id,country]);
    const run = async (id: string, action: 'approve' | 'reject' | 'finance') => {
        setNotice('');
        try {
            const result = await changes.decision.mutateAsync({ id, action, reason });
            setNotice(action === 'reject' ? 'Proposal rejected; recorded values retained.' : action === 'finance' ? 'Finance signoff recorded.' : result?.applied ? result.workflow==='price'?'Price change approved and applied.':'Three approvals received. Changes applied.' : `Regional approval recorded (${result?.approvalCount}/3).`);
            setRejectId(null); setReason('');
        } catch (error) { setNotice(error instanceof Error ? error.message : String((error as {message?:string})?.message || 'Decision was not saved.')); }
    };
    const financeRoles = ['group_ceo', 'country_finance_director', 'regional_finance_manager'];
    return <div className="space-y-5">
        <ControlSection title="Proposals and decisions" description="Each proposal belongs to this product record and location. Price-only proposals follow regional/country commercial approval and any required Country Finance clearance. Catalog/layout edits need three regional approvals. A stale proposal must be resubmitted.">
            {notice && <p role="status" className="rounded-xl border border-[var(--theme-border)] p-3 text-sm">{notice}</p>}
            {changes.history.isPending && <p role="status">Loading changes…</p>}{changes.history.isError && <p role="alert">Changes could not be loaded. <button onClick={() => changes.history.refetch()} className="underline">Retry</button></p>}
            {changes.history.data?.data.length === 0 && <p className="text-sm text-[var(--theme-text-secondary)]">No proposals recorded for this product location.</p>}
            {changes.history.data?.data.map(request => {
                const finance = checkRequiresFinanceSignoff(request.proposedChanges, request.currentProduct || product);
                const baselineKeys: Record<string, string> = { costPrice: 'cost_price', salePrice: 'sale_price', isOnSale: 'is_on_sale', minStock: 'min_stock', maxStock: 'max_stock', packQuantity: 'pack_quantity', customAttributes: 'custom_attributes', shelfPosition: 'shelf_position' };
                const canVote = !proposalApprovalBlock(request,user,request.currentProduct||product);
                return <article key={request.id} className="space-y-3 border-t border-[var(--theme-border)] pt-4"><div className="flex flex-wrap justify-between gap-2"><h4 className="text-sm font-semibold capitalize">{request.status} · {request.adjustmentReason?.replace(/^(MERCHANDISING:|PRICE_CHANGE:)\s*/, '') || 'Product change'}</h4><p className="text-xs text-[var(--theme-text-secondary)]">{new Date(request.requestedAt).toLocaleString()} · {request.requestedBy}</p></div>
                    <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(request.proposedChanges || {}).filter(([key]) => canViewCostPrice(user?.role) || key !== 'costPrice').map(([key, value]) => <div key={key}><dt className="text-xs text-[var(--theme-text-secondary)]">Proposed {key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}</dt><dd className="mt-1 break-words text-sm">{request.proposalBaseline ? <>{display(request.proposalBaseline[baselineKeys[key] || key])} → </> : null}{display(value)}</dd></div>)}</dl>
                    <ProductEditApprovalProgress request={request} />
                    {(isPriceProposal(request)?request.priceApprovalRoute?.requiresFinance:finance.requiresFinance) && <p className="text-sm">Finance signoff: {(isPriceProposal(request)?request.priceApprovalRoute?.financeCleared:request.financeApprovedByEmployeeId) ? 'Recorded' : 'Required'}</p>}
                    {request.status === 'rejected' && <p className="text-sm">Rejected by {request.rejectedBy || 'Recorded reviewer'}: {request.rejectionReason || 'No reason recorded'}</p>}
                    {request.status === 'approved' && <p className="text-sm">Applied {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : ''} · {request.approvedBy || 'Recorded approver'}</p>}
                    {request.status === 'pending' && allowDecisions && <div className="flex flex-wrap gap-2">{canVote && <button className={controlInput} disabled={changes.decision.isPending || (finance.requiresFinance && !request.financeApprovedByEmployeeId)} onClick={() => run(request.id, 'approve')}>{isPriceProposal(request)?'Approve price change':'Record regional approval'}</button>}{(isPriceProposal(request)?request.priceApprovalRoute?.canReject:user?.role && user.role in { regional_operations_manager: 1, regional_supply_chain_manager: 1, regional_merchandising_manager: 1 }) && <button className={controlInput} onClick={() => setRejectId(request.id)}>Reject with reason</button>}{(isPriceProposal(request)?request.priceApprovalRoute?.canFinance:finance.requiresFinance && !request.financeApprovedByEmployeeId && financeRoles.includes(user?.role || '')) && request.requestedByEmployeeId !== user?.id && <button disabled={changes.decision.isPending} className={controlInput} onClick={() => run(request.id, 'finance')}>Record Finance signoff</button>}</div>}
                    {rejectId === request.id && <div className="space-y-2"><label className="block text-sm">Rejection reason<textarea className={controlInput} value={reason} onChange={event => setReason(event.target.value)} /></label><button className={controlInput} disabled={!reason.trim() || changes.decision.isPending} onClick={() => run(request.id, 'reject')}>Confirm rejection</button><button onClick={() => setRejectId(null)} className={controlInput}>Cancel</button></div>}
                </article>;
            })}
        </ControlSection>
        <PriceRetentionHold key={country+product.id} productId={product.id} country={country} />
        <ControlSection title="Applied price history" description="Applied price changes are retained for 10 years. The default view shows the most recent 12 months; older records remain searchable.">
            <div className="flex flex-wrap gap-3 mb-4"><label className="text-sm">History period<select aria-label="Price history period" value={changes.historyWindow} onChange={event=>changes.setHistoryWindow(event.target.value as '12months'|'all')} className={controlInput}><option value="12months">Last 12 months</option><option value="all">All retained history</option></select></label>
                <form onSubmit={event=>{event.preventDefault();changes.setHistorySearch(searchDraft);}} className="flex flex-wrap items-end gap-2"><label className="text-sm">Search price history<input value={searchDraft} onChange={event=>setSearchDraft(event.target.value)} placeholder="Approver, requester or reason" maxLength={200} className={controlInput}/></label><button type="submit" className={controlInput}>Search</button></form></div>{changes.prices.isPending && <p>Loading price history…</p>}{changes.prices.isError && <p role="alert">Price history could not be loaded.</p>}{changes.prices.data?.length === 0 && <p className="text-sm">No applied price changes match this period and search.</p>}{changes.prices.data?.map(row => <p key={row.id} className="border-t border-[var(--theme-border)] pt-3 text-sm">{currency} {row.old_effective_price} → {row.new_effective_price} · {new Date(row.changed_at).toLocaleString()} · {row.actor_name || 'Recorded operator'}{row.reason ? ` · ${row.reason}` : ''}{row.requester_name ? ` · Requested by ${row.requester_name}` : ''}</p>)}</ControlSection>
        <FloorAuditTimeline scope={{ kind: 'product', id: product.id, siteId: product.siteId || product.site_id || '', country }} />
    </div>;
}
