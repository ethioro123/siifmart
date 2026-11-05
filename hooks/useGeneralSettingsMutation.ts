import {useRef} from 'react';
import {useMutation} from '@tanstack/react-query';
import {useStore} from '../contexts/CentralStore';
import {useData} from '../contexts/DataContext';
import {generalSettingsService,GeneralSettingsSection} from '../services/general-settings.service';
import type {Country} from '../utils/localization';
import type {SystemConfig} from '../types';
export type {GeneralSettingsSection};
export interface GeneralSettingsPayload{section:GeneralSettingsSection;targetCountry:Country;data:Partial<SystemConfig>}
export function useGeneralSettingsMutation(){
 const {user,showToast}=useStore();const {applyConfirmedSettings}=useData();
 const retry=useRef<{signature:string;id:string}|null>(null);
 return useMutation({mutationFn:async({section,targetCountry,data}:GeneralSettingsPayload)=>{
  if(user?.role!=='group_ceo')throw new Error('Only the Group Chief Executive Officer can change these settings.');
  const signature=JSON.stringify([user.id,section,targetCountry,data]);
  if(retry.current?.signature!==signature)retry.current={signature,id:crypto.randomUUID()};
  const confirmed=await generalSettingsService.save(retry.current.id,targetCountry,section,data);
  applyConfirmedSettings(confirmed);retry.current=null;
 },onError:(error)=>showToast(error.message||'Settings save was not confirmed.','error')});
}
