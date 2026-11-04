// @vitest-environment jsdom
import React from 'react';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach,expect,it,vi } from 'vitest';
import { PosManagerReview } from '../../components/pos-command/review/PosManagerReview';
import { posManagerReview } from '../../utils/translations/posManagerReview';
const state=vi.hoisted(()=>({role:'store_manager',calls:vi.fn(),error:false,evidence:false,controls:true,receiving:vi.fn()}));
vi.mock('../../contexts/CentralStore',()=>({useStore:()=>({user:{id:'manager',role:state.role}})}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({activeSite:{id:'site'},effectiveCountry:'ET'})}));
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key})}));
vi.mock('../../components/pos-command/POSCommandContext',()=>({usePOSCommand:()=>({setIsReceivingModalOpen:state.receiving})}));
vi.mock('../../components/pos-command/layout/CounterReviewPanel',()=>({CounterReviewPanel:()=>null}));
vi.mock('../../components/Modal',()=>({default:({children}:{children:React.ReactNode})=><div role="dialog">{children}</div>}));
vi.mock('../../hooks/usePosManagerReview',()=>({usePosManagerReview:(...args:unknown[])=>{state.calls(...args);const row={source:'receiving',id:'transfer',reference:'TRANSFER-TEST',status:'Requested',actor_name:'',occurred_at:'2026-11-05'};return{queue:{data:state.evidence?[row]:[],isFetching:false,isError:state.error},detail:{data:state.evidence?{summary:row,fields:{discrepancy:false},notes:[],can_note:false,can_controls:state.controls}:undefined,isFetching:false},note:{isPending:false}};}}));
afterEach(()=>{cleanup();state.role='store_manager';state.calls.mockClear();state.error=false;state.evidence=false;state.controls=true;state.receiving.mockClear();});
const setup=()=>render(<MemoryRouter><PosManagerReview/></MemoryRouter>);
it('loads no review evidence until explicitly opened and includes receiving',()=>{
 setup();expect(state.calls).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'posCommand.managerReview'}));
 expect(state.calls).toHaveBeenCalled();
 expect(screen.getByRole('option',{name:'posCommand.review_receiving'})).toBeTruthy();
 expect(screen.getByRole('option',{name:'posCommand.review_payment'})).toBeTruthy();
 expect(screen.getByText('posCommand.reviewEmpty')).toBeTruthy();
});
it('keeps manager review unavailable to cashier accounts',()=>{state.role='cashier';setup();expect(screen.queryByRole('button')).toBeNull();expect(state.calls).not.toHaveBeenCalled();});
it('does not present a failed queue as an empty queue',()=>{state.error=true;setup();fireEvent.click(screen.getByRole('button',{name:'posCommand.managerReview'}));expect(screen.getByRole('alert')).toBeTruthy();expect(screen.queryByText('posCommand.reviewEmpty')).toBeNull();});
it('has complete translated review controls in all active languages',()=>{for(const entry of Object.values(posManagerReview))for(const lang of ['en','am','or'])expect((entry as Record<string,string>)[lang]?.trim()).toBeTruthy();});

it('opens the existing receiving workflow without exposing expected quantities',()=>{
 state.evidence=true;setup();fireEvent.click(screen.getByRole('button',{name:'posCommand.managerReview'}));
 fireEvent.click(screen.getByRole('button',{name:'posCommand.reviewDetails'}));
 expect(screen.getByText('posCommand.reviewNo')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'posCommand.reviewReceivingControls'}));
 expect(state.receiving).toHaveBeenCalledWith(true);
});
it('shows unavailable approval controls and does not offer a broken receiving action',()=>{
 state.evidence=true;state.controls=false;setup();fireEvent.click(screen.getByRole('button',{name:'posCommand.managerReview'}));
 fireEvent.click(screen.getByRole('button',{name:'posCommand.reviewDetails'}));
 expect(screen.getByText('posCommand.reviewControlsUnavailable')).toBeTruthy();
 expect(screen.queryByRole('button',{name:'posCommand.reviewReceivingControls'})).toBeNull();
 expect(state.receiving).not.toHaveBeenCalled();
});
