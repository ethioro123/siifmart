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
                    <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--theme-text-primary)]">
                        Inventory Command
                    </h1>
                    <p className="text-[var(--theme-text-secondary)] font-medium mt-1 flex items-center gap-2 text-sm">
                        <Shield size={14} className={isReadOnly ? "text-amber-500" : "text-emerald-500"} />
                        {isReadOnly ? 'Read-Only Mode' : 'Live Management Mode'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ProtectedButton
                        permission="ADD_PRODUCT"
                        onClick={handleOpenAddProduct}
                        disabled={isReadOnly}
                        className="px-5 py-2.5 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Add Product
                    </ProtectedButton>
                    <Button
                        onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }}
                        variant="secondary"
                        icon={<Printer size={18} />}
                        className="px-5 py-2.5 rounded-full bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-semibold text-sm hover:bg-[var(--theme-bg-card-hover)] active:scale-[0.98] transition-all duration-150 flex items-center gap-2 shadow-sm cursor-pointer"
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
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 relative cursor-pointer active:scale-[0.98] ${activeTab === tab.id
                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${activeTab === tab.id
                                ? 'bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                : 'bg-rose-500 text-white'
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
