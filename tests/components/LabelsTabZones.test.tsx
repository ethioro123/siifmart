// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LabelsTab } from '../../components/fulfillment/LabelsTab';
const state=vi.hoisted(()=>({value:{} as Record<string,unknown>}));
vi.mock('../../components/fulfillment/FulfillmentContext',()=>({useFulfillment:()=>state.value}));
vi.mock('../../utils/labels/ProductLabelGenerator',()=>({generateUnifiedBatchLabelsHTML:vi.fn()}));
vi.mock('../../utils/labels/LocationLabelGenerator',()=>({generateLocationLabelHTML:vi.fn()}));
vi.mock('../../components/fulfillment/assign/BarcodeLabelPreviewCard',()=>({BarcodeLabelPreviewCard:()=>null}));
vi.mock('../../components/fulfillment/assign/BarcodeLabelPreviewModal',()=>({BarcodeLabelPreviewModal:()=>null}));
vi.mock('../../utils/printHelper',()=>({printHtmlContent:vi.fn()}));
afterEach(cleanup);
it('renders safely without zones and enables configured bays after zones load',()=>{
 state.value={filteredProducts:[],addNotification:vi.fn(),t:(s:string)=>s,user:null,activeSite:{id:'wh',code:'ET-ADD-DC-01',country:'ET'}};
 const {rerender}=render(<LabelsTab/>);
 fireEvent.click(screen.getAllByRole('button',{name:'Bays'})[0]);
 expect((screen.getByRole('button',{name:'GENERATE LOCATION LABEL'}) as HTMLButtonElement).disabled).toBe(true);
 state.value={...state.value,zones:[{id:'zone',name:'Zone B',siteId:'wh'}]};
 rerender(<LabelsTab/>);
 expect((screen.getByTitle('Zone') as HTMLSelectElement).value).toBe('B');
 expect((screen.getByRole('button',{name:'GENERATE LOCATION LABEL'}) as HTMLButtonElement).disabled).toBe(false);
});
it('shows the facility prompt while country switching has no active site',()=>{
 state.value={filteredProducts:[],activeSite:null};render(<LabelsTab/>);
 expect(screen.getByText('Select a facility to prepare labels.')).toBeTruthy();
});
