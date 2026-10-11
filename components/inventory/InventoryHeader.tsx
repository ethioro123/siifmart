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
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                        Inventory Command
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            isReadOnly
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isReadOnly ? "bg-amber-500" : "bg-emerald-500"}`} />
                            {isReadOnly ? 'Read-Only Mode' : 'Live Management Mode'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ProtectedButton
                        permission="ADD_PRODUCT"
                        onClick={handleOpenAddProduct}
                        disabled={isReadOnly}
                        className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent)]/90 font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        Add Product
                    </ProtectedButton>
                    <Button
                        onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }}
                        variant="secondary"
                        icon={<Printer size={16} />}
                        className="h-10 px-4 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
                    >
                        Print Hub
                    </Button>
                </div>
            </div>

            {/* --- TABS (Apple Segmented Control Dock) --- */}
            <div className="p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] inline-flex items-center gap-1 overflow-x-auto max-w-full scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: Layout },
                    { id: 'stock', label: 'Stock List', icon: ClipboardList },
                    { id: 'zones', label: 'Zones', icon: Map },
                    { id: 'movements', label: 'Movements', icon: TrendingUp },
                    { id: 'barcode_audit', label: 'Barcode Audit', icon: Barcode, count: hasViewedBarcodeAudit ? 0 : barcodeApprovalsCount },
                    { id: 'pending', label: 'Pending', icon: Clock, count: pendingCount }
                ].map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveTab(tab.id as InventoryTab)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all relative cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                                isSelected
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium'
                            }`}
                        >
                            <tab.icon size={14} className={isSelected ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[11px] font-semibold font-mono tabular-nums ${
                                    isSelected
                                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                                        : 'bg-rose-500 text-white'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
