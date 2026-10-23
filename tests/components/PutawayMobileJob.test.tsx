// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => true }));
vi.mock('../../components/Protected', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
import { PutawayList } from '../../components/fulfillment/putaway/PutawayList';
import type { WMSJob } from '../../types';
afterEach(cleanup);
describe('mobile putaway job opening', () => {
 it.each(['Pending','In-Progress'] as const)('opens the modal for %s jobs without starting execution', status => {
  const job = { id:'job-1', jobNumber:'PUT-001', type:'PUTAWAY', status, priority:'Normal', items:1, lineItems:[], siteId:'wh', location:'Receiving Dock', orderRef:'po-1' } as WMSJob;
  const show = vi.fn(); const start = vi.fn();
  render(<PutawayList sortedPutawayJobs={[job]} paginatedPutawayJobs={[job]} putawayCurrentPage={1} putawayTotalPages={1} setPutawayCurrentPage={vi.fn()} putawayItemsPerPage={25} resolveOrderRef={ref=>ref||''} selectedJob={null} setSelectedJob={vi.fn()} employees={[]} user={{role:'warehouse_manager'}} isSubmitting={false} setIsSubmitting={vi.fn()} handleStartJob={start} onShowDetails={show} t={key=>key} />);
  fireEvent.click(screen.getByRole('button',{name:/Open putaway job/}));
  expect(show).toHaveBeenCalledWith(job);
  expect(start).not.toHaveBeenCalled();
 });
});
