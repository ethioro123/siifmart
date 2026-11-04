import { z } from 'zod';
import { supabase } from '../lib/supabase';
const row=z.object({id:z.string().uuid(),location:z.string().nullable(),stock:z.coerce.number(),batch_number:z.string().nullable(),expiry_date:z.string().nullable()});
export const inventoryLocationsService={
 async load(site:string,country:string,sku:string,page:number,archived=false){
  z.string().uuid().parse(site);z.string().regex(/^[A-Z]{2}$/).parse(country);z.number().int().min(0).parse(page);
  const key=sku.replace(/[-\s]/g,'').toUpperCase();if(!key)throw new Error('SKU required');
  const {data,error,count}=await supabase.from('inventory_stock_locations').select('id,location,stock,batch_number,expiry_date',{count:'exact'})
   .eq('site_id',site).eq('country_code',country).eq('inventory_key',key).eq('is_archived',archived).order('stock',{ascending:false}).order('location').order('id').range(page*25,page*25+24);
  if(error)throw error;return {rows:z.array(row).max(25).parse(data),count:count||0};
 }
};
