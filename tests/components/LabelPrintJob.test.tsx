// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLabelPrintJob } from '../../hooks/useLabelPrintJob';
import { printHtmlContent } from '../../utils/printHelper';
vi.mock('../../utils/printHelper',()=>({printHtmlContent:vi.fn()}));
afterEach(cleanup);beforeEach(()=>vi.clearAllMocks());
describe('label print handoff',()=>{
 it('reports blocked print handoff without claiming physical output',async()=>{
  vi.mocked(printHtmlContent).mockResolvedValue({success:false,error:'Popup blocked'});const notify=vi.fn();
  const {result}=renderHook(()=>useLabelPrintJob(notify));await act(async()=>{await result.current.print(async()=>'<html/>');});
  expect(notify).toHaveBeenCalledWith('alert','Popup blocked');expect(notify).not.toHaveBeenCalledWith('success',expect.anything());
 });
 it('blocks duplicate submissions while generating and reports only print dialog handoff',async()=>{
  vi.mocked(printHtmlContent).mockResolvedValue({success:true});const notify=vi.fn();let finish:(s:string)=>void=()=>{};
  const generate=vi.fn(()=>new Promise<string>(resolve=>{finish=resolve;}));const {result}=renderHook(()=>useLabelPrintJob(notify));
  await act(async()=>{const pending=result.current.print(generate);await result.current.print(generate);expect(generate).toHaveBeenCalledTimes(1);finish('<html/>');await pending;});
  expect(printHtmlContent).toHaveBeenCalledTimes(1);expect(notify).toHaveBeenCalledWith('info',expect.stringContaining('print dialog'));
 });
 it('shows generation failures and unlocks retries',async()=>{
  const notify=vi.fn();const {result}=renderHook(()=>useLabelPrintJob(notify));
  await act(async()=>{await result.current.print(async()=>{throw new Error('Invalid bay');});});
  expect(notify).toHaveBeenCalledWith('alert','Invalid bay');expect(result.current.isPrinting).toBe(false);
 });
});
