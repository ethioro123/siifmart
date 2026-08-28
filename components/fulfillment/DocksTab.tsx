import React, { useState, useMemo } from 'react';
import { Upload, Download, Truck } from 'lucide-react';
import { WMSJob, User, Site, PurchaseOrder, Product } from '../../types';
import { DocksOutboundView } from './docks/DocksOutboundView';
import { DocksInboundView } from './docks/DocksInboundView';

interface DocksTabProps {
    orders: PurchaseOrder[];
    jobs: WMSJob[];
    sites: Site[];
    activeSite: Site | null;
    employees: User[];
    user: User | null;
    t: (key: string) => string;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    refreshData: () => Promise<void>;
    setActiveTab: (tab: any) => void;
    setReceivingPO: (po: PurchaseOrder) => void;
    purchaseOrdersService: any;
    wmsJobsService: any;
    logSystemEvent: (action: string, details: string, user: string, category: string) => void;
    generatePackLabelHTML: (data: any, options: any) => Promise<string>;
    formatJobId: (job: WMSJob) => string;
    formatDateTime: (date: string) => string;
    formatRelativeTime: (date: string) => string;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    completeJob: (jobId: string, employeeName: string) => Promise<any>;
    products: Product[];
}

export const DocksTab: React.FC<DocksTabProps> = ({
    orders,
    jobs,
    sites,
    activeSite,
    employees,
    user,
    t,
    addNotification,
    refreshData,
    setActiveTab,
    setReceivingPO,
    purchaseOrdersService,
    wmsJobsService,
    logSystemEvent,
    generatePackLabelHTML,
    formatJobId,
    formatDateTime,
    formatRelativeTime,
    setSelectedJob,
    setIsDetailsOpen,
    completeJob,
    products,
}) => {
    const [dockCategory, setDockCategory] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
    const [viewMode, setViewMode] = useState<'Process' | 'History'>('Process');

    // Inbound Dock State
    const [dockStatus, setDockStatus] = useState<Record<string, { status: 'Empty' | 'Occupied' | 'Maintenance'; assignedPoId?: string; vesselName?: string; eta?: string }>>({
        'D1': { status: 'Empty' },
        'D2': { status: 'Empty' },
        'D3': { status: 'Empty' },
        'D4': { status: 'Empty' },
        'D5': { status: 'Empty' },
        'D6': { status: 'Empty' },
    });
    const [selectedQueueVessel, setSelectedQueueVessel] = useState<any | null>(null);
    const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
    const [manifestModalOpen, setManifestModalOpen] = useState(false);
    const [selectedManifestPO, setSelectedManifestPO] = useState<PurchaseOrder | null>(null);

    const inboundQueue = useMemo(() => {
        return (orders || []).filter(o => 
            o.status === 'Approved' && 
            (o.lineItems || []).some(i => (i.quantity - (i.receivedQty || 0)) > 0)
        );
    }, [orders]);

    const assignVesselToDock = (dockId: string, vessel: any) => {
        setDockStatus(prev => ({
            ...prev,
            [dockId]: {
                status: 'Occupied',
                assignedPoId: vessel.id,
                vesselName: vessel.supplierName || vessel.poNumber || `PO #${vessel.id?.slice(-4)}`,
                eta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        }));
        setSelectedQueueVessel(null);
        addNotification('success', `Assigned ${vessel.poNumber || 'PO'} to Dock ${dockId}`);
    };

    const handleOpenManifest = (dockId: string) => {
        const dock = dockStatus[dockId];
        if (dock?.assignedPoId) {
            const po = orders.find(o => o.id === dock.assignedPoId);
            if (po) {
                setSelectedManifestPO(po);
                setSelectedDockId(dockId);
                setManifestModalOpen(true);
            }
        }
    };

    const quickConfirmUnload = (dockId: string) => {
        const dock = dockStatus[dockId];
        if (dock?.assignedPoId) {
            const po = orders.find(o => o.id === dock.assignedPoId);
            if (po) {
                setReceivingPO(po);
                setActiveTab('RECEIVE');
                setDockStatus(prev => ({ ...prev, [dockId]: { status: 'Empty' } }));
                addNotification('info', `Unloading ${po.poNumber || 'PO'} at Receiving Dock`);
            }
        }
    };

    const confirmUnloadAndReceive = async () => {
        if (selectedManifestPO) {
            setReceivingPO(selectedManifestPO);
            setActiveTab('RECEIVE');
            if (selectedDockId) {
                setDockStatus(prev => ({ ...prev, [selectedDockId]: { status: 'Empty' } }));
            }
            setManifestModalOpen(false);
            addNotification('info', `Switched to Receiving Terminal for ${selectedManifestPO.poNumber || 'PO'}`);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mx-4 md:mx-0">
                {/* DOCK CATEGORY SWITCHER (INBOUND / OUTBOUND) */}
                <div className="flex items-center gap-2 bg-stone-200/60 dark:bg-black/40 p-1 rounded-2xl border border-[#E2DCCE]/60 dark:border-white/5 shadow-xs">
                    <button
                        onClick={() => setDockCategory('INBOUND')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            dockCategory === 'INBOUND'
                                ? 'bg-[#2C5E3B] text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                        }`}
                    >
                        <Download size={14} />
                        <span>Inbound Receiving Docks</span>
                    </button>
                    <button
                        onClick={() => setDockCategory('OUTBOUND')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            dockCategory === 'OUTBOUND'
                                ? 'bg-[#2C5E3B] text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                        }`}
                    >
                        <Upload size={14} />
                        <span>Outbound Shipping Docks</span>
                    </button>
                </div>

                {/* VIEW MODE TOGGLE */}
                <div className="bg-stone-200/60 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl border border-[#E2DCCE]/60 dark:border-white/10 flex shadow-xs">
                    <button
                        onClick={() => setViewMode('Process')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'Process' ? 'bg-[#2C5E3B] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        Process
                    </button>
                    <button
                        onClick={() => setViewMode('History')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'History' ? 'bg-[#2C5E3B] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {dockCategory === 'INBOUND' ? (
                <DocksInboundView
                    dockStatus={dockStatus}
                    orders={orders}
                    inboundQueue={inboundQueue}
                    selectedQueueVessel={selectedQueueVessel}
                    setSelectedQueueVessel={setSelectedQueueVessel}
                    assignVesselToDock={assignVesselToDock}
                    setSelectedDockId={setSelectedDockId}
                    quickConfirmUnload={quickConfirmUnload}
                    handleOpenManifest={handleOpenManifest}
                    manifestModalOpen={manifestModalOpen}
                    setManifestModalOpen={setManifestModalOpen}
                    selectedManifestPO={selectedManifestPO}
                    confirmUnloadAndReceive={confirmUnloadAndReceive}
                    viewMode={viewMode}
                    t={t}
                />
            ) : (
                <DocksOutboundView
                    jobs={jobs}
                    sites={sites}
                    user={user}
                    activeSite={activeSite}
                    employees={employees}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                    formatJobId={formatJobId}
                    wmsJobsService={wmsJobsService}
                    refreshData={refreshData}
                    addNotification={addNotification}
                    generatePackLabelHTML={generatePackLabelHTML}
                    completeJob={completeJob}
                    viewMode={viewMode}
                    t={t}
                    products={products}
                />
            )}
        </div>
    );
};

