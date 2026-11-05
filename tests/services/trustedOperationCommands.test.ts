import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{rpc:mock.rpc,from:mock.from}}));
import {attachSafePOItems} from '../../services/purchase-order-items.service';
import {inventoryRequestsService} from '../../services/inventory-requests.service';
beforeEach(()=>vi.clearAllMocks());
it('loads opened PO items in bounded batches and preserves server blindness flags',async()=>{
 mock.rpc.mockImplementation(async(_name:string,args:{p_ids:string[]})=>({data:args.p_ids.map(id=>({id:'item-'+id,po_id:id,quantity:null,quantity_hidden:true,receipt_complete:false})),error:null}));
 const rows=Array.from({length:26},(_,index)=>({id:String(index),po_items:[] as unknown[]}));await attachSafePOItems(rows);
 expect(mock.rpc).toHaveBeenCalledTimes(2);expect(mock.rpc.mock.calls[0][1].p_ids).toHaveLength(25);expect(rows[0].po_items[0]).toEqual(expect.objectContaining({quantity:null,quantity_hidden:true}));
});
it('propagates denied PO details without a table fallback',async()=>{mock.rpc.mockResolvedValue({data:null,error:new Error('Denied')});await expect(attachSafePOItems([{id:'po'}])).rejects.toThrow('Denied');expect(mock.from).not.toHaveBeenCalled();});
it('does not announce an adjustment without the matching saved transaction',async()=>{mock.rpc.mockResolvedValue({data:{saved:true,requestId:'other'},error:null});await expect(inventoryRequestsService.applyStockRequest('request')).rejects.toThrow('not confirmed');expect(mock.from).not.toHaveBeenCalled();});
it('uses trusted catalog approval without a separate client product insert',async()=>{mock.rpc.mockResolvedValue({data:'11111111-1111-4111-8111-111111111111',error:null});expect(await inventoryRequestsService.applyCatalogRequest('request')).toBe('11111111-1111-4111-8111-111111111111');expect(mock.rpc).toHaveBeenCalledWith('apply_inventory_catalog_request',{p_request:'request'});expect(mock.from).not.toHaveBeenCalled();});
