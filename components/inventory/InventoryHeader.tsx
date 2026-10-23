import React from 'react';
import { Plus, Printer, Layout, ClipboardList, Map, TrendingUp, Barcode, Clock, Shield } from 'lucide-react';
import { ProtectedButton } from '../Protected';
import Button from '../shared/Button';

export type InventoryTab = 'overview' | 'stock' | 'zones' | 'movements' | 'pending' | 'barcode_audit';

interface InventoryHeaderProps {
    isReadOnly: boolean;
    canCreateProduct?: boolean;
    handleOpenAddProduct: () => void;
    setIsPrintHubOpen: (val: boolean) => void;
    setLabelsToPrint: (val: any[]) => void;
    activeTab: InventoryTab;
    setActiveTab: (tab: InventoryTab) => void;
    hasViewedBarcodeAudit: boolean;
    barcodeApprovalsCount: number;
    pendingCount: number;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
    isReadOnly, canCreateProduct = false,
    handleOpenAddProduct,
    setIsPrintHubOpen,
    setLabelsToPrint,
    activeTab,
    setActiveTab,
    hasViewedBarcodeAudit,
    barcodeApprovalsCount,
    pendingCount
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
                                ? "bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]"
                                : "bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isReadOnly ? "bg-[var(--theme-status-warning)]" : "bg-[var(--theme-status-success)]"}`} />
                            {isReadOnly ? 'Read-Only Mode' : 'Live Management Mode'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canCreateProduct && <ProtectedButton
                        permission="ADD_PRODUCT"
                        onClick={handleOpenAddProduct}
                        disabled={isReadOnly}
                        className="min-h-11 px-4 rounded-xl bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] hover:opacity-90 font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        <Plus size={16} />
                        Add Product
                    </ProtectedButton>}
                    <Button
                        onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }}
                        variant="secondary"
                        icon={<Printer size={16} />}
                        className="min-h-11 px-4 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        Print Hub
                    </Button>
                </div>
            </div>

            {/* --- TABS (Apple Segmented Control Dock) --- */}
            <div role="group" aria-label="Inventory sections" className="p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] inline-flex items-center gap-1 overflow-x-auto max-w-full scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: Layout },
                    { id: 'stock', label: 'Stock List', icon: ClipboardList },
                    { id: 'zones', label: 'Zones', icon: Map },
                    { id: 'movements', label: 'Movements', icon: TrendingUp },
                    { id: 'barcode_audit', label: 'Barcode Audit', icon: Barcode, count: hasViewedBarcodeAudit ? 0 : barcodeApprovalsCount },
                    { id: 'pending', label: 'Stock Reviews', icon: Clock, count: pendingCount }
                ].map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setActiveTab(tab.id as InventoryTab)}
                            className={`min-h-11 flex items-center gap-2 border border-transparent px-3.5 py-2 rounded-lg text-xs transition-colors relative cursor-pointer whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                isSelected
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border-[var(--theme-border)] font-semibold'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium'
                            }`}
                        >
                            <tab.icon size={14} className={isSelected ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[11px] font-semibold font-mono tabular-nums bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
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
