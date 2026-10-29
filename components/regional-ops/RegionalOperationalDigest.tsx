import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Truck, ShoppingCart, Users, ArrowRight, AlertTriangle
} from 'lucide-react';

interface RegionalOperationalDigestProps {
  lowStockCount: number;
  outOfStockCount: number;
  pendingInboundShipments: number;
  pendingPicks: number;
  inProgressPacks: number;
  activeStaffCount: number;
  onSelectTab: (tab: any) => void;
}

export const RegionalOperationalDigest: React.FC<RegionalOperationalDigestProps> = ({
  lowStockCount,
  outOfStockCount,
  pendingInboundShipments,
  pendingPicks,
  inProgressPacks,
  activeStaffCount,
  onSelectTab
}) => {
  const navigate = useNavigate();
  const totalStockAlerts = lowStockCount + outOfStockCount;

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
            <AlertTriangle className="text-[var(--theme-status-warning-text)] w-4 h-4" />
            <span>Territory Operational Alert Digest</span>
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Real-time branch alerts, freight arrivals, and active warehouse workloads in this region
          </p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)] animate-pulse" />
          <span>Regional Pulse</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Regional Inventory Stockout Alert */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              totalStockAlerts > 0
                ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
            }`}>
              <Box size={16} />
            </div>
            <div>
              <p className={`text-xs font-bold ${
                totalStockAlerts > 0 ? 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-text-primary)]'
              }`}>
                {totalStockAlerts} Stock Alerts
              </p>
              <p className="text-[11px] text-[var(--theme-text-secondary)]">
                {outOfStockCount} critical out-of-stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('transfers')}
            className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
            title="Balance stock via transfer desk"
          >
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 2. Inbound Freight Arriving */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
              <Truck size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                {pendingInboundShipments} Inbound Shipments
              </p>
              <p className="text-[11px] text-[var(--theme-text-secondary)]">
                Awaiting dock receiving & QC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('procurement')}
            className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
            title="Inspect autonomous POs"
          >
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 3. Regional Warehouse Fulfillment Pipeline */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]">
              <ShoppingCart size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]">
                {pendingPicks} Picks · {inProgressPacks} Packs
              </p>
              <p className="text-[11px] text-[var(--theme-text-secondary)]">
                Active regional packing lines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/fulfillment')}
            className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
            title="Open fulfillment dashboard"
          >
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 4. Territorial Workforce Allocation */}
        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Users size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--theme-text-primary)]">
                {activeStaffCount} Staff Enrolled
              </p>
              <p className="text-[11px] text-[var(--theme-text-secondary)]">
                Active roster & shift assignments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('workforce')}
            className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
            title="Manage workforce allocations"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
