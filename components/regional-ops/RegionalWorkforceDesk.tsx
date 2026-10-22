import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, CheckCircle2, AlertCircle, ArrowRightLeft,
  Building2, UserCheck, ShieldCheck, Clock, UserPlus, RotateCcw, TrendingUp
} from 'lucide-react';
import type { Employee, Site } from '../../types';
import type { HeadcountQuotaRequest } from '../../types/employee';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { logger } from '../../utils/logger';
import { headcountQuotaService } from '../../services/headcountQuota.service';
import { RequestQuotaAdjustmentModal } from './RequestQuotaAdjustmentModal';
import { RegionalQuotaRequestList } from './RegionalQuotaRequestList';

interface RegionalWorkforceDeskProps {
  regionCode: string;
  regionalEmployees: Employee[];
  regionalSites: Site[];
  pendingCandidates: Employee[];
}

export const RegionalWorkforceDesk: React.FC<RegionalWorkforceDeskProps> = ({
  regionCode,
  regionalEmployees,
  regionalSites,
  pendingCandidates
}) => {
  const { user } = useStore();
  const { updateEmployee, addNotification, effectiveCountry } = useData();

  // Headcount Quota Surge State
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaRequests, setQuotaRequests] = useState<HeadcountQuotaRequest[]>([]);

  const loadQuotaRequests = useCallback(async () => {
    try {
      const data = await headcountQuotaService.getQuotaRequests(effectiveCountry || 'ET', regionCode);
      setQuotaRequests(data);
    } catch {
      // Fallback
    }
  }, [effectiveCountry, regionCode]);

  useEffect(() => {
    loadQuotaRequests();
  }, [loadQuotaRequests]);

  // Emergency Branch Redeployment State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [targetSiteId, setTargetSiteId] = useState<string>('');
  const [isRedeploying, setIsRedeploying] = useState(false);

  // Eligible frontline workers for emergency redeployment
  const eligibleFrontlineWorkers = regionalEmployees.filter(e =>
    ['cashier', 'picker', 'packer', 'stock_clerk', 'receiver', 'sales_associate'].includes(e.role) &&
    e.status === 'Active'
  );

  // 1st-Tier Candidate Certification
  const handleCertifyCandidate = async (candidate: Employee) => {
    try {
      const updated: Employee = {
        ...candidate,
        status: 'Active'
      };
      await updateEmployee(updated, user?.name || 'Regional Operations Manager');
      addNotification?.('success', `Candidate ${candidate.name} certified with 1st-tier regional endorsement.`);
    } catch (err: any) {
      logger.error('RegionalWorkforceDesk', 'Failed to certify candidate', err);
      addNotification?.('alert', err.message || 'Certification failed');
    }
  };

  // Currently Loaned Staff
  const currentlyLoanedWorkers = regionalEmployees.filter(e => e.isLoaned || e.is_loaned);

  // 1-Click Emergency Branch Loaning / Redeployment
  const handleRedeploy = async () => {
    if (!selectedEmployeeId || !targetSiteId) {
      addNotification?.('alert', 'Please select both an employee and a target branch.');
      return;
    }

    const emp = regionalEmployees.find(e => e.id === selectedEmployeeId);
    const targetSite = regionalSites.find(s => s.id === targetSiteId);
    if (!emp || !targetSite) return;

    if (emp.siteId === targetSiteId) {
      addNotification?.('alert', 'Employee is already stationed at this facility.');
      return;
    }

    setIsRedeploying(true);
    try {
      const originalHomeSiteId = emp.homeSiteId || emp.home_site_id || emp.siteId;
      const updated: Employee = {
        ...emp,
        homeSiteId: originalHomeSiteId,
        home_site_id: originalHomeSiteId,
        siteId: targetSite.id,
        isLoaned: true,
        is_loaned: true,
        loanedAt: new Date().toISOString(),
        loaned_at: new Date().toISOString()
      };
      await updateEmployee(updated, user?.name || 'Regional Operations Manager');
      addNotification?.('success', `Successfully loaned ${emp.name} to ${targetSite.name}.`);
      setSelectedEmployeeId('');
      setTargetSiteId('');
    } catch (err: any) {
      logger.error('RegionalWorkforceDesk', 'Emergency redeployment failed', err);
      addNotification?.('alert', err.message || 'Redeployment failed');
    } finally {
      setIsRedeploying(false);
    }
  };

  // Return to Home Station
  const handleReturnToHomeStation = async (emp: Employee) => {
    const homeSiteId = emp.homeSiteId || emp.home_site_id;
    if (!homeSiteId) {
      addNotification?.('alert', 'No home station recorded for this worker.');
      return;
    }

    const homeSite = regionalSites.find(s => s.id === homeSiteId);
    try {
      const updated: Employee = {
        ...emp,
        siteId: homeSiteId,
        isLoaned: false,
        is_loaned: false,
        homeSiteId: undefined,
        home_site_id: undefined,
        loanedAt: undefined,
        loaned_at: undefined
      };
      await updateEmployee(updated, user?.name || 'Regional Operations Manager');
      addNotification?.('success', `${emp.name} returned to home station (${homeSite?.name || 'Home Facility'}).`);
    } catch (err: any) {
      logger.error('RegionalWorkforceDesk', 'Failed to return loaned worker', err);
      addNotification?.('alert', err.message || 'Return failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
            Workforce Allocation & First-Tier Sign-Off
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            First-tier regional verification of frontline talent and 1-click emergency branch loaning within {regionCode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsQuotaModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Request Quota Surge</span>
        </button>
      </div>

      {/* Desk Section 1: Frontline Candidates First-Tier Certification */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[var(--theme-accent)]" />
            <span>Pending Frontline Talent Verification</span>
          </h4>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
            {pendingCandidates.length} Pending Sign-Off
          </span>
        </div>

        {pendingCandidates.length === 0 ? (
          <div className="p-6 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
            <UserCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60 mb-2" />
            <p className="text-xs text-[var(--theme-text-secondary)]">
              No frontline candidate drafts awaiting regional certification. All store talent rosters verified.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingCandidates.map(candidate => {
              const assignedSite = regionalSites.find(s => s.id === candidate.siteId);
              return (
                <div
                  key={candidate.id}
                  className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {candidate.name}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Drafted Candidate
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                      <span className="capitalize">{candidate.role.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{assignedSite?.name || 'Local Facility'}</span>
                      <span>•</span>
                      <span>{candidate.email || candidate.phone || 'No direct contact'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCertifyCandidate(candidate)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all self-end sm:self-center shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Regional 1st-Tier Endorsement</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desk Section 2: Emergency Branch Loaning / Redeployment */}
      <div className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[var(--theme-accent)]" />
            <span>Emergency Branch Loaning & Staff Redeployment</span>
          </h4>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Immediately redeploy front-line cashiers or warehouse pickers between overloaded branches in {regionCode}. Clocked hours and payroll automatically remain credited to their home station.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Worker Selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1">
              Select Frontline Worker
            </label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
            >
              <option value="">Choose worker to reassign...</option>
              {eligibleFrontlineWorkers.map(w => {
                const curSite = regionalSites.find(s => s.id === w.siteId);
                return (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role.replace(/_/g, ' ')}) @ {curSite?.name || 'Local Site'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Destination Branch */}
          <div>
            <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1">
              Target Branch Station
            </label>
            <select
              value={targetSiteId}
              onChange={e => setTargetSiteId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
            >
              <option value="">Choose destination facility...</option>
              {regionalSites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRedeploy}
          disabled={!selectedEmployeeId || !targetSiteId || isRedeploying}
          className="w-full py-2.5 px-4 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{isRedeploying ? 'Reassigning Workforce...' : 'Execute 1-Click Regional Branch Loan'}</span>
        </button>

        {/* Active Loaned Workers List */}
        {currentlyLoanedWorkers.length > 0 && (
          <div className="pt-4 border-t border-[var(--theme-border)]/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                Currently Loaned Workers ({currentlyLoanedWorkers.length})
              </span>
            </div>

            <div className="space-y-2">
              {currentlyLoanedWorkers.map(emp => {
                const homeSite = regionalSites.find(s => s.id === (emp.homeSiteId || emp.home_site_id));
                const currentSite = regionalSites.find(s => s.id === emp.siteId);

                return (
                  <div
                    key={emp.id}
                    className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--theme-text-primary)]">
                          {emp.name}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Loaned
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] mt-1 flex-wrap">
                        <span>Base: <strong className="text-[var(--theme-text-primary)]">{homeSite?.name || 'Home Station'}</strong></span>
                        <span>&rarr;</span>
                        <span>Station: <strong className="text-[var(--theme-text-primary)]">{currentSite?.name || 'Loaned Branch'}</strong></span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                          Payroll & Hours: Home Station
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReturnToHomeStation(emp)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--theme-bg-card)] hover:bg-[var(--theme-accent)] hover:text-white border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-all shadow-sm self-end sm:self-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return to Home Station</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Regional Quota Surge Requests Status */}
      <RegionalQuotaRequestList requests={quotaRequests} />

      {/* Request Quota Surge Modal */}
      <RequestQuotaAdjustmentModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        regionalSites={regionalSites}
        regionCode={regionCode}
        onSuccess={loadQuotaRequests}
      />
    </div>
  );
};
