import { describe, expect, it } from 'vitest';
import { APPROVAL_QUEUES } from '../../utils/unifiedApprovalInbox';
import { approvalWorkspaceTarget } from '../../utils/approvalWorkspaceTarget';
describe('approval coverage', () => {
 it('opens central reviews except explicit operational handoffs', () => {
  const handoffs = Object.keys(APPROVAL_QUEUES).filter(key => !approvalWorkspaceTarget(key));
  expect(handoffs.sort()).toEqual(['onboarding', 'transfers']);
  expect(approvalWorkspaceTarget('unknown')).toBeUndefined();
 });
});
