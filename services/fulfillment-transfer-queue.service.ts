import {supabase} from '../lib/supabase';
import {blindReceivingService,QueueCursor,TRANSFER_COLUMNS} from './blind-receiving.service';
import {mapTransferRow} from './transfers.service';
export interface TransferQueueCursor{active?:QueueCursor;blind?:QueueCursor}
export async function getFulfillmentTransferPage(site:string,country:string,cursor:TransferQueueCursor={}){
 if(!site||!country)throw new Error('Facility and country required');
 let query=supabase.from('transfers').select(TRANSFER_COLUMNS).eq('country_code',country).not('status','in','("Received","Completed","Cancelled","Rejected")').order('created_at').order('id').limit(25);
 const after=cursor.active?`or(created_at.gt.${cursor.active.createdAt},and(created_at.eq.${cursor.active.createdAt},id.gt.${cursor.active.id}))`:undefined;
 query=query.or([`source_site_id.eq.${site}`,`dest_site_id.eq.${site}`].map(scope=>after?`and(${scope},${after})`:scope).join(','));
 const [active,blind]=await Promise.all([query,blindReceivingService.transfers(site,country,cursor.blind)]);if(active.error)throw active.error;
 const lastActive=active.data?.at(-1);const lastBlind=blind.at(-1);
 return {transfers:[...new Map([...(active.data||[]),...blind].map(t=>[t.id,t])).values()].map(mapTransferRow),hasMore:active.data?.length===25||blind.length===25,cursor:{active:lastActive?{id:lastActive.id,createdAt:lastActive.created_at}:cursor.active,blind:lastBlind?{id:lastBlind.id,createdAt:lastBlind.created_at}:cursor.blind}};
}
