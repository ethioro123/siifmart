import React from 'react';
import { Download, Plus, Check, Truck, AlertTriangle } from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import Modal from '../../Modal';
import { DocksHistory } from './DocksHistory';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';

interface DockStatus {
    status: 'Empty' | 'Occupied' | 'Maintenance';
    assignedPoId?: string;
    assignedJobId?: string; // Kept for type compatibility, though unused in Inbound
    vesselName?: string;
    eta?: string;
}

interface DocksInboundViewProps {
    dockStatus: Record<string, DockStatus>;
    orders: PurchaseOrder[];
    inboundQueue: PurchaseOrder[];
    selectedQueueVessel: PurchaseOrder | null;
    setSelectedQueueVessel: (vessel: PurchaseOrder | null) => void;
    assignVesselToDock: (dockId: string, vessel: PurchaseOrder) => void;
    setSelectedDockId: (dockId: string | null) => void;
    quickConfirmUnload: (dockId: string) => void;
    handleOpenManifest: (dockId: string) => void;
    manifestModalOpen: boolean;
    setManifestModalOpen: (open: boolean) => void;
    selectedManifestPO: PurchaseOrder | null;
    confirmUnloadAndReceive: () => Promise<void>;
    viewMode: 'Process' | 'History';
    t: (key: string) => string;
}

