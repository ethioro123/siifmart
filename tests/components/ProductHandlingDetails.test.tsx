// @vitest-environment jsdom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {ProductHandlingDetails} from '../../components/inventory/components/ProductHandlingDetails';
import type {Product} from '../../types';
vi.mock('../../utils/groceryAttributes',()=>({resolveSmartProductAttributes:()=>({archetypeTitle:'Baby care',modelOrOrigin:'Model A',grossWeight:'500 g',dimensions:'10 × 20 cm',sellByMode:'Unit',packagingLevelLabel:'Case',packageType:'Carton',packagingMaterial:'Paper',unitsPerPackage:12,storageType:'Ambient',inboundQcDirective:'Check seals',domainSpecs:[{label:'Size',value:'Small'},{label:'Age',value:'Infant'},{label:'Absorbency',value:'Overnight'}],isFragile:true,requiresBatch:true})}));
afterEach(cleanup);
it('shows handling fields and every category specification beyond the former two-item preview',()=>{
 render(<ProductHandlingDetails product={{id:'product'} as Product} currencySymbol="ETB"/>);
 expect(screen.getByText('Check seals')).toBeTruthy();expect(screen.getByText('Overnight')).toBeTruthy();expect(screen.getByText(/Batch tracking required/)).toBeTruthy();expect(screen.getByText('500 g')).toBeTruthy();expect(screen.queryByText(/Cost Price/)).toBeNull();
});
