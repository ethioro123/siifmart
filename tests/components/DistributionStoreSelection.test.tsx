// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoreAllocationEditor } from '../../components/fulfillment/transfer/components/StoreAllocationEditor';
import type { StoreAllocation } from '../../utils/distributionStores';
import type { Site } from '../../types';
afterEach(cleanup);
const stores=[{id:'a',name:'Addis Store',code:'ET-A'},{id:'b',name:'Bole Store',code:'ET-B'}] as Site[];
function Fixture(){
 const [allocations,setAllocations]=useState<StoreAllocation[]>([]);
 return <><StoreAllocationEditor stores={stores} allocations={allocations} onChange={setAllocations}/><output>{JSON.stringify(allocations)}</output></>;
}
describe('receiving store choice',()=>{
 it('starts with no destinations, enables quantity only after selection, and discards a deselected quantity',()=>{
  render(<Fixture/>);
  expect(screen.queryByRole('spinbutton')).toBeNull();
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Addis Store'}));
  const quantity=screen.getByRole('spinbutton',{name:/for Addis Store/});
  fireEvent.change(quantity,{target:{value:'20'}});
  expect(screen.getByRole('status').textContent).toContain('20');
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Addis Store'}));
  expect(screen.getByRole('status').textContent).toBe('[]');
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Addis Store'}));
  expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('0');
 });
 it('selects only search results, preserves hidden selections, and clears all explicitly',()=>{
  render(<Fixture/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Supply Addis Store'}));
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Bole'}});
  fireEvent.click(screen.getByRole('button',{name:'Select shown stores'}));
  expect(screen.getByRole('status').textContent).toContain('"a"');
  expect(screen.getByRole('status').textContent).toContain('"b"');
  fireEvent.click(screen.getByRole('button',{name:'Clear selection'}));
  expect(screen.getByRole('status').textContent).toBe('[]');
 });
});
