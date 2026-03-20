import React from 'react';
import { Download, Plus, Check, Truck, AlertTriangle } from 'lucide-react';
import { PurchaseOrder, User } from '../../../types';
import Modal from '../../Modal';
import { DocksHistory } from './DocksHistory';

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
    inboundQueue: any[];
    selectedQueueVessel: any | null;
    setSelectedQueueVessel: (vessel: any | null) => void;
    assignVesselToDock: (dockId: string, vessel: any) => void;
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
    return (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pr-2 custom-scrollbar">
            {viewMode === 'Process' ? (
                <>
                    {/* DOCK TERMINAL MAP */}
                    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group shadow-2xl lg:overflow-y-auto custom-scrollbar">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                    <div className="p-2 bg-blue-600/20 rounded-xl">
                                        <Download className="text-blue-400" size={20} />
                                    </div>
                                    {t('warehouse.docks.inboundTitle')}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Live Terminal Telemetry Active
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
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
                                        className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center gap-4 relative group cursor-pointer transition-all duration-500 hover:scale-[1.02] active: scale-95 shadow-2xl ${status === 'Empty' ? (isSelectedForAssignment ? 'border-blue-500 animate-pulse bg-blue-500/10' : 'border-green-500/20 bg-green-500/5 shadow-green-500/5') :
                                            status === 'Occupied' ? 'border-red-500/20 bg-red-500/5 shadow-red-500/5' :
                                                'border-orange-500/20 bg-orange-500/5 shadow-orange-500/5'
                                            } `}
                                    >
                                        {/* Ambient Status Glow */}
                                        <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full ${status === 'Empty' ? 'bg-green-500' :
                                            status === 'Occupied' ? 'bg-red-500' :
                                                'bg-orange-500'
                                            } `} />

                                        <span className="absolute top-4 left-5 font-black text-white/20 text-xl tracking-tighter">{dock}</span>

                                        <div className="relative">
                                            {status === 'Occupied' ? (
                                                <div className="relative">
                                                    <Truck size={48} className="text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.4)]" />
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-ping" />
                                                </div>
                                            ) : status === 'Empty' ? (
                                                <div className={`w-16 h-16 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${isSelectedForAssignment ? 'border-blue-500/50 bg-blue-500/10 rotate-45 scale-110' : 'border-green-500/10'} `}>
                                                    {isSelectedForAssignment && <Plus size={24} className="text-blue-400 -rotate-45" />}
                                                </div>
                                            ) : (
                                                <AlertTriangle size={48} className="text-orange-400" />
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status === 'Empty' ? (isSelectedForAssignment ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20') :
                                                status === 'Occupied' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                                    'text-orange-400 bg-orange-500/10 border-orange-500/20'
                                                } `}>
                                                {isSelectedForAssignment ? 'Select Dock' : status === 'Empty' ? t('warehouse.docks.empty') : status === 'Occupied' ? t('warehouse.docks.occupied') : t('warehouse.docks.maintenance')}
                                            </span>
                                            {status === 'Occupied' && data.vesselName && (
                                                <div className="flex flex-col items-center gap-2 mt-2">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter max-w-[80px] truncate">{data.vesselName}</p>
                                                    {/* [NEW] Quick Confirm Unload - One-click, stays on DOCKS */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            quickConfirmUnload(dock);
                                                        }}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-green-600/20 transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
                                                    >
                                                        <Check size={12} />
                                                        Confirm Unload
                                                    </button>
                                                    {/* View Manifest - Optional detail view */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenManifest(dock);
                                                        }}
                                                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[7px] font-bold uppercase tracking-widest rounded-lg border border-white/10 transition-all active:scale-95 whitespace-nowrap"
                                                    >
                                                        View Manifest
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <button className="aspect-square rounded-3xl border-2 border-dashed border-white/5 bg-white/2 flex flex-col items-center justify-center gap-3 group hover:border-blue-500/30 hover:bg-blue-600/5 transition-all">
                                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-600/20 transition-all">
                                    <Plus size={24} className="text-gray-600 group-hover:text-blue-400" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('warehouse.docks.newShipment') || 'Expand Bay'}</span>
                            </button>
                        </div>
                    </div>

                    {/* MANIFEST MODAL */}
                    <Modal
                        isOpen={manifestModalOpen}
                        onClose={() => setManifestModalOpen(false)}
                        title={`MANIFEST: ${selectedManifestPO?.poNumber || 'Unknown PO'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Expected Goods</p>
                                    <p className="text-xs text-gray-600">Please confirm the unload manifest.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-white">{selectedManifestPO?.lineItems?.length || 0}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Line Items</p>
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden mb-8 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">Item / SKU</th>
                                            <th className="px-4 py-2 text-[10px] text-gray-500 font-black uppercase tracking-widest text-right">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedManifestPO?.lineItems?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-2">
                                                    <p className="text-xs font-bold text-white">{item.productName}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{item.sku || 'NO SKU'}</p>
                                                </td>
                                                <td className="px-4 py-2 text-right text-xs font-mono font-bold text-blue-400">
                                                    {item.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setManifestModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmUnloadAndReceive}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    Confirm Unload & Receive
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* INBOUND LOGISTICS QUEUE */}
                    <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col shadow-2xl relative overflow-hidden lg:h-full">
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full" />

                        <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
                            <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                                {t('warehouse.docks.inboundQueue')}
                                <span className="h-1 w-1 rounded-full bg-gray-600" />
                                <span className="text-blue-400 font-mono">{inboundQueue.length.toString().padStart(2, '0')}</span>
                            </h3>
                            <div className="px-2 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{t('warehouse.sortingHigh')}</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 relative z-10 custom-scrollbar pr-2">
                            {inboundQueue.map(vessel => (
                                <div key={vessel.id} className={`group p-5 bg-black/40 rounded-3xl border transition-all duration-500 relative overflow-hidden shadow-lg ${selectedQueueVessel?.id === vessel.id ? 'border-blue-500 shadow-blue-500/20 bg-blue-500/5' : 'border-white/5 hover:border-blue-500/30'} `}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black text-white uppercase tracking-widest">{vessel.vesselName}</p>
                                                {vessel.priority === 'High' && <div className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] font-black rounded border border-yellow-500/20">{t('warehouse.priority')}</div>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-600/10 px-2 py-1 rounded-lg">ETA {vessel.eta}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedQueueVessel(selectedQueueVessel?.id === vessel.id ? null : vessel)}
                                        className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active: scale-[0.98] border ${selectedQueueVessel?.id === vessel.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-600/20'} `}
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
