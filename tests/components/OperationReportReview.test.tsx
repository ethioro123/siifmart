// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { OperationReportReview } from '../../components/fulfillment/review/OperationReportReview';
import type { OperationReport } from '../../types/operations-review';
import type { useOperationsReview } from '../../hooks/useOperationsReview';
afterEach(cleanup);
it('records one reconciliation and prevents replay from stale report permissions',async()=>{
 const resolve=vi.fn().mockResolvedValue({resolved_at:'2026-11-05'});
 const api={resolve:{isPending:false,mutateAsync:resolve},audit:{isPending:false},note:{isPending:false},credit:{isPending:false}} as unknown as ReturnType<typeof useOperationsReview>;
 const report={id:'discrepancy',item_index:0,can_resolve:true,can_review:false,resolved_at:null,expected_qty:10,first_count:8,recount:8} as OperationReport;
 render(<OperationReportReview report={report} job="job" isPick api={api} t={key=>key} onSaved={vi.fn().mockRejectedValue(new Error('Refresh failed'))}/>);
 fireEvent.change(screen.getByRole('spinbutton'),{target:{value:'8'}});
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Recount physically verified'}});
 const save=screen.getByRole('button',{name:'warehouse.opResolve'});
 fireEvent.click(save);fireEvent.click(save);
 await waitFor(()=>expect(screen.getByRole('status').textContent).toBe('warehouse.opSaved'));
 expect(resolve).toHaveBeenCalledTimes(1);
 expect((save as HTMLButtonElement).disabled).toBe(true);
});
