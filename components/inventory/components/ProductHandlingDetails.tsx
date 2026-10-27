import React from 'react';
import type {Product} from '../../../types';
import {resolveSmartProductAttributes} from '../../../utils/groceryAttributes';
interface Props {product:Product;currencySymbol:string}
export function ProductHandlingDetails({product,currencySymbol}:Props){
 const profile=resolveSmartProductAttributes(product,undefined,currencySymbol);
 const fields:[string,React.ReactNode][]=[
  ['Product type',profile.archetypeTitle],['Model / origin',profile.modelOrOrigin],['Gross weight',profile.grossWeight],
  ['Dimensions',profile.dimensions],['Colour / finish',profile.colorOrFinish||profile.color],['Scent',profile.scent],
  ['Sold by',profile.sellByMode],['Packaging level',profile.packagingLevelLabel],['Package type',profile.packageType],
  ['Packaging material',profile.packagingMaterial],['Units per package',profile.unitsPerPackage],
  ['Storage',profile.storageType],['Shelf life',profile.shelfLifeLabel],['Receiving quality check',profile.inboundQcDirective],
  ['Expiry status',profile.expiryStatus?.label],
  ...profile.domainSpecs.map(spec=>[spec.label,spec.value] as [string,React.ReactNode])
 ];
 const handling=[profile.isPerishable&&'Perishable',profile.isColdChain&&'Cold chain',profile.isDeepFreeze&&'Deep freeze',
  profile.isFragile&&'Fragile',profile.isHighValue&&'High value',profile.isHazardous&&'Hazardous',profile.isHalal&&'Halal',
  profile.requiresBatch&&'Batch tracking required',(profile.requiresSerial||profile.isSerialTracked)&&'Serial tracking required',profile.isWeightedScale&&'Scale weighing'].filter(Boolean);
 return <details className="border-b border-[var(--theme-border)] pb-4">
  <summary className="min-h-[44px] cursor-pointer py-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Packaging, handling and category details</summary>
  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 pt-3 sm:grid-cols-2">
   {fields.filter(([,value])=>value!==null&&value!==undefined&&value!=='').map(([label,value],index)=><div key={`${label}-${index}`} className="min-w-0"><dt className="text-sm text-[var(--theme-text-secondary)]">{label}</dt><dd className="mt-1 text-sm leading-relaxed break-words text-[var(--theme-text-primary)]">{value}</dd></div>)}
   {handling.length>0&&<div className="sm:col-span-2"><dt className="text-sm text-[var(--theme-text-secondary)]">Handling and tracking</dt><dd className="mt-1 text-sm leading-relaxed text-[var(--theme-text-primary)]">{handling.join(' · ')}</dd></div>}
  </dl>
 </details>;
}
