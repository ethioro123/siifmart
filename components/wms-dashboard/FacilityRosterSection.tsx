import React from 'react';
import { UserPlus } from 'lucide-react';
import SiteRoster from '../SiteRoster';
import RosterManager from '../RosterManager';
import DashboardLeaderboard from './DashboardLeaderboard';

interface FacilityRosterSectionProps {
  canOnboard: boolean;
  onOpenOnboardModal: () => void;
  siteLeaderboard: any[];
  activeSite: any;
  t: (key: string) => string;
}

export const FacilityRosterSection: React.FC<FacilityRosterSectionProps> = ({
  canOnboard,
  onOpenOnboardModal,
  siteLeaderboard,
  activeSite,
  t
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs">
          <SiteRoster layout="grid" limit={8} />

          {canOnboard && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onOpenOnboardModal}
                className="h-10 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <UserPlus size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Onboard Facility Staff</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs">
          <RosterManager />
        </div>
      </div>

      <DashboardLeaderboard
        siteLeaderboard={siteLeaderboard}
        activeSite={activeSite}
        t={t}
      />
    </div>
  );
};

export default FacilityRosterSection;
