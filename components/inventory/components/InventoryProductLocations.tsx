import React,{useState} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { inventoryLocationsService } from '../../../services/inventory-locations.service';
import { Product } from '../../../types';
import { formatStockDisplay } from '../../../utils/units';
export function InventoryProductLocations({product,country}:{product:Product;country:string}){
 const {t}=useLanguage();const [open,setOpen]=useState(false);
 return <details className="rounded-xl border border-[var(--theme-border)] p-4" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary className="min-h-[44px] cursor-pointer text-sm font-medium">{t('inventory.stockLocations')}</summary>
  {open&&<InventoryLocationRows product={product} country={country}/>}
 </details>;
}
export function InventoryLocationRows({product,country}:{product:Product;country:string}){
 const {t}=useLanguage();const {user}=useStore();const [page,setPage]=useState(0);
 const site=product.siteId||product.site_id||'';
 const query=useQuery({queryKey:['inventory-product-locations',country,site,user?.id,product.sku,product.status==='archived',page],
  enabled:!!user?.id&&!!site&&!!product.sku&&!!country,
  queryFn:()=>inventoryLocationsService.load(site,country,product.sku,page,product.status==='archived'),staleTime:0});
 return <div className="space-y-3 pt-3">
   {query.isFetching?<p role="status">{t('inventory.loadingLocations')}</p>:query.isError?<div role="alert">{t('inventory.locationsUnavailable')} <button type="button" className="min-h-[44px] px-3 underline" onClick={()=>void query.refetch()}>{t('inventory.refreshLocations')}</button></div>:<>
    {!query.data?.rows.length&&<p>{t('inventory.noLocations')}</p>}
    <ul className="divide-y divide-[var(--theme-border)]">{query.data?.rows.filter(row=>row.stock!==0).map(row=><li key={row.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
     <div className="min-w-0 break-words"><p className="font-medium">{row.location||t('inventory.locationUnassigned')}</p><p className="text-[var(--theme-text-secondary)]">{t('inventory.batchLabel')}: {row.batch_number||'—'} · {t('inventory.expiryLabel')}: {row.expiry_date||'—'}</p></div>
     <p className="tabular-nums">{formatStockDisplay(row.stock,product)}</p>
    </li>)}</ul>
    {query.data?.rows.some(row=>row.stock===0)&&<details className="border-t border-[var(--theme-border)] pt-2"><summary className="min-h-[44px] cursor-pointer text-sm text-[var(--theme-text-secondary)]">{t('inventory.emptyLocations')}</summary><ul className="divide-y divide-[var(--theme-border)]">{query.data.rows.filter(row=>row.stock===0).map(row=><li key={row.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
     <div className="min-w-0 break-words"><p className="font-medium">{row.location||t('inventory.locationUnassigned')}</p><p className="text-[var(--theme-text-secondary)]">{t('inventory.batchLabel')}: {row.batch_number||'—'} · {t('inventory.expiryLabel')}: {row.expiry_date||'—'}</p></div>
     <p className="tabular-nums">{formatStockDisplay(row.stock,product)}</p>
    </li>)}</ul></details>}
   </>}
   <nav className="flex items-center gap-3"><button type="button" className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-3 disabled:opacity-50" disabled={page===0||query.isFetching} onClick={()=>setPage(p=>p-1)}>{t('inventory.previousPage')}</button><span>{page+1}</span><button type="button" className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-3 disabled:opacity-50" disabled={query.isFetching||query.isError||!query.data||(page+1)*25>=query.data.count} onClick={()=>setPage(p=>p+1)}>{t('inventory.nextPage')}</button></nav>
 </div>;
}
