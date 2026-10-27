import Modal from '../../Modal';
import type { PriceBatch, PriceBatchResult } from '../../../utils/priceManager';
import { normalizePriceProposal, productSiteName, sellingMargin } from '../../../utils/priceManager';
import { effectivePrice } from '../../../utils/pricingGovernance';
import { formatPriceValue } from '../../../utils/formatting';

interface Props {
    batch: PriceBatch | null; failures?: PriceBatchResult['failures'];
    sites: Array<{ id: string; name: string }>; currency: string; pending: boolean;
    onConfirm: () => void; onClose: () => void;
}
export function PriceBatchPreview({ batch, failures = [], sites, currency, pending, onConfirm, onClose }: Props) {
    if (!batch) return null;
    const locations = new Set(batch.changes.map(change => change.product.siteId || change.product.site_id));
    return <Modal isOpen onClose={() => { if (!pending) onClose(); }} title="Review price proposals" size="xl">
        <div className="space-y-4 text-[var(--theme-text-primary)]">
            <p>{batch.source} · {batch.changes.length} product record(s) across {locations.size} location(s).</p>
            <p className="text-sm text-[var(--theme-text-secondary)]">Selling prices round to the nearest whole number. Submission creates proposals; Operations, Supply Chain and Merchandising must approve before prices change. Below-floor prices also require Finance signoff.</p>
            <div className="max-h-[50vh] overflow-auto rounded-xl border border-[var(--theme-border)]">
                <table className="w-full text-left text-sm"><thead><tr><th className="p-3">Product / location</th><th className="p-3">Selling price</th><th className="p-3">Proposed margin</th></tr></thead>
                    <tbody>{batch.changes.map(({ product, proposal }) => {
                        let normalized = proposal; let validation = '';
                        try { normalized = normalizePriceProposal(proposal); } catch (error) { validation = (error as Error).message; }
                        const margin = sellingMargin(normalized);
                        const failure = failures.find(item => item.productId === product.id);
                        return <tr key={product.id} className="border-t border-[var(--theme-border)]"><td className="p-3">{product.name}<p className="text-xs text-[var(--theme-text-secondary)]">{product.sku} · {productSiteName(product, sites)}</p>{(validation || failure) && <p className="text-xs text-[var(--theme-danger)]">{validation || failure?.message}</p>}</td>
                            <td className="p-3 whitespace-nowrap">{currency} {formatPriceValue(effectivePrice(product) || 0)} → {formatPriceValue(effectivePrice(normalized) || 0)}<p className="text-xs text-[var(--theme-text-secondary)]">Regular {formatPriceValue(product.price)} → {formatPriceValue(normalized.price)}</p></td>
                            <td className="p-3">{margin === null ? 'Cost unavailable' : `${margin.toFixed(1)}%${margin < 15 ? ' · Finance signoff' : ''}`}</td></tr>;
                    })}</tbody></table>
            </div>
            <div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-4 disabled:opacity-50">Cancel</button><button type="button" disabled={pending} onClick={onConfirm} className="min-h-[44px] rounded-xl bg-[var(--theme-accent)] px-4 text-white disabled:opacity-50">{pending ? 'Submitting…' : failures.length ? 'Retry remaining proposals' : 'Submit proposals'}</button></div>
        </div>
    </Modal>;
}
