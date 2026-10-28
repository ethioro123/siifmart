import { isPriceProposal, priceApprovalLabel } from '../../utils/priceApproval';
import type { PendingInventoryChange } from '../../types';
import { PRODUCT_EDIT_APPROVERS } from '../../utils/productEditApproval';

export function ProductEditApprovalProgress({ request }: { request: PendingInventoryChange }) {
    if (request.changeType !== 'edit') return null;
    if (isPriceProposal(request)) return <div className="space-y-1 text-sm text-[var(--theme-text-secondary)]" aria-label="Price approval progress">
        <p>Price approval: {request.status === 'approved' ? `Approved by ${request.approvedBy || 'commercial reviewer'}` : request.status === 'rejected' ? 'Rejected' : priceApprovalLabel(request)}</p>
        {request.priceApprovalRoute?.requiresFinance && <p>Country Finance clearance: {request.priceApprovalRoute.financeCleared ? 'Recorded' : 'Awaiting clearance'}</p>}
        {request.status === 'pending' && request.priceApprovalRoute?.block && <p>{request.priceApprovalRoute.block}</p>}
    </div>;
    return <div className="space-y-1 text-sm text-[var(--theme-text-secondary)]" aria-label="Regional approval progress">
        <p>Regional approvals: {request.productEditApprovals?.length || 0}/3</p>
        {Object.entries(PRODUCT_EDIT_APPROVERS).map(([role, label]) => {
            const vote = request.productEditApprovals?.find(item => item.role === role);
            return <p key={role}>{label}: {vote ? `${vote.name} · ${new Date(vote.approvedAt).toLocaleString()}` : 'Awaiting approval'}</p>;
        })}
    </div>;
}
