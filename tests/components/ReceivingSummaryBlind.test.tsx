// @vitest-environment jsdom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {ReceivingSummary} from '../../components/pos-command/modals/components/ReceivingSummary';
vi.mock('../../components/pos-command/POSCommandContext',()=>({usePOSCommand:()=>({receivingSummary:{timestamp:'2026-10-27',orderRef:'test',items:[{name:'Diaper',sku:'ETBB002',receivedQty:23,expectedQty:0,unit:'UNIT',condition:'Good'}]},handleCloseReceivingModal:vi.fn()})}));
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key==='posCommand.received'?'Received':key})}));
afterEach(cleanup);
it('shows the confirmed count without inventing an expected zero from blind data',()=>{
 render(<ReceivingSummary/>);expect(screen.getByText('Received 23 UNIT')).toBeTruthy();expect(screen.queryByText(/Out of|outOf|0 UNIT/)).toBeNull();
});
