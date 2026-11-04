// @vitest-environment jsdom
import React from 'react';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { afterEach,expect,it,vi } from 'vitest';
import type { Product } from '../../types';
const load=vi.hoisted(()=>vi.fn());
vi.mock('../../services/inventory-locations.service',()=>({inventoryLocationsService:{load}}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'manager'}})}));
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key})}));
import { InventoryProductLocations } from '../../components/inventory/components/InventoryProductLocations';
afterEach(()=>{cleanup();vi.resetAllMocks();});
it('loads live location and lot evidence only when expanded',async()=>{
 load.mockResolvedValue({rows:[{id:'lot',location:'A-01-02',stock:720,batch_number:'LOT-B',expiry_date:null}],count:1});
 const product={id:'p',siteId:'warehouse',sku:'ETDI001',stock:240,unit:'UNIT',status:'active'} as Product;
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 const view=render(<QueryClientProvider client={client}><InventoryProductLocations product={product} country="ET"/></QueryClientProvider>);
 expect(load).not.toHaveBeenCalled();
 const details=view.container.querySelector('details')!;details.open=true;fireEvent(details,new Event('toggle'));
 await waitFor(()=>expect(screen.getByText('A-01-02')).toBeTruthy());
 expect(load).toHaveBeenCalledWith('warehouse','ET','ETDI001',0,false);
 expect(screen.getByText(/LOT-B/)).toBeTruthy();
});
