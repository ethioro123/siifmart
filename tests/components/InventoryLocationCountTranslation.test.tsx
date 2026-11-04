// @vitest-environment jsdom
import React from 'react';
import { cleanup,render,screen } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import { InventoryDesktopTable } from '../../components/inventory/components/InventoryDesktopTable';
import { LanguageProvider } from '../../contexts/LanguageContext';
import type { Product } from '../../types';
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{role:'warehouse_manager'}})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET',settings:{country:'ET'}})}));
vi.mock('../../components/Protected',()=>({Protected:({children}:{children:React.ReactNode})=><>{children}</>}));
afterEach(()=>{cleanup();localStorage.clear();});
it.each([['en','2 Locations'],['am','2 ቦታዎች'],['or','Iddoowwan Kuusaa 2']])('renders the desktop location count in %s without exposing a key',(language,label)=>{
 localStorage.setItem('siifmart_language',language);
 const product={id:'product',siteId:'warehouse',sku:'ETDI001',name:'Bullo Dishes',stock:240,price:0,unit:'UNIT',location:'A-01-01',inventorySummary:{stock:960,locationCount:2}} as Product;
 render(<LanguageProvider><InventoryDesktopTable products={[product]} selectedIds={new Set()} setSelectedIds={vi.fn()} sortConfig={null} handleSort={vi.fn()} sites={[]} activeSite={null} isReadOnly totalInventoryValue={1} getOtherLocationsForSku={()=>({count:0,details:[]})} toggleSelection={vi.fn()} handleOpenAdjust={vi.fn()} handleOpenEditProduct={vi.fn()} handleDeleteProduct={vi.fn()} setSelectedViewProduct={vi.fn()}/></LanguageProvider>);
 expect(screen.getByRole('button',{name:label})).toBeTruthy();
 expect(screen.queryByText('inventory.locationsCount')).toBeNull();
 expect(screen.queryByText('warehouse.locationsCount')).toBeNull();
});
