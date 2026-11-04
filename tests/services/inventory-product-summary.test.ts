import { beforeEach,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({from:vi.fn(),select:vi.fn(),eq:vi.fn(),order:vi.fn(),neq:vi.fn(),range:vi.fn(),or:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{from:state.from},isSupabaseConfigured:()=>true}));
import { productsService } from '../../services/products.service';
const result={data:[{id:'physical-record',site_id:'facility',sku:'ETDI001',stock:960,location_stock:240,location_count:2,price:10,status:'active'}],count:1,error:null};
beforeEach(()=>{vi.resetAllMocks();const query={...state,then:(resolve:(value:typeof result)=>unknown)=>Promise.resolve(result).then(resolve)};for(const fn of Object.values(state))fn.mockReturnValue(query);});
it('queries grouped products before pagination and keeps physical stock separate from totals',async()=>{
 const {data,count}=await productsService.getInventory('facility','ET',25,25,{search:'A-01-02'});
 expect(state.from).toHaveBeenCalledWith('inventory_product_summary');
 expect(state.eq).toHaveBeenCalledWith('country_code','ET');expect(state.neq).toHaveBeenCalledWith('status','archived');expect(state.range).toHaveBeenCalledWith(25,49);
 expect(state.or).toHaveBeenCalledWith(expect.stringContaining('location_search.ilike.%A-01-02%'));
 expect(data[0].stock).toBe(240);expect(data[0].inventorySummary).toEqual({stock:960,locationCount:2});expect(count).toBe(1);
});
it('rejects a missing country without issuing a query',async()=>{
 await expect(productsService.getInventory('facility','')).rejects.toThrow('country');expect(state.from).not.toHaveBeenCalled();
});

it('bounds grouped pages and rejects an unbounded request',async()=>{
 await expect(productsService.getInventory('facility','ET',0)).rejects.toThrow('Bounded');
 expect(state.from).not.toHaveBeenCalled();
});
