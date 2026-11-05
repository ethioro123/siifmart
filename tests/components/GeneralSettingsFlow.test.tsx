// @vitest-environment jsdom
import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import GeneralSettings from '../../components/settings/GeneralSettings';
import type {SystemConfig} from '../../types';
const state=vi.hoisted(()=>({settings:{country:'ET',countryConfigs:{ET:{slogan:'Saved slogan',legalBusinessName:'Saved legal name'}}} as Partial<SystemConfig>,country:'ET',save:vi.fn(),language:vi.fn(),toast:vi.fn()}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({settings:state.settings,effectiveCountry:state.country})}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'ceo',role:'group_ceo'},showToast:state.toast})}));
vi.mock('../../hooks/useGeneralSettingsMutation',()=>({useGeneralSettingsMutation:()=>({mutateAsync:state.save,isPending:false})}));
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key,setLanguage:state.language})}));
afterEach(cleanup);
beforeEach(()=>{state.settings={country:'ET',countryConfigs:{ET:{slogan:'Saved slogan',legalBusinessName:'Saved legal name'}}};state.country='ET';state.save.mockReset().mockImplementation(async({targetCountry,data})=>({...state.settings,countryConfigs:{...state.settings.countryConfigs,[targetCountry]:{...state.settings.countryConfigs?.[targetCountry as 'ET'],...data}}}));state.toast.mockReset();state.language.mockReset();});
describe('General & Slogan save flow',()=>{
 it('preserves both section drafts during a refresh and while saving another section',async()=>{
  const view=render(<GeneralSettings/>);
  fireEvent.change(screen.getByLabelText('Store Slogan / Value Proposition'),{target:{value:'Draft slogan'}});
  fireEvent.change(screen.getByLabelText('Legal Business Name'),{target:{value:'Draft legal name'}});
  state.settings={country:'ET',countryConfigs:{ET:{slogan:'Remote slogan',legalBusinessName:'Remote legal name'}}};view.rerender(<GeneralSettings/>);
  expect((screen.getByLabelText('Store Slogan / Value Proposition') as HTMLInputElement).value).toBe('Draft slogan');
  fireEvent.click(screen.getByRole('button',{name:'Save Slogan'}));await waitFor(()=>expect(state.save).toHaveBeenCalled());
  expect(state.save.mock.calls[0][0]).toEqual({section:'branding',targetCountry:'ET',data:{slogan:'Draft slogan',country:'ET'}});
  expect((screen.getByLabelText('Legal Business Name') as HTMLInputElement).value).toBe('Draft legal name');
 });
 it('retains a cleared slogan after confirmation and refresh',async()=>{
  const view=render(<GeneralSettings/>);fireEvent.change(screen.getByLabelText('Store Slogan / Value Proposition'),{target:{value:''}});fireEvent.click(screen.getByRole('button',{name:'Save Slogan'}));await waitFor(()=>expect(state.toast).toHaveBeenCalled());
  state.settings={country:'ET',countryConfigs:{ET:{slogan:''}}};view.rerender(<GeneralSettings/>);expect((screen.getByLabelText('Store Slogan / Value Proposition') as HTMLInputElement).value).toBe('');
 });
 it('localization submits only visible values and updates language after confirmation',async()=>{
  render(<GeneralSettings/>);fireEvent.click(screen.getByRole('button',{name:'warehouse.datePreferences.ymd'}));fireEvent.click(screen.getByRole('button',{name:'Apply & Save Localization'}));
  await waitFor(()=>expect(state.language).toHaveBeenCalled());const payload=state.save.mock.calls[0][0].data;
  expect(Object.keys(payload).sort()).toEqual(['country','currency','dateFormat','language','timezone']);expect(payload.dateFormat).toBe('YYYY-MM-DD');
 });
 it('keeps edits and avoids success when persistence fails',async()=>{
  state.save.mockRejectedValue(new Error('Server rejected save'));render(<GeneralSettings/>);fireEvent.change(screen.getByLabelText('Store Slogan / Value Proposition'),{target:{value:'Keep draft'}});fireEvent.click(screen.getByRole('button',{name:'Save Slogan'}));
  await waitFor(()=>expect(state.save).toHaveBeenCalled());expect((screen.getByLabelText('Store Slogan / Value Proposition') as HTMLInputElement).value).toBe('Keep draft');expect(state.toast).not.toHaveBeenCalled();
 });
});
