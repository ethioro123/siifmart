import {formatLocationIdentity} from '../../../utils/locationIdentity';
import React from 'react';
import {Package} from 'lucide-react';
import type {Product} from '../../../types';
import {CURRENCY_SYMBOL} from '../../../constants';
import {formatPriceValue} from '../../../utils/formatting';
import {formatStockDisplay,getSellUnit} from '../../../utils/units';
import {formatProductDisplayName} from '../../procurement/utils';
interface Props {product:Product;showCostPrice:boolean;currencySymbol?:string}
export function ProductProfileHeader({product,currencySymbol=CURRENCY_SYMBOL}:Props){
 const stock=product.stock||0;
 const status=stock<=0?'Out of stock':product.minStock&&stock<=product.minStock?'Low stock':'In stock';
 const approval=(product.approvalStatus||product.approval_status||'approved').toLowerCase();
 const readiness=approval==='pending'?'Awaiting catalog approval':approval==='rejected'?'Catalog approval rejected':!(product.price>0)?'Selling price not set':null;
 return <section aria-label="Product overview" className="space-y-6 py-2 text-[var(--theme-text-primary)]">
  <div className="flex items-start gap-4">
   <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--theme-bg-subtle)]">
    {product.image&&!product.image.includes('placeholder.com')?<img src={product.image} alt="" className="h-full w-full object-cover"/>:<Package size={26} className="text-[var(--theme-text-muted)]"/>}
   </div>
   <div className="min-w-0 flex-1">
    <p className="text-sm text-[var(--theme-text-secondary)]">{product.category}</p>
    <h2 className="mt-1 text-2xl font-semibold leading-snug tracking-tight break-words">{formatProductDisplayName(product)||product.name}</h2>
    <p className="mt-2 text-sm text-[var(--theme-text-secondary)]"><span className="font-mono">{product.sku}</span><span className="mx-2" aria-hidden="true">·</span>{status}</p>
   </div>
  </div>
  <dl className="grid grid-cols-2 gap-6 border-y border-[var(--theme-border)] py-5">
   <div><dt className="text-sm text-[var(--theme-text-secondary)]">Selling price</dt><dd className="mt-1 text-2xl font-medium tabular-nums">{product.price>0?`${currencySymbol} ${formatPriceValue(product.price)}`:'Not set'}</dd><p className="mt-1 text-sm text-[var(--theme-text-secondary)]">per {getSellUnit(product.unit).shortLabel||'unit'}</p></div>
   <div><dt className="text-sm text-[var(--theme-text-secondary)]">Available stock</dt><dd className="mt-1 text-2xl font-medium tabular-nums">{formatStockDisplay(stock,product)}</dd><p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{formatLocationIdentity(product.location)}</p></div>
  </dl>
  {readiness&&<p className="rounded-lg bg-[var(--theme-bg-subtle)] px-4 py-3 text-sm">{readiness}{!(product.price>0)&&approval==='pending'?' · Selling price not set':''}</p>}
 </section>;
}
