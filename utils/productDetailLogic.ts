import type {Product,Site} from '../types';
export function productLocationRows(product:Product,products:Product[],sites:Site[],country?:string){
 const productSite=product.siteId||product.site_id;
 const market=sites.find(s=>s.id===productSite)?.country||country;
 const unique=new Map<string,Product>();
 for(const row of [...products,product]){
  const siteId=row.siteId||row.site_id;
  const site=sites.find(s=>s.id===siteId);
  if(!siteId||(!site&&siteId!==productSite)||(market&&site?.country&&site.country!==market))continue;
  if(row.sku!==product.sku&&!(product.productId&&row.productId===product.productId))continue;
  unique.set(row.id,row);
 }
 return [...unique.values()].map(row=>{
  const siteId=row.siteId||row.site_id;const site=sites.find(s=>s.id===siteId);
  return {id:row.id,siteName:site?.name||'Current facility',location:row.location||'',stock:row.stock||0,price:row.price,minStock:row.minStock,
   isCurrentSite:siteId===productSite,batchNumber:row.batchNumber||null,expiryDate:row.expiryDate||null};
 }).sort((a,b)=>Number(b.isCurrentSite)-Number(a.isCurrentSite)||a.siteName.localeCompare(b.siteName)||a.location.localeCompare(b.location));
}
export function productSaleIssues(product:Product,now=new Date()):string[]{
 const issues:string[]=[];const approval=(product.approvalStatus||product.approval_status||'').toLowerCase();
 if(approval==='pending')issues.push('Awaiting catalog approval');else if(approval==='rejected')issues.push('Catalog approval rejected');else if(approval!=='approved')issues.push('Catalog approval not confirmed');
 if(!Number.isFinite(product.price)||product.price<=0)issues.push('Selling price not set');
 const status=(product.status||'').toLowerCase();
 if(['quarantined','damaged','expired','inactive'].includes(status))issues.push(`Stock status: ${status}`);
 if(product.expiryDate){const expiry=new Date(product.expiryDate+'T23:59:59');if(!Number.isNaN(expiry.getTime())&&expiry<now&&status!=='expired')issues.push('Product has expired');}
 return issues;
}
export function validateStockThresholds(min:number|undefined,max:number|undefined):void{
 if([min,max].some(v=>v!==undefined&&(!Number.isFinite(v)||v<0)))throw new Error('Stock limits must be finite, non-negative numbers.');
 if(min!==undefined&&max!==undefined&&max<min)throw new Error('Maximum stock must be at least minimum stock.');
}
