import React from 'react';
import { useFinancialsState } from '../../hooks/useFinancialsState';
import { FinanceProvider } from '../financials/FinanceContext';
import PayrollTab from '../financials/PayrollTab';
import PayrollModal from '../financials/PayrollModal';
import LowMarginQueueTab from '../financials/LowMarginQueueTab';
export default function FinanceReviewAdapter({ mode }: { mode: 'payroll' | 'margin' }) {
  const state = useFinancialsState(mode);
  return <FinanceProvider value={state}>{mode === 'payroll' ? <><PayrollTab /><PayrollModal /></> : <LowMarginQueueTab />}</FinanceProvider>;
}
