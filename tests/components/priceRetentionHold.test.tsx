// @vitest-environment jsdom
import React from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const mock=vi.hoisted(()=>({status:{data:{canManage:true,hold:null as null|{id:string;reason:string;placed_at:string}},isError:false,isFetching:false,refetch:vi.fn()},manage:{mutateAsync:vi.fn(),isPending:false}}));
vi.mock('../../hooks/usePriceRetentionHold',()=>({usePriceRetentionHold:()=>mock}));
import {PriceRetentionHold} from '../../components/products/PriceRetentionHold';
beforeEach(()=>{mock.status.data={canManage:true,hold:null};mock.status.isError=false;mock.manage.mutateAsync.mockReset();mock.manage.mutateAsync.mockResolvedValue(undefined);});afterEach(cleanup);
describe('product audit/dispute holds',()=>{
 it('requires a reason and confirms only after the hold saves',async()=>{
  render(<PriceRetentionHold productId="p" country="ET"/>);expect((screen.getByRole('button',{name:'Place hold'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Open supplier dispute'}});fireEvent.click(screen.getByRole('button',{name:'Place hold'}));
  await waitFor(()=>expect(mock.manage.mutateAsync).toHaveBeenCalledWith({reason:'Open supplier dispute',release:false}));expect(await screen.findByRole('status')).toHaveProperty('textContent',expect.stringContaining('hold saved'));
 });
 it('requires a separate reason to release an active hold',async()=>{
  mock.status.data.hold={id:'hold',reason:'Investigation pending',placed_at:'2026-10-28T00:00:00Z'};render(<PriceRetentionHold productId="p" country="ET"/>);
  expect(screen.getByText(/Investigation pending/)).toBeTruthy();fireEvent.change(screen.getByRole('textbox'),{target:{value:'Investigation completed'}});fireEvent.click(screen.getByRole('button',{name:'Release hold'}));
  await waitFor(()=>expect(mock.manage.mutateAsync).toHaveBeenCalledWith({reason:'Investigation completed',release:true}));
 });
 it('does not offer hold controls to unauthorized roles',()=>{
  mock.status.data.canManage=false;render(<PriceRetentionHold productId="p" country="ET"/>);expect(screen.queryByRole('textbox')).toBeNull();
 });
 it('does not claim no hold when the status query fails',()=>{
  mock.status.isError=true;render(<PriceRetentionHold productId="p" country="ET"/>);expect(screen.getByRole('alert').textContent).toContain('could not be checked');expect(screen.queryByText(/No active hold/)).toBeNull();
 });
});
