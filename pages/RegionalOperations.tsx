import { ProductApprovalInboxCard } from '../components/approvals/ProductApprovalInboxCard';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, ArrowRightLeft, Truck, Users, ShieldAlert,
  Building2, ArrowLeft, Activity, DollarSign, CreditCard, Trophy
} from 'lucide-react';
import { useRegionalOperationsData } from '../hooks/useRegionalOperationsData';
import { useStore } from '../contexts/CentralStore';
import { formatCompactNumber } from '../utils/formatting';
import { getCountryProfile } from '../utils/localization';

// 5 Purpose-Built Regional Desks + Leaderboard + Strategic Decks
import { TerritoryFacilityGrid } from '../components/regional-ops/TerritoryFacilityGrid';
import { TerritoryLeaderboard } from '../components/regional-ops/TerritoryLeaderboard';
import { RegionalTransferDesk } from '../components/regional-ops/RegionalTransferDesk';
import { RegionalProcurementDesk } from '../components/regional-ops/RegionalProcurementDesk';
import { RegionalWorkforceDesk } from '../components/regional-ops/RegionalWorkforceDesk';
import { RegionalLPIncidentDeck } from '../components/regional-ops/RegionalLPIncidentDeck';
import { RegionalOperationalDigest } from '../components/regional-ops/RegionalOperationalDigest';
import { RegionalInventoryHealthDeck } from '../components/regional-ops/RegionalInventoryHealthDeck';
import { RegionalVelocityDeck } from '../components/regional-ops/RegionalVelocityDeck';

type RegionalDeskTab = 'facilities' | 'leaderboard' | 'transfers' | 'procurement' | 'workforce' | 'loss_prevention';

function getDefaultRegionalDeskTab(role?: string): RegionalDeskTab {
  switch (role) {
    case 'regional_hr_manager':
    case 'hr_generalist':
    case 'talent_recruiter':
    case 'training_coordinator':
      return 'workforce';
    case 'regional_procurement_manager':
    case 'vendor_relations_manager':
    case 'buyer':
      return 'procurement';
    case 'regional_logistics_manager':
    case 'regional_supply_chain_manager':
      return 'transfers';
    case 'regional_security_manager':
    case 'regional_compliance_manager':
    case 'store_operations_auditor':
      return 'loss_prevention';
    default:
      return 'facilities';
  }
}

