// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { OperationEvidence } from '../../components/fulfillment/review/OperationEvidence';
import type { OperationDetail } from '../../types/operations-review';
import type { useOperationsReview } from '../../hooks/useOperationsReview';
vi.mock('../../components/fulfillment/review/ReceivingReviewEvidence',()=>({ReceivingReviewEvidence:()=>null}));
afterEach(cleanup);
function setup(canNote=false) {
 const note=vi.fn().mockResolvedValue({saved:true}), credit=vi.fn().mockResolvedValue({id:'return',status:'approved'});
 const api={note:{mutateAsync:note,isPending:false},credit:{mutateAsync:credit,isPending:false},resolve:{isPending:false},audit:{isPending:false},openJob:{isPending:false}} as unknown as ReturnType<typeof useOperationsReview>;
 const value={summary:{source:'return',id:'return',operation:'RETURNS',reference:'RETURN-1',status:'pending'},fields:{},lines:[],reports:[],notes:[],fingerprint:'state-1',can_note:canNote,can_credit:true} as unknown as OperationDetail;
 render(<OperationEvidence value={value} api={api} site="site" country="ET" page={0} t={key=>key} onSaved={vi.fn().mockRejectedValue(new Error('Refresh failed'))} onOpen={vi.fn()} onInventory={vi.fn()} onRelated={vi.fn()}/>);
 return {note,credit};
}
it('shows credit actions independently from note permission and keeps confirmed success after refresh failure',async()=>{
 const {credit,note}=setup();
 expect(screen.queryByRole('button',{name:'warehouse.opRecordReview'})).toBeNull();
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Verified the return evidence'}});
 fireEvent.click(screen.getByRole('button',{name:'warehouse.returnApproveCredit'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toBe('warehouse.opSaved'));
 expect(credit).toHaveBeenCalledWith({id:'return',approve:true,reason:'Verified the return evidence'});
 expect(note).not.toHaveBeenCalled();
});
it('prevents duplicate decision requests before the pending state reaches the UI',async()=>{
 const {credit}=setup();
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Verified evidence'}});
 const button=screen.getByRole('button',{name:'warehouse.returnApproveCredit'});
 fireEvent.click(button);fireEvent.click(button);
 await waitFor(()=>expect(credit).toHaveBeenCalledTimes(1));
});
