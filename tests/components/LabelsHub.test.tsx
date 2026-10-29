// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssignLabelHub } from '../../components/fulfillment/assign/AssignLabelHub';
import type { Product, Site } from '../../types';
vi.mock('../../utils/labels/ProductLabelGenerator',()=>({generateUnifiedBatchLabelsHTML:vi.fn()}));
vi.mock('../../utils/labels/LocationLabelGenerator',()=>({generateLocationLabelHTML:vi.fn()}));
vi.mock('../../components/fulfillment/assign/BarcodeLabelPreviewCard',()=>({BarcodeLabelPreviewCard:()=>null}));
vi.mock('../../components/fulfillment/assign/BarcodeLabelPreviewModal',()=>({BarcodeLabelPreviewModal:()=>null}));
vi.mock('../../utils/printHelper',()=>({printHtmlContent:vi.fn()}));
afterEach(cleanup);
const products=[{id:'a',sku:'ET001',name:'Milk Small',siteId:'wh'},{id:'b',sku:'ET002',name:'Milk Large',siteId:'wh'},{id:'c',sku:'KE001',name:'Rice',siteId:'other'}] as Product[];
const setup=()=>render(<AssignLabelHub filteredProducts={products} addNotification={vi.fn()} t={s=>s} zones={[]} onZoneUpdate={vi.fn()} user={null} activeSite={{id:'wh',code:'ET-ADD-DC-01',country:'ET'} as Site}/>);
describe('labels hub controls',()=>{
 it('blocks ambiguous and foreign labels but accepts exact local identifiers',()=>{
  setup();const input=screen.getByTitle('Product SKU');const print=screen.getByRole('button',{name:/PRINT PRODUCT BARCODE/i}) as HTMLButtonElement;
  fireEvent.change(input,{target:{value:'Milk'}});expect(print.disabled).toBe(true);
  fireEvent.change(input,{target:{value:'KE001'}});expect(print.disabled).toBe(true);
  fireEvent.change(input,{target:{value:' ET001 '}});expect(print.disabled).toBe(false);
 });
 it('does not offer printable fabricated default zones',()=>{
  setup();fireEvent.click(screen.getAllByRole('button',{name:'Bays'})[0]);
  expect((screen.getByRole('button',{name:'GENERATE LOCATION LABEL'}) as HTMLButtonElement).disabled).toBe(true);
 });
});
