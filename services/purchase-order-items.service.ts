import { z } from 'zod';
import { supabase } from '../lib/supabase';
const item = z.object({ id:z.string(),po_id:z.string() }).passthrough();
export async function attachSafePOItems(rows:unknown[]):Promise<void> {
 for(let offset=0;offset<rows.length;offset+=25) {
  const page=rows.slice(offset,offset+25);
  const {data,error}=await supabase.rpc('purchase_order_items_safe',{p_ids:page.map(row=>z.object({id:z.string()}).parse(row).id)});
  if(error)throw error;
  const items=z.array(item).parse(data);
  for(const row of page) { const id=z.object({id:z.string()}).parse(row).id; Object.assign(row as object,{po_items:items.filter(line=>line.po_id===id)}); }
 }
}
