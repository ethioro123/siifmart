import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {generalSettingsService} from '../../services/general-settings.service';
import {resolveCountryGeneralSettings} from '../../utils/generalSettings';
vi.mock('../../lib/supabase',()=>({supabase:{rpc:vi.fn(),from:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
describe('country settings transactions',()=>{
 it('sends only visible localization fields and retains the full saved snapshot',async()=>{
  vi.mocked(supabase.rpc).mockResolvedValue({data:{saved:true,settings:{currency:'ETB',enable_wms:true,pos_block_negative_stock:true,country_configs:{ET:{language:'am',supportPhone:'kept'},KE:{slogan:'kept'}}}},error:null} as never);
  const result=await generalSettingsService.save('retry','ET','localization',{currency:'ETB',timezone:'UTC',dateFormat:'YYYY-MM-DD',language:'am',taxRate:99,supportPhone:'must not write'});
  expect(supabase.rpc).toHaveBeenCalledWith('save_general_settings_section',{p_request:'retry',p_country:'ET',p_section:'localization',p_changes:{currency:'ETB',timezone:'UTC',dateFormat:'YYYY-MM-DD',language:'am'}});
  expect(result.enableWMS).toBe(true);expect(result.posBlockNegativeStock).toBe(true);expect(result.countryConfigs?.KE?.slogan).toBe('kept');expect(supabase.from).not.toHaveBeenCalled();
 });
 it('saves an intentionally empty slogan without touching branding assets',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:{saved:true,settings:{country_configs:{ET:{slogan:''}}}},error:null} as never);const result=await generalSettingsService.save('retry','ET','branding',{slogan:''});expect(result.countryConfigs?.ET?.slogan).toBe('');expect(supabase.rpc).toHaveBeenCalledWith('save_general_settings_section',expect.objectContaining({p_changes:{slogan:''}}));});
 it('propagates failure and refuses an unconfirmed response',async()=>{vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:new Error('Audit write failed')} as never);await expect(generalSettingsService.save('retry','ET','branding',{slogan:'Test'})).rejects.toThrow('Audit write failed');vi.mocked(supabase.rpc).mockResolvedValue({data:null,error:null} as never);await expect(generalSettingsService.save('retry','ET','branding',{slogan:'Test'})).rejects.toThrow('not confirmed');});
 it('keeps blank country values and does not borrow another country legal identity',()=>{const values=resolveCountryGeneralSettings({country:'ET',slogan:'ET slogan',posReceiptTaxId:'ET-ID',countryConfigs:{ET:{slogan:''},KE:{}}},'ET');expect(values.slogan).toBe('');const ke=resolveCountryGeneralSettings({country:'ET',posReceiptTaxId:'ET-ID',supportPhone:'+25100000'},'KE');expect(ke.posReceiptTaxId).not.toBe('ET-ID');expect(ke.supportPhone).not.toBe('+25100000');});
});
