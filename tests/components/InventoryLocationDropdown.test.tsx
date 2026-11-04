// @vitest-environment jsdom
import React from 'react';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { afterEach,expect,it,vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { InventoryDesktopTable } from '../../components/inventory/components/InventoryDesktopTable';
import type { Product } from '../../types';
const load=vi.hoisted(()=>vi.fn());
vi.mock('../../services/inventory-locations.service',()=>({inventoryLocationsService:{load}}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'manager',role:'warehouse_manager'}})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET',settings:{country:'ET'}})}));
vi.mock('../../components/Protected',()=>({Protected:({children}:{children:React.ReactNode})=><>{children}</>}));
afterEach(()=>{cleanup();vi.resetAllMocks();localStorage.clear();});
const product={id:'product',siteId:'warehouse',sku:'ETDI001',name:'Bullo Dishes',stock:240,price:0,unit:'UNIT',location:'A-01-01',inventorySummary:{stock:960,locationCount:2}} as Product;
function setup(){
 const view=vi.fn();const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><LanguageProvider><InventoryDesktopTable products={[product]} selectedIds={new Set()} setSelectedIds={vi.fn()} sortConfig={null} handleSort={vi.fn()} sites={[]} activeSite={null} isReadOnly totalInventoryValue={1} getOtherLocationsForSku={()=>({count:0,details:[]})} toggleSelection={vi.fn()} handleOpenAdjust={vi.fn()} handleOpenEditProduct={vi.fn()} handleDeleteProduct={vi.fn()} setSelectedViewProduct={view}/></LanguageProvider></QueryClientProvider>);
 return {view};
}
it('opens the location dropdown on demand without opening the product modal; Escape returns focus',async()=>{
 load.mockResolvedValue({rows:[{id:'a',location:'A-01-01',stock:240,batch_number:'LOT-A',expiry_date:null},{id:'b',location:'A-01-02',stock:720,batch_number:'LOT-B',expiry_date:null},{id:'c',location:'D-01-01',stock:0,batch_number:'LOT-A',expiry_date:null}],count:3});
 const {view}=setup();expect(load).not.toHaveBeenCalled();
 const trigger=screen.getByRole('button',{name:'2 Locations'});fireEvent.click(trigger);
 await screen.findByText('A-01-02');expect(screen.getByRole('dialog',{name:'Stock by location and batch'})).toBeTruthy();
 expect(load).toHaveBeenCalledWith('warehouse','ET','ETDI001',0,false);expect(view).not.toHaveBeenCalled();
 expect(screen.getByText('Empty locations').closest('details')?.open).toBe(false);
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(trigger);
});
it('pages through locations inside the dropdown and closes on outside interaction',async()=>{
 load.mockImplementation((_site:string,_country:string,_sku:string,page:number)=>Promise.resolve({rows:[{id:'a',location:page?'B-01-01':'A-01-01',stock:1,batch_number:null,expiry_date:null}],count:30}));
 const {view}=setup();fireEvent.click(screen.getByRole('button',{name:'2 Locations'}));await screen.findByText('A-01-01');
 fireEvent.click(screen.getByRole('button',{name:'Next'}));await screen.findByText('B-01-01');expect(view).not.toHaveBeenCalled();
 fireEvent.pointerDown(document.body);await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
});
it('shows a failed location read with a retry action',async()=>{
 load.mockRejectedValue(new Error('unavailable'));setup();fireEvent.click(screen.getByRole('button',{name:'2 Locations'}));
 expect(await screen.findByRole('alert')).toBeTruthy();expect(screen.getByRole('button',{name:'Refresh'})).toBeTruthy();
});
