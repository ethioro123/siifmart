import type { Product } from '../types';
export const MAX_LABEL_COPIES=1000;
export const validLabelCopies=(quantity:number)=>Number.isInteger(quantity)&&quantity>=1&&quantity<=MAX_LABEL_COPIES;
/** Prefer identifiers; a name fragment must identify one SKU at this facility. */
export function findLabelProduct(products:Product[],query:string,siteId?:string):Product|null {
    const code=query.trim().toUpperCase();if(!code||!siteId)return null;
    const scoped=products.filter(product=>(product.siteId||product.site_id)===siteId);
    const exact=scoped.find(product=>[product.id,product.sku,product.barcode,...(Array.isArray(product.barcodes)?product.barcodes:[])].some(value=>value?.trim().toUpperCase()===code));
    if(exact)return exact;
    const names=scoped.filter(product=>product.name?.toUpperCase().includes(code));
    return new Set(names.map(product=>product.sku)).size===1?names[0]||null:null;
}