export const DocksInboundView: React.FC<DocksInboundViewProps> = ({
    dockStatus,
    orders,
    inboundQueue,
    selectedQueueVessel,
    setSelectedQueueVessel,
    assignVesselToDock,
    setSelectedDockId,
    quickConfirmUnload,
    handleOpenManifest,
    manifestModalOpen,
    setManifestModalOpen,
    selectedManifestPO,
    confirmUnloadAndReceive,
    viewMode,
    t
}) => {
    const { settings, effectiveCountry } = useData();
    const isBlindReceiving = resolveReceivingPolicy(settings, effectiveCountry).blind;

    return (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pr-1">
            {viewMode === 'Process' ? (
                <>
                    {/* DOCK TERMINAL MAP */}
                    <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 relative overflow-hidden lg:overflow-y-auto shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase flex items-center gap-2.5">
                                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                        <Download className="text-primary" size={18} />
                                    </div>
                                    {t('warehouse.docks.inboundTitle')}
                                </h3>
                                <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider mt-1.5 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Dock stays occupied until receiving finishes
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {Object.entries(dockStatus).filter(([k]) => k.startsWith('D')).map(([dock, data]) => {
                                const status = data.status;
                                const isSelectedForAssignment = selectedQueueVessel && status === 'Empty';

                                return (
                                    <div
                                        key={dock}
                                        onClick={() => {
                                            if (isSelectedForAssignment) {
                                                assignVesselToDock(dock, selectedQueueVessel);
                                            } else if (status !== 'Empty') {
                                                setSelectedDockId(dock);
                                            }
                                        }}
                                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-3 sm:p-4 gap-3 relative cursor-pointer transition-colors shadow-sm touch-manipulation ${
                                            status === 'Empty'
                                                ? isSelectedForAssignment
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)]'
                                                : status === 'Occupied'
                                                    ? 'border-red-500/30 bg-red-500/5'
                                                    : 'border-amber-500/30 bg-amber-500/5'
                                        }`}
                                    >
                                        <span className="absolute top-3 left-3.5 font-bold font-mono text-[var(--theme-text-muted)] text-sm tracking-tight">{dock}</span>

                                        <div className="relative">
                                            {status === 'Occupied' ? (
                                                <div className="relative">
                                                    <Truck size={40} className="text-red-500" />
                                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                                </div>
                                            ) : status === 'Empty' ? (
                                                <div className={`w-14 h-14 rounded-2xl border border-dashed flex items-center justify-center transition-colors ${isSelectedForAssignment ? 'border-primary bg-primary/20' : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)]'}`}>
                                                    {isSelectedForAssignment && <Plus size={22} className="text-primary" />}
                                                </div>
                                            ) : (
                                                <AlertTriangle size={40} className="text-amber-500" />
                                            )}
                                        </div>

                                        <div className="text-center w-full">
                                            <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                status === 'Empty'
                                                    ? 'text-primary bg-primary/10 border-primary/20'
                                                    : status === 'Occupied'
                                                        ? 'text-red-500 bg-red-500/10 border-red-500/20'
                                                        : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                            }`}>
                                                {isSelectedForAssignment ? 'Select Dock' : status === 'Empty' ? t('warehouse.docks.empty') : status === 'Occupied' ? t('warehouse.docks.occupied') : t('warehouse.docks.maintenance')}
                                            </span>
                                            {status === 'Occupied' && data.vesselName && (
                                                <div className="flex flex-col items-center gap-1.5 mt-2 w-full">
                                                    <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase truncate max-w-full">{data.vesselName}</p>
                                                    {/* Quick Confirm Unload */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            quickConfirmUnload(dock);
                                                        }}
                                                        className="w-full min-h-[44px] px-3 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-[11px] font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-colors active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer"
                                                    >
                                                        <Check size={13} />
                                                        Open receiving
                                                    </button>
                                                    {/* View Manifest */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenManifest(dock);
                                                        }}
                                                        className="w-full min-h-[44px] px-3 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider rounded-xl border border-[var(--theme-border)] transition-colors active:scale-[0.98] whitespace-nowrap touch-manipulation"
                                                    >
                                                        View Manifest
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <button className="aspect-square rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] flex flex-col items-center justify-center gap-2 group transition-colors touch-manipulation">
                                <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                    <Plus size={20} className="text-[var(--theme-text-muted)] group-hover:text-primary" />
                                </div>
                                <span className="text-[11px] text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider">{t('warehouse.docks.newShipment') || 'Expand Bay'}</span>
                            </button>
                        </div>
                    </div>

                    {/* MANIFEST MODAL */}
                    <Modal
                        isOpen={manifestModalOpen}
                        onClose={() => setManifestModalOpen(false)}
                        title={`MANIFEST: ${selectedManifestPO?.poNumber || 'Unknown PO'}`}
                    >
                        <div className="p-4 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Expected Goods</p>
                                    <p className="text-[11px] text-[var(--theme-text-muted)]">Please confirm the unload manifest.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{selectedManifestPO?.lineItems?.length || 0}</p>
                                    <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Line Items</p>
                                </div>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] overflow-hidden mb-6 max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)]">
                                        <tr>
                                            <th className="px-4 py-2.5 text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase tracking-wider">Item / SKU</th>
                                            <th className="px-4 py-2.5 text-[11px] text-[var(--theme-text-muted)] font-semibold uppercase tracking-wider text-right">
                                                {isBlindReceiving ? 'Qty (Blind)' : 'Qty'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--theme-border)]">
                                        {selectedManifestPO?.lineItems?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-[var(--theme-bg-card)] transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{item.productName}</p>
                                                    <p className="text-[11px] text-[var(--theme-text-muted)] font-mono">{item.sku || 'NO SKU'}</p>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-xs font-mono font-bold tabular-nums text-primary">
                                                    {isBlindReceiving ? (
                                                        <span className="text-amber-600 dark:text-amber-400">*** Blind</span>
                                                    ) : (
                                                        item.quantity
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setManifestModalOpen(false)}
                                    className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] text-xs font-semibold uppercase tracking-wider transition-colors touch-manipulation"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmUnloadAndReceive}
                                    className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold uppercase tracking-wider transition-colors active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm touch-manipulation cursor-pointer"
                                >
                                    <Download size={15} />
                                    Open receiving inspection
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* INBOUND LOGISTICS QUEUE */}
                    <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 flex flex-col relative overflow-hidden lg:h-full shadow-sm">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] tracking-wider uppercase flex items-center gap-2">
                                {t('warehouse.docks.inboundQueue')}
                                <span className="h-1 w-1 rounded-full bg-[var(--theme-text-muted)]" />
                                <span className="text-primary font-mono font-bold tabular-nums">{inboundQueue.length.toString().padStart(2, '0')}</span>
                            </h3>
                            <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">{t('warehouse.sortingHigh')}</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {inboundQueue.map(vessel => (
                                <div key={vessel.id} className={`p-4 bg-[var(--theme-bg-subtle)] rounded-xl border transition-colors shadow-sm ${selectedQueueVessel?.id === vessel.id ? 'border-primary bg-primary/5' : 'border-[var(--theme-border)] hover:border-primary/30'} `}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider truncate">{vessel.supplierName || vessel.poNumber}</p>
                                                {vessel.priority === 'High' && <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold rounded-full border border-amber-500/20">{t('warehouse.priority')}</div>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 tabular-nums">{vessel.poNumber || vessel.id.slice(-6)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedQueueVessel(selectedQueueVessel?.id === vessel.id ? null : vessel)}
                                        className={`w-full min-h-[44px] py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-colors active:scale-[0.98] border touch-manipulation cursor-pointer ${selectedQueueVessel?.id === vessel.id ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-[var(--theme-primary)] hover:opacity-90' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'} `}
                                    >
                                        {selectedQueueVessel?.id === vessel.id ? 'Cancel Selection' : t('warehouse.docks.assignDock')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </>
            ) : (
                /* DOCK HISTORY SECTION */
                <div className="w-full">
                    <DocksHistory
                        orders={orders}
                        t={t}
                    />
                </div>
            )}
        </div>
    );
};
