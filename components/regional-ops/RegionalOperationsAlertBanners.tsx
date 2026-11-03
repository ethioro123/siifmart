import React from 'react';
import { Truck, ShieldAlert } from 'lucide-react';
import type { OverrideVelocityBreach } from '../../hooks/useRegionalOperationsData';
import { formatCompactNumber } from '../../utils/formatting';

interface RegionalOperationsAlertBannersProps {
  pendingAutonomousPOCount: number;
  autonomousLimit: number;
  currencySymbol: string;
  onOpenProcurement: () => void;
  overrideVelocityBreaches: OverrideVelocityBreach[];
  onAuditLPIncidents: () => void;
}

export function RegionalOperationsAlertBanners({
  pendingAutonomousPOCount,
  autonomousLimit,
  currencySymbol,
  onOpenProcurement,
  overrideVelocityBreaches,
  onAuditLPIncidents,
}: RegionalOperationsAlertBannersProps) {
  return (
    <div className="space-y-3">
      {/* Autonomous Purchase Order Alert Banner */}
      {pendingAutonomousPOCount > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--theme-status-warning-text)] uppercase tracking-wide">
                  Autonomous Purchase Order Authorization
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                  SOP-MGT-020
                </span>
              </div>
              <p className="text-xs text-[var(--theme-text-primary)] font-medium mt-0.5">
                {pendingAutonomousPOCount} purchase order{pendingAutonomousPOCount > 1 ? 's' : ''} (&le; {formatCompactNumber(autonomousLimit, { currency: currencySymbol })}) submitted by territorial facilities await{pendingAutonomousPOCount === 1 ? 's' : ''} your autonomous sign-off.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProcurement}
            className="min-h-11 px-4 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 self-end sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Review & Authorize ({pendingAutonomousPOCount})</span>
          </button>
        </div>
      )}

      {/* 24-Hour Managerial Override Velocity Breach Warning Banner (SOP-MGT-020) */}
      {overrideVelocityBreaches.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--theme-status-danger-text)] uppercase tracking-wide">
                  Managerial Override Velocity Breach (24h Window)
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                  SOP-MGT-020
                </span>
              </div>
              <p className="text-xs text-[var(--theme-text-primary)] font-medium mt-0.5">
                {overrideVelocityBreaches.map(b => `${b.siteName} (${b.managerName}) at ${b.velocityRate}%`).join(', ')} exceeded the 3.0% supervisory override limit. Immediate Loss Prevention audit required.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAuditLPIncidents}
            className="min-h-11 px-4 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 self-end sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)] cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit LP Incidents ({overrideVelocityBreaches.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}
