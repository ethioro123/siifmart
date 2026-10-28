// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { useApprovalDestination } from '../../hooks/useApprovalDestination';
import { APPROVAL_QUEUES } from '../../utils/unifiedApprovalInbox';
function Destination() {
  const [tab,setTab]=useState('overview'); const [modal,setModal]=useState(false);
  useApprovalDestination(params=>{ const next=params.get('tab'); if(next) {setTab(next); if(next==='payroll')setModal(true);} });
  return <><p>Selected tab: {tab}</p>{modal && <div role="dialog">Payroll review</div>}<button onClick={()=>setTab('other')}>Switch tab</button><Link to="/finance?tab=expenses">Review expenses</Link></>;
}
afterEach(cleanup);
describe('actual Review link navigation',()=>{
  it('navigates from the inbox and consumes the destination tab',async()=>{
    render(<MemoryRouter initialEntries={['/approvals']}><Routes><Route path="/approvals" element={<Link to={APPROVAL_QUEUES.expenses.href}>Review</Link>}/><Route path="/finance" element={<Destination/>}/></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('link',{name:'Review'}));
    expect(await screen.findByText('Selected tab: expenses')).toBeTruthy();
  });
  it('opens payroll review and preserves subsequent manual tab switches',async()=>{
    render(<MemoryRouter initialEntries={['/finance?tab=payroll']}><Destination/></MemoryRouter>);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Switch tab'})); expect(screen.getByText('Selected tab: other')).toBeTruthy();
    fireEvent.click(screen.getByRole('link',{name:'Review expenses'})); expect(await screen.findByText('Selected tab: expenses')).toBeTruthy();
  });
});
