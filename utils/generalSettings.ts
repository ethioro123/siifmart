import type {SystemConfig} from '../types';
import {Country,getCountryBrandingDefaults,getCountryLegalDefaults,getCountryProfile,sanitizeLanguageForCountry} from './localization';
export function resolveCountryGeneralSettings(settings:Partial<SystemConfig>|null|undefined,country:Country){
 const partition=settings?.countryConfigs?.[country]||{};
 const same=settings?.country===country?settings:{};
 const brand=getCountryBrandingDefaults(country);const legal=getCountryLegalDefaults(country);const profile=getCountryProfile(country);
 return {
  slogan:partition.slogan??same?.slogan??brand.slogan??'',
  legalBusinessName:partition.legalBusinessName??same?.legalBusinessName??legal.legalBusinessName,
  taxVatNumber:partition.taxVatNumber??same?.taxVatNumber??legal.taxVatNumber,
  posReceiptTaxId:partition.posReceiptTaxId??same?.posReceiptTaxId??legal.taxId,
  registeredAddress:partition.registeredAddress??same?.registeredAddress??legal.registeredAddress,
  supportContact:partition.supportContact??same?.supportContact??legal.supportContact,
  supportPhone:partition.supportPhone??same?.supportPhone??legal.supportPhone,
  currency:partition.currency??same?.currency??profile.currency,
  timezone:partition.timezone??same?.timezone??profile.timezone,
  dateFormat:partition.dateFormat??same?.dateFormat??profile.dateFormat,
  language:sanitizeLanguageForCountry(partition.language??same?.language,country)
 };
}

export function mergeConfirmedGeneralSettings(current:SystemConfig,confirmed:SystemConfig,country:Country,keys:ReadonlyArray<keyof SystemConfig>):SystemConfig{
 const saved=confirmed.countryConfigs?.[country]||{};
 const patch=Object.fromEntries(keys.filter(key=>Object.prototype.hasOwnProperty.call(saved,key)).map(key=>[key,saved[key]]));
 return {...current,countryConfigs:{...current.countryConfigs,[country]:{...current.countryConfigs?.[country],...patch}}};
}
