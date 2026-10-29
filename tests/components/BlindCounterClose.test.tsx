// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlindCounterClose } from '../../components/pos/BlindCounterClose';
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key,currencySymbol:'ETB'})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:'ET'})}));
vi.mock('../../components/Modal',()=>({default:({children,isOpen}:{children:React.ReactNode;isOpen:boolean})=>isOpen?<div>{children}</div>:null}));
afterEach(cleanup);
describe('Immutable blind count entry',()=>{
 it('never reveals expected cash or offers a PIN bypass, and requires acknowledgement',()=>{
  const submit=vi.fn();
  render(<BlindCounterClose isOpen pending={false} onClose={vi.fn()} onSubmit={submit} denominations={{100:2}} setDenominations={vi.fn()} notes="" setNotes={vi.fn()} />);
  expect(screen.queryByText(/expected cash/i)).toBeNull();expect(screen.queryByText(/PIN/)).toBeNull();
  const button=screen.getByRole('button',{name:'pos.counterSubmit'}) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(button.disabled).toBe(false);fireEvent.click(button);expect(submit).toHaveBeenCalledTimes(1);
 });
 it('blocks repeat submission while saving',()=>{
  render(<BlindCounterClose isOpen pending onClose={vi.fn()} onSubmit={vi.fn()} denominations={{}} setDenominations={vi.fn()} notes="" setNotes={vi.fn()} />);
  expect((screen.getByRole('button',{name:'pos.counterSaving'}) as HTMLButtonElement).disabled).toBe(true);
 });
});
