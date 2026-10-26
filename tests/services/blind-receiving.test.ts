import {beforeEach,describe,expect,it,vi} from 'vitest';
import {supabase} from '../../lib/supabase';
import {blindReceivingService} from '../../services/blind-receiving.service';
import {verifyPOSTransferReceipt} from '../../components/pos-command/hooks/utils/verifyPOSTransferReceipt';
import {transferReceiptVerificationService} from '../../services/transfer-receipt-verification.service';
vi.mock('../../lib/supabase',()=>({supabase:{from:vi.fn()}}));
vi.mock('../../services/transfer-receipt-verification.service',()=>({transferReceiptVerificationService:{get:vi.fn(),recordCount:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
describe('blind receiving',()=>{
 it('reads only the redacted view with bounded destination and country scope',async()=>{const q={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn()};for(const fn of Object.values(q))fn.mockReturnValue(q);q.eq.mockImplementation(()=>q);Object.assign(q,{then:(resolve:(x:unknown)=>unknown)=>Promise.resolve({data:[],error:null}).then(resolve)});vi.mocked(supabase.from).mockReturnValue(q as never);await blindReceivingService.jobs('site','ET');expect(supabase.from).toHaveBeenCalledWith('blind_receiving_wms');expect(q.eq).toHaveBeenCalledWith('dest_site_id','site');expect(q.eq).toHaveBeenCalledWith('country_code','ET');expect(q.limit).toHaveBeenCalledWith(200);});
 it('stops intake only when the server has not verified the count',async()=>{vi.mocked(transferReceiptVerificationService.get).mockResolvedValue({status:'awaiting_first_count',canCount:true,items:[{productId:'product'}] as never});vi.mocked(transferReceiptVerificationService.recordCount).mockResolvedValue({status:'awaiting_recount',canCount:false,items:[]});await expect(verifyPOSTransferReceipt('job',[{productId:'product',receivedQty:20}])).rejects.toThrow('not verified');});
});