export default function RegionalOperations() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<RegionalDeskTab>(() => getDefaultRegionalDeskTab(user?.role));

  const {
    regionCode,
    currentRegion,
    sovereignRegions,
    isAuditInspection,
    activeCountry,
    currencySymbol,
    regionalSites,
    siteCounts,
    regionalEmployees,
    regionalSales,
    regionalOrders,
    regionalTransfers,
    regionalShifts,
    inventoryMetrics,
    fulfillmentMetrics,
    sitePerformance,
    topProducts,
    metrics,
    pendingAutonomousPOs,
    pendingEscalatedPOs,
    pendingCandidateTalent,
    varianceShifts,
    discrepancyTransfers,
    overrideVelocityBreaches
  } = useRegionalOperationsData();

  const regionName = currentRegion?.name || regionCode || 'Territory';
  const countryName = getCountryProfile(activeCountry).name.split(' (')[0];

  return (
    <div className="space-y-6 w-full max-w-full p-2 sm:p-4 md:p-6 pb-24 animate-in fade-in duration-300">
      {/* Executive Inspection Banner (for CEO / Country Operations Director auditing the region) */}
      {isAuditInspection && (
        <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--theme-status-warning)] shrink-0" />
            <span className="text-xs text-[var(--theme-text-primary)] font-medium">
              Corporate HQ Audit Lens:
            </span>
            {sovereignRegions.length > 1 ? (
              <select
                value={regionCode}
                onChange={(e) => navigate(`/regional-ops?regionCode=${e.target.value}`)}
                aria-label="Select Region to Audit"
                className="min-h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                {sovereignRegions.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            ) : (
              <strong className="text-xs text-[var(--theme-text-primary)]">{regionName}</strong>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="min-h-11 flex items-center gap-1.5 px-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Central Operations</span>
          </button>
        </div>
      )}

      {/* Regional Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-accent)]">
              {regionCode}
            </span>
            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
              {countryName}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] mt-1.5">
            {regionName} Command
          </h1>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Tactical store/warehouse health, intra-regional stock balance, autonomous procurement & LP audit
          </p>
        </div>

        {/* Regional snapshot */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-xs">
            <Activity className="w-4 h-4 text-[var(--theme-accent)]" aria-hidden="true" />
            <span className="font-mono font-bold text-[var(--theme-text-primary)]">
              {metrics.openRegistersCount} Tills Open
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-xs">
            <Building2 className="w-4 h-4 text-[var(--theme-accent)]" />
            <span className="font-mono font-bold text-[var(--theme-text-primary)]">
              {regionalSites.length} Facilities
            </span>
          </div>
        </div>
      </div>

      <ProductApprovalInboxCard />

      {/* Autonomous Purchase Order Alert Banner */}
      {metrics.pendingAutonomousPOCount > 0 && (
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
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  SOP-MGT-020
                </span>
              </div>
              <p className="text-xs text-[var(--theme-text-primary)] font-medium mt-0.5">
                {metrics.pendingAutonomousPOCount} purchase order{metrics.pendingAutonomousPOCount > 1 ? 's' : ''} (&le; {formatCompactNumber(metrics.autonomousLimit, { currency: currencySymbol })}) submitted by territorial facilities await{metrics.pendingAutonomousPOCount === 1 ? 's' : ''} your autonomous sign-off.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('procurement')}
            className="min-h-11 px-4 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 self-end sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Review & Authorize ({metrics.pendingAutonomousPOCount})</span>
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
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
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
            onClick={() => setActiveTab('loss_prevention')}
            className="min-h-11 px-4 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 self-end sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit LP Incidents ({overrideVelocityBreaches.length})</span>
          </button>
        </div>
      )}

      {/* Macro Regional Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Today Sales */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Today Sales</span>
            <DollarSign className="w-4 h-4 text-[var(--theme-status-success)]" aria-hidden="true" />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--theme-text-primary)] mt-2">
            {formatCompactNumber(metrics.todaySalesTotal, { currency: currencySymbol })}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
            {metrics.todaySalesCount} Transactions
          </p>
        </div>

        {/* Monthly Procurement Spend */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Monthly PO Spend</span>
            <Truck className="w-4 h-4 text-[var(--theme-accent)]" />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--theme-text-primary)] mt-2 truncate">
            {formatCompactNumber(metrics.monthlySpent, { currency: currencySymbol })}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
            Cap: {formatCompactNumber(metrics.monthlyBudget, { currency: currencySymbol })}
          </p>
        </div>

        {/* Workforce */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Regional Staff</span>
            <Users className="w-4 h-4 text-[var(--theme-accent)]" aria-hidden="true" />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--theme-text-primary)] mt-2">
            {regionalEmployees.length}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
            {metrics.pendingCandidateCount} Pending Sign-Off
          </p>
        </div>

        {/* Risk & LP Incidents */}
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span>Flagged Incidents</span>
            <ShieldAlert className="w-4 h-4 text-[var(--theme-status-warning)]" aria-hidden="true" />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--theme-text-primary)] mt-2">
            {metrics.varianceShiftCount}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
            Till cash variances
          </p>
        </div>
      </div>

      {/* Tactical Operational Alert Digest (Scoped to Territory) */}
      <RegionalOperationalDigest
        lowStockCount={inventoryMetrics.lowStockCount}
        outOfStockCount={inventoryMetrics.outOfStockCount}
        pendingInboundShipments={fulfillmentMetrics.pendingInboundShipments}
        pendingPicks={fulfillmentMetrics.pendingPicks}
        inProgressPacks={fulfillmentMetrics.inProgressPacks}
        activeStaffCount={regionalEmployees.length}
        onSelectTab={(tab: RegionalDeskTab) => setActiveTab(tab)}
      />

      {/* 5 Desks Navigation Tabs */}
      <div role="group" aria-label="Regional operations desks" className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-x-auto custom-scrollbar">
        <button
          type="button"
          aria-pressed={activeTab === 'facilities'}
          aria-controls="regional-desk-panel"
          onClick={() => setActiveTab('facilities')}
          className={`min-h-11 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
            activeTab === 'facilities'
              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Facility Grid ({siteCounts.total})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'leaderboard'}
          aria-controls="regional-desk-panel"
          onClick={() => setActiveTab('leaderboard')}
          className={`min-h-11 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
            activeTab === 'leaderboard'
              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Leaderboard</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'transfers'}
          aria-controls="regional-desk-panel"
          onClick={() => setActiveTab('transfers')}
          className={`min-h-11 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
            activeTab === 'transfers'
              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Stock Dispatcher</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'procurement'}
          aria-controls="regional-desk-panel"
          onClick={() => setActiveTab('procurement')}
          className={`min-h-11 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
            activeTab === 'procurement'
              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Autonomous POs ({metrics.pendingAutonomousPOCount})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'workforce'}
          aria-controls="regional-desk-panel"
          onClick={() => setActiveTab('workforce')}
          className={`min-h-11 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
            activeTab === 'workforce'
              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Workforce Allocation ({metrics.pendingCandidateCount})</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'loss_prevention'}
          aria-controls="regional-desk-panel"
          onClick={() => setActiveTab('loss_prevention')}
          className={`min-h-11 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
            activeTab === 'loss_prevention'
              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Loss Prevention ({metrics.varianceShiftCount})</span>
        </button>
      </div>

      {/* Desk Content */}
      <div id="regional-desk-panel" className="pt-2">
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <RegionalInventoryHealthDeck
              totalValue={inventoryMetrics.totalValue}
              lowStockCount={inventoryMetrics.lowStockCount}
              outOfStockCount={inventoryMetrics.outOfStockCount}
              optimalStockCount={inventoryMetrics.optimalStockCount}
              totalSKUs={inventoryMetrics.totalSKUs}
              currencySymbol={currencySymbol}
              onOpenTransfers={() => setActiveTab('transfers')}
              onOpenProcurement={() => setActiveTab('procurement')}
            />
            <RegionalVelocityDeck
              sitePerformance={sitePerformance}
              topProducts={topProducts}
              currencySymbol={currencySymbol}
            />
            <TerritoryFacilityGrid
              sites={regionalSites}
              shifts={regionalShifts}
              sales={regionalSales}
              currencySymbol={currencySymbol}
            />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <TerritoryLeaderboard
            regionCode={regionCode}
            sites={regionalSites}
            sales={regionalSales}
            shifts={regionalShifts}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'transfers' && (
          <RegionalTransferDesk
            regionCode={regionCode}
            regionalSites={regionalSites}
            regionalEmployees={regionalEmployees}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'procurement' && (
          <RegionalProcurementDesk
            currentRegion={currentRegion}
            pendingAutonomousPOs={pendingAutonomousPOs}
            pendingEscalatedPOs={pendingEscalatedPOs}
            monthlySpent={metrics.monthlySpent}
            monthlyBudget={metrics.monthlyBudget}
            budgetPercent={metrics.budgetPercent}
            isOverBudget={metrics.isOverBudget}
            isNearCap={metrics.isNearCap}
            autonomousLimit={metrics.autonomousLimit}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'workforce' && (
          <RegionalWorkforceDesk
            regionCode={regionCode}
            regionalEmployees={regionalEmployees}
            regionalSites={regionalSites}
            pendingCandidates={pendingCandidateTalent}
          />
        )}

        {activeTab === 'loss_prevention' && (
          <RegionalLPIncidentDeck
            regionCode={regionCode}
            regionalSites={regionalSites}
            varianceShifts={varianceShifts}
            discrepancyTransfers={discrepancyTransfers}
            currencySymbol={currencySymbol}
            overrideVelocityBreaches={overrideVelocityBreaches}
          />
        )}
      </div>
    </div>
  );
}
