import React from 'react';
import { Plus, Printer, Layout, ClipboardList, Map, TrendingUp, Barcode, Clock, Shield } from 'lucide-react';
import { ProtectedButton } from '../Protected';
import Button from '../shared/Button';

export type InventoryTab = 'overview' | 'stock' | 'zones' | 'movements' | 'pending' | 'barcode_audit';

interface InventoryHeaderProps {
    isReadOnly: boolean;
    handleOpenAddProduct: () => void;
    setIsPrintHubOpen: (val: boolean) => void;
    setLabelsToPrint: (val: any[]) => void;
    activeTab: InventoryTab;
    setActiveTab: (tab: InventoryTab) => void;
    hasViewedBarcodeAudit: boolean;
    barcodeApprovalsCount: number;
    pendingCount: number;
    theme: string;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
    isReadOnly,
    handleOpenAddProduct,
    setIsPrintHubOpen,
    setLabelsToPrint,
    activeTab,
    setActiveTab,
    hasViewedBarcodeAudit,
    barcodeApprovalsCount,
    pendingCount,
    theme
}) => {
    return (
        <div className="flex-none p-4 sm:p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#2C5E3B] to-amber-600 dark:from-[#A9CBA2] dark:to-[#DFD5C6] drop-shadow-sm">
                        Inventory Command
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-2 text-sm">
                        <Shield size={14} className={isReadOnly ? "text-amber-500" : "text-green-500"} />
                        {isReadOnly ? 'Read-Only Mode' : 'Live Management Mode'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ProtectedButton
                        permission="ADD_PRODUCT"
                        onClick={handleOpenAddProduct}
                        disabled={isReadOnly}
                        className="woody-btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Product
                    </ProtectedButton>
                    <Button
                        onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }}
                        variant="secondary"
                        icon={<Printer size={18} />}
                        className="woody-btn-secondary flex items-center gap-2"
                    >
                        Print Hub
                    </Button>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: Layout },
                    { id: 'stock', label: 'Stock List', icon: ClipboardList },
                    { id: 'zones', label: 'Zones', icon: Map },
                    { id: 'movements', label: 'Movements', icon: TrendingUp },
                    { id: 'barcode_audit', label: 'Barcode Audit', icon: Barcode, count: hasViewedBarcodeAudit ? 0 : barcodeApprovalsCount },
                    { id: 'pending', label: 'Pending', icon: Clock, count: pendingCount }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as InventoryTab)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id
                            ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105'
                            : 'bg-white/90 dark:bg-black/25 text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white border border-[#E2DCCE] dark:border-emerald-950/20'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold border ${activeTab === tab.id
                                ? (theme === 'dark' ? 'bg-black text-[#A9CBA2] border-black' : 'bg-white text-[#2C5E3B] border-white')
                                : 'bg-red-500 text-white border-red-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
