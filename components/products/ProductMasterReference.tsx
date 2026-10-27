import { useQuery } from '@tanstack/react-query';
import type { Product } from '../../types';
import { useStore } from '../../contexts/CentralStore';
import { productReferenceService } from '../../services/product-reference.service';
import { ControlSection, ControlFact } from '../merchandising/product-control/ControlPrimitives';
import { getSellUnit } from '../../utils/units';
export function ProductMasterReference({ product, country }: { product: Product; country: string }) {
    const { user } = useStore();
    const query = useQuery({ queryKey: ['product_master_reference', country, product.siteId || product.site_id, product.sku, user?.id], queryFn: () => productReferenceService.get(country, product.sku), enabled: Boolean(user?.id && country && product.sku), staleTime: 30_000 });
    const reference = query.data;
    const differs = reference && [reference.name !== product.name, reference.unit && getSellUnit(reference.unit).code !== getSellUnit(product.unit).code, reference.size && reference.size !== product.size].some(Boolean);
    return <ControlSection title="Country catalog reference" description="The country product master identifies the SKU used in Procurement. Local records hold stock, lot, price and replenishment settings.">
        {query.isPending && <p className="text-sm">Loading catalog reference…</p>}{query.isError && <p className="text-sm">Catalog reference is unavailable for this session. <button onClick={() => query.refetch()} className="underline">Retry</button></p>}
        {query.isSuccess && !reference && <p className="text-sm">No visible country master reference was returned for this SKU.</p>}
        {reference && <><dl className="grid gap-4 sm:grid-cols-3"><ControlFact label="Master SKU / country" value={`${reference.sku} · ${reference.country_code}`} /><ControlFact label="Master name" value={reference.name} /><ControlFact label="Master approval" value={reference.status} /><ControlFact label="Master unit" value={reference.unit ? getSellUnit(reference.unit).label : 'Not recorded'} /><ControlFact label="Master size" value={reference.size || 'Not recorded'} /><ControlFact label="Master pack quantity" value={reference.pack_quantity ?? 'Not recorded'} /></dl>{differs && <p className="rounded-xl border border-[var(--theme-border)] p-3 text-sm">Some identity or selling-unit values differ from the country master. Review the recorded master and local specification before proposing changes. A location proposal does not synchronize the master.</p>}</>}
    </ControlSection>;
}
