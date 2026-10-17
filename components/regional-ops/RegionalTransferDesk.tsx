import React, { useState } from 'react';
import {
  ArrowRightLeft, CheckCircle2, Clock, Truck, ShieldCheck,
  AlertTriangle, Plus, ChevronRight, PackageCheck, Send, ShieldAlert,
  Lock, Check
} from 'lucide-react';
import type { TransferRecord, Site, Employee } from '../../types';
import { transfersService } from '../../services/transfers.service';
import { tasksService } from '../../services/tasks.service';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { logger } from '../../utils/logger';
import { StockRebalanceRecommendations } from './StockRebalanceRecommendations';
import { TransferDispatchModal } from './TransferDispatchModal';
import { TransferDiscrepancyDrawer } from './TransferDiscrepancyDrawer';

interface RegionalTransferDeskProps {
  regionCode: string;
  regionalSites: Site[];
  regionalEmployees: Employee[];
  currencySymbol: string;
}

export const RegionalTransferDesk: React.FC<RegionalTransferDeskProps> = ({
  regionCode,
  regionalSites,
  regionalEmployees,
  currencySymbol
}) => {
  const { user } = useStore();
  const { addNotification, effectiveCountry } = useData();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [dispatchModalTransfer, setDispatchModalTransfer] = useState<TransferRecord | null>(null);

  // Load regional transfers on mount
  React.useEffect(() => {
    let isMounted = true;
    const fetchTransfers = async () => {
      setLoading(true);
      try {
        const data = await transfersService.getAll(undefined, 50, regionCode, effectiveCountry);
        if (isMounted) setTransfers(data || []);
      } catch (err) {
        logger.error('RegionalTransferDesk', 'Failed to load regional transfers', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTransfers();
    return () => { isMounted = false; };
  }, [regionCode, effectiveCountry]);

  const activeTransfers = transfers.filter(t => !['Received', 'Completed', 'Cancelled'].includes(t.status));
  const completedTransfers = transfers.filter(t => ['Received', 'Completed'].includes(t.status));

  // Autonomous Intra-Regional Transfer Approval (Inter-Regional requires HQ)
  const handleApprove = async (transferId: string) => {
    const target = transfers.find(t => t.id === transferId);
    const isInterRegional = Boolean(target?.isInterRegion || target?.is_inter_region ||
      (target?.sourceRegionCode && target?.destRegionCode && target.sourceRegionCode !== target.destRegionCode));
    const isHQUser = Boolean(user?.role && ['super_admin', 'ceo', 'operations_manager', 'logistics_manager'].includes(user.role));

    if (isInterRegional && !isHQUser) {
      addNotification?.('alert', 'Inter-regional transfers cross territory borders and require Corporate HQ / Logistics sign-off.');
      return;
    }

    try {
      await transfersService.approve(transferId, {
        approverId: user?.id || user?.employeeId || 'unknown',
        approverName: user?.name || (isHQUser ? 'Corporate Logistics' : 'Regional Manager'),
        approverRole: user?.role || (isHQUser ? 'operations_manager' : 'regional_manager'),
        notes: isInterRegional ? 'HQ Inter-Regional Authorization' : 'Autonomous Regional Approval'
      });
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'Approved', approvedBy: user?.name } : t));
      addNotification?.('success', isInterRegional ? 'Inter-regional transfer authorized by Corporate Logistics.' : 'Intra-regional transfer approved autonomously.');
    } catch (err: any) {
      logger.error('RegionalTransferDesk', 'Failed to approve transfer', err);
      addNotification?.('alert', err.message || 'Failed to approve transfer');
    }
  };

  // Dispatch Logistics Handler (External Courier vs Internal Fleet Driver)
  const handleDispatchConfirm = async ({ driverType, driverId, driverName }: { driverType: 'INTERNAL' | 'EXTERNAL'; driverId?: string; driverName: string; }) => {
    if (!dispatchModalTransfer) return;
    try {
      const now = new Date().toISOString();
      const updated = await transfersService.update(dispatchModalTransfer.id, {
        status: driverType === 'EXTERNAL' ? 'Dispatched' : 'In-Transit',
        driverType,
        driverId: driverId || undefined,
        driverName,
        dispatchedAt: now,
        dispatchedBy: user?.name || 'Dispatcher'
      });
      setTransfers(prev => prev.map(t => t.id === dispatchModalTransfer.id ? { ...t, ...updated } : t));
      addNotification?.('success', `Transfer dispatched via ${driverType === 'EXTERNAL' ? 'External Courier' : 'Internal Fleet Driver'}.`);
    } catch (err: any) {
      logger.error('RegionalTransferDesk', 'Failed to dispatch transfer', err);
      addNotification?.('alert', err.message || 'Failed to dispatch transfer');
    }
  };

  // Internal Driver Delivery Confirmation (Unlocks Receiving at Destination Store)
  const handleDriverDeliver = async (transferId: string) => {
    try {
      const now = new Date().toISOString();
      const updated = await transfersService.update(transferId, {
        status: 'Delivered',
        deliveredAt: now
      });
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, ...updated } : t));
      addNotification?.('success', 'Internal fleet driver confirmed arrival and delivery at destination store.');
    } catch (err: any) {
      logger.error('RegionalTransferDesk', 'Failed to confirm driver delivery', err);
      addNotification?.('alert', err.message || 'Failed to confirm delivery');
    }
  };

  // Dual-Handshake Receiving
  const handleReceiveHandshake = async (transferId: string) => {
    try {
      await transfersService.update(transferId, {
        status: 'Received',
        receivedBy: user?.name || 'Authorized Receiver',
        receivedAt: new Date().toISOString()
      });
      setTransfers(prev => prev.map(t => t.id === transferId ? {
        ...t,
        status: 'Received',
        receivedBy: user?.name,
        receivedAt: new Date().toISOString()
      } : t));
      addNotification?.('success', 'Dual-handshake receiving verified and recorded.');
    } catch (err: any) {
      logger.error('RegionalTransferDesk', 'Failed to verify transfer receipt', err);
      addNotification?.('alert', err.message || 'Failed to complete receiving');
    }
  };

  const [discrepancyTransferId, setDiscrepancyTransferId] = useState<string | null>(null);
  const [discrepancyNotes, setDiscrepancyNotes] = useState<string>('');
  const [discrepancyReasonCode, setDiscrepancyReasonCode] = useState<string>('DAMAGED_IN_TRANSIT');

  // Tier 1: Local Store Manager Discrepancy Sign-Off (Reason Code Audit)
  const handleResolveLocally = async (transfer: TransferRecord) => {
    if (!discrepancyNotes.trim()) {
      addNotification?.('alert', 'Please provide discrepancy notes explaining the accepted variance.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const updated = await transfersService.update(transfer.id, {
        status: 'Received',
        hasDiscrepancy: true,
        discrepancyResolutionType: 'LOCAL_STORE_MANAGER',
        discrepancyReasonCode,
        discrepancyDetails: discrepancyNotes,
        discrepancyResolvedBy: user?.name || 'Store Manager',
        discrepancyResolvedAt: now,
        receivedBy: user?.name || 'Store Manager',
        receivedAt: now
      });

      setTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, ...updated } : t));
      setDiscrepancyTransferId(null);
      setDiscrepancyNotes('');
      addNotification?.('success', `Discrepancy resolved locally by Store Manager under reason: ${discrepancyReasonCode.replace(/_/g, ' ')}.`);
    } catch (err: any) {
      logger.error('RegionalTransferDesk', 'Failed to resolve discrepancy locally', err);
      addNotification?.('alert', err.message || 'Failed to resolve locally');
    }
  };

  // Tier 2: High-Value Discrepancy Escalation to Regional Security Supervisor & Loss Prevention
  const handleEscalateLP = async (transfer: TransferRecord) => {
    if (!discrepancyNotes.trim()) {
      addNotification?.('alert', 'Please provide discrepancy notes explaining the missing high-value units.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const updated = await transfersService.update(transfer.id, {
        status: 'Received',
        hasDiscrepancy: true,
        discrepancyResolutionType: 'ESCALATED_LOSS_PREVENTION',
        discrepancyReasonCode,
        discrepancyDetails: discrepancyNotes,
        receivedBy: user?.name || 'Receiver',
        receivedAt: now
      });

      // Automatically create investigation task assigned to regional_security_supervisor
      const secLead = regionalEmployees.find(e => e.role === 'regional_security_supervisor');
      const srcSite = regionalSites.find(s => s.id === transfer.sourceSiteId);
      const dstSite = regionalSites.find(s => s.id === transfer.destSiteId);

      await tasksService.create({
        title: `High-Value Discrepancy: ${transfer.orderRef || transfer.id.slice(0, 8)}`,
        description: `High-value variance reported: "${discrepancyNotes}" [Reason: ${discrepancyReasonCode}]. Dispatched from ${srcSite?.name || 'Origin'} to ${dstSite?.name || 'Destination'}. Requires Loss Prevention audit and supervisor sign-off.`,
        assignedTo: secLead?.id || 'UNASSIGNED',
        priority: 'High',
        status: 'Pending',
        dueDate: new Date().toISOString().split('T')[0],
        regionCode,
        taskType: 'LP_INVESTIGATION',
        createdBy: user?.name || 'Receiver'
      });

      setTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, ...updated } : t));
      setDiscrepancyTransferId(null);
      setDiscrepancyNotes('');
      addNotification?.('success', `High-value discrepancy escalated to Regional Security Supervisor (${secLead?.name || 'Security Lead'}).`);
    } catch (err: any) {
      logger.error('RegionalTransferDesk', 'Failed to report discrepancy', err);
      addNotification?.('alert', err.message || 'Failed to submit discrepancy');
    }
  };

  const displayedList = activeTab === 'active' ? activeTransfers : completedTransfers;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
            Intra-Regional Stock Dispatcher
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Fast-track store rebalancing and dual-handshake transfers within {regionCode}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'active'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            In-Transit & Pending ({activeTransfers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'completed'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Completed ({completedTransfers.length})
          </button>
        </div>
      </div>

      {/* Automated Inter-Store Stock Balancing Recommendations */}
      {activeTab === 'active' && (
        <StockRebalanceRecommendations
          regionCode={regionCode}
          regionalSites={regionalSites}
          onTransferCreated={created => setTransfers(prev => [created, ...prev])}
        />
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--theme-text-secondary)] animate-pulse">
          Loading regional transfers...
        </div>
      ) : displayedList.length === 0 ? (
        <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
          <ArrowRightLeft className="w-10 h-10 mx-auto text-[var(--theme-text-secondary)] opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
            No {activeTab === 'active' ? 'Active' : 'Completed'} Transfers
          </h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
            All regional facility inventories are currently in equilibrium.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedList.map(transfer => {
            const srcSite = regionalSites.find(s => s.id === transfer.sourceSiteId);
            const dstSite = regionalSites.find(s => s.id === transfer.destSiteId);

            return (
              <div
                key={transfer.id}
                className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {transfer.orderRef || transfer.id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                        transfer.status === 'Requested'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : transfer.status === 'Approved'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : transfer.status === 'In-Transit' || transfer.status === 'Dispatched'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                              : transfer.status === 'Delivered'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                                : transfer.status === 'Received' || transfer.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20'
                      }`}>
                        {transfer.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                      <span className="font-medium text-[var(--theme-text-primary)]">
                        {srcSite?.name || 'Local Facility'}
                      </span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="font-medium text-[var(--theme-text-primary)]">
                        {dstSite?.name || 'Destination Branch'}
                      </span>
                      <span>•</span>
                      <span>{transfer.items?.length || 0} line items</span>
                      {transfer.driverName && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-[var(--theme-accent)]">
                            {transfer.driverType === 'EXTERNAL' ? 'Courier' : 'Fleet'}: {transfer.driverName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Handshake & Actions */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 self-end md:self-center">
                  {transfer.status === 'Requested' && (() => {
                    const isInter = Boolean(transfer.isInterRegion || transfer.is_inter_region ||
                      (transfer.sourceRegionCode && transfer.destRegionCode && transfer.sourceRegionCode !== transfer.destRegionCode));
                    const isHQ = Boolean(user?.role && ['super_admin', 'ceo', 'operations_manager', 'logistics_manager'].includes(user.role));

                    if (isInter && !isHQ) {
                      return (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-semibold">
                          Awaiting HQ Co-Sign
                        </span>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => handleApprove(transfer.id)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isInter ? 'HQ Sign-Off' : 'Approve Rebalance'}</span>
                      </button>
                    );
                  })()}

                  {transfer.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => setDispatchModalTransfer(transfer)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Driver</span>
                    </button>
                  )}

                  {/* Active Logistics Handshake */}
                  {['Shipped', 'Dispatched', 'In-Transit', 'Delivered'].includes(transfer.status) && (() => {
                    const isExternal = transfer.driverType === 'EXTERNAL';
                    const isDelivered = transfer.status === 'Delivered';
                    const canStoreReceive = isExternal || isDelivered;

                    return (
                      <div className="flex items-center gap-1.5">
                        {/* Internal driver transit: button to confirm delivery */}
                        {!isExternal && transfer.status === 'In-Transit' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Awaiting Fleet Delivery</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDriverDeliver(transfer.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                              title="Internal driver clicks to confirm arrival at store"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Driver: Mark Delivered</span>
                            </button>
                          </div>
                        )}

                        {/* Destination store receiving sign-off */}
                        {canStoreReceive ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReceiveHandshake(transfer.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Dual Sign-Off</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDiscrepancyTransferId(discrepancyTransferId === transfer.id ? null : transfer.id);
                                setDiscrepancyNotes('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                              title="Report Missing Units & Escalate to Security Supervisor"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Discrepancy</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    );
                  })()}

                  {(transfer.status === 'Received' || transfer.status === 'Completed') && (
                    <div className="text-right">
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verified by {transfer.receivedBy || 'Staff'}</span>
                      </div>
                      {transfer.hasDiscrepancy && (
                        <div className="mt-1 flex flex-col items-end gap-0.5">
                          {transfer.discrepancyResolutionType === 'LOCAL_STORE_MANAGER' ? (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Store Manager Resolved: {transfer.discrepancyReasonCode?.replace(/_/g, ' ') || 'Local Sign-Off'}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>LP Escalated: {transfer.discrepancyDetails}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline Discrepancy Escalation Drawer */}
                {discrepancyTransferId === transfer.id && (
                  <TransferDiscrepancyDrawer
                    transfer={transfer}
                    discrepancyReasonCode={discrepancyReasonCode}
                    discrepancyNotes={discrepancyNotes}
                    onChangeReasonCode={setDiscrepancyReasonCode}
                    onChangeNotes={setDiscrepancyNotes}
                    onCancel={() => setDiscrepancyTransferId(null)}
                    onResolveLocally={handleResolveLocally}
                    onEscalateLP={handleEscalateLP}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Driver Dispatch Modal */}
      {dispatchModalTransfer && (
        <TransferDispatchModal
          transfer={dispatchModalTransfer}
          regionalEmployees={regionalEmployees}
          regionalSites={regionalSites}
          onClose={() => setDispatchModalTransfer(null)}
          onDispatch={handleDispatchConfirm}
        />
      )}
    </div>
  );
};
