import {supabase} from '../lib/supabase';
import {systemConfigService} from './config.service';
import type {Country} from '../utils/localization';
import type {SystemConfig} from '../types';
import {BrandingSettingsSchema,LegalSettingsSchema,LocalizationSettingsSchema} from '../schemas/general-settings.schema';
export type GeneralSettingsSection='branding'|'legal'|'localization';
const fields:Record<GeneralSettingsSection,string[]>={branding:['slogan'],legal:['legalBusinessName','taxVatNumber','posReceiptTaxId','registeredAddress','supportContact','supportPhone'],localization:['currency','timezone','dateFormat','language']};
export const generalSettingsService={
 async save(request:string,country:Country,section:GeneralSettingsSection,data:Partial<SystemConfig>):Promise<SystemConfig>{
  const schema=section==='branding'?BrandingSettingsSchema:section==='legal'?LegalSettingsSchema:LocalizationSettingsSchema;
  const parsed=schema.parse({...data,country});
  const patch=Object.fromEntries(Object.entries(parsed).filter(([key])=>fields[section].includes(key)));
  const {data:result,error}=await supabase.rpc('save_general_settings_section',{p_request:request,p_country:country,p_section:section,p_changes:patch});
  if(error)throw error;
  if(!result?.saved||!result.settings||typeof result.settings!=='object')throw new Error('Settings save was not confirmed.');
  return systemConfigService._mapSettings(result.settings);
 }
};
