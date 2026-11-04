import { beforeEach,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({from:vi.fn(),select:vi.fn(),eq:vi.fn(),order:vi.fn(),range:vi.fn()}));
vi.mock('../../lib/supabase',()=>({supabase:{from:mock.from}}));
import { inventoryLocationsService } from '../../services/inventory-locations.service';
const site='c1111111-1111-4000-8000-000000000110';
beforeEach(()=>{vi.resetAllMocks();for(const method of [mock.from,mock.select,mock.eq,mock.order])method.mockReturnValue(mock);mock.range.mockResolvedValue({data:[],count:0,error:null});});
it('loads one scoped page of the selected product, preserving lots',async()=>{
 await inventoryLocationsService.load(site,'ET','ET-DI001',1);
 expect(mock.from).toHaveBeenCalledWith('inventory_stock_locations');
 expect(mock.eq).toHaveBeenCalledWith('site_id',site);expect(mock.eq).toHaveBeenCalledWith('country_code','ET');
 expect(mock.eq).toHaveBeenCalledWith('inventory_key','ETDI001');expect(mock.range).toHaveBeenCalledWith(25,49);
});
it('rejects invalid scope and propagates failures instead of showing empty stock',async()=>{
 await expect(inventoryLocationsService.load('', 'ET','ETDI001',0)).rejects.toThrow();expect(mock.from).not.toHaveBeenCalled();
 mock.range.mockResolvedValue({data:null,error:new Error('denied')});
 await expect(inventoryLocationsService.load(site,'ET','ETDI001',0)).rejects.toThrow('denied');
});
