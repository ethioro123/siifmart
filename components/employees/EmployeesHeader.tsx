import React from 'react';
import { 
   Briefcase, User, Network, Calendar, UserPlus, 
   Lock, Shield, AlertTriangle, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { Protected } from '../Protected';

export type ViewMode = 'directory' | 'recruitment' | 'disciplinary' | 'access-audit' | 'org' | 'shifts';

interface EmployeesHeaderProps {
   viewMode: ViewMode;
   setViewMode: (mode: ViewMode) => void;
   canViewAll: boolean;
   canOnboard: boolean;
   onOpenWizard: () => void;
   userRole?: string;
   pendingSignOffsCount: number;
   onOpenSignOffQueue: () => void;
}

export const EmployeesHeader: React.FC<EmployeesHeaderProps> = ({
   viewMode,
   setViewMode,
   canViewAll,
   canOnboard,
   onOpenWizard,
   userRole,
   pendingSignOffsCount,
   onOpenSignOffQueue
}) => {
   const isChecker = [
      'head_of_hr',
      'regional_hr_manager',
      'hr',
      'head_of_operations',
      'regional_operations_manager',
      'country_managing_director',
      'admin',
      'super_admin', 
      'CEO',
      'ceo'
   ].includes(userRole || '');

   return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         {/* Title & Icon */}
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
               <Briefcase size={20} aria-hidden="true" />
            </div>
            <div>
               <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                     Human Capital Management
                  </h2>
                  {isChecker ? (
                     <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                        Checker • Supervisory Sign-Off Authority
                     </span>
                  ) : (
                     <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                        Maker • Operational Staff
                     </span>
                  )}
               </div>
               <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] font-normal mt-0.5">
                  Orchestrate workforce, draft contracts & payroll, track performance, and govern shift allocations.
               </p>
            </div>
         </div>

         {/* Navigation Tabs, Maker-Checker Badge & Action */}
         <div className="flex items-center gap-3 flex-wrap">
            {/* Apple Segmented Control for Navigation Tabs */}
            <div role="group" aria-label="Employee sections" className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center gap-1 overflow-x-auto max-w-full select-none">
               {[ 
                  { id: 'directory', icon: User, label: 'Directory' }, 
                  ...(canViewAll ? [
                     { id: 'recruitment', icon: Briefcase, label: 'Recruitment' },
                     { id: 'disciplinary', icon: AlertTriangle, label: 'Disciplinary' },
                     { id: 'access-audit', icon: Shield, label: 'Access Review' }
                  ] : []),
                  { id: 'org', icon: Network, label: 'Org Chart' }, 
                  { id: 'shifts', icon: Calendar, label: 'Shift Planner' } 
               ].map(v => {
                  const isActive = viewMode === v.id;
                  return (
                     <button
                        key={v.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setViewMode(v.id as ViewMode)}
                        className={`min-h-11 px-3 rounded-lg text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                           isActive
                              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-medium'
                        }`}
                     >
                        <v.icon size={14} aria-hidden="true" />
                        <span>{v.label}</span>
                     </button>
                  );
               })}
            </div>

            {/* Maker-Checker Status Badge */}
            {isChecker ? (
               <button
                  type="button"
                  onClick={onOpenSignOffQueue}
                  className="min-h-11 px-3.5 rounded-xl bg-[var(--theme-status-warning-bg)] hover:opacity-90 border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] font-semibold text-xs flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-warning)]"
                  title="View pending supervisory sign-offs"
               >
                  <ShieldCheck size={15} />
                  <span>{pendingSignOffsCount} Pending Sign-Offs</span>
               </button>
            ) : (
               <div className="min-h-11 px-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-xs font-medium flex items-center gap-2 select-none">
                  <CheckCircle2 size={14} className="text-[var(--theme-accent)]" aria-hidden="true" />
                  <span>{pendingSignOffsCount} In Review</span>
               </div>
            )}

            {/* Onboard Action */}
            {canOnboard ? (
               <Protected permission="ADD_EMPLOYEE">
                  <button
                     type="button"
                     onClick={onOpenWizard}
                     className="min-h-11 px-4 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                     <UserPlus size={15} />
                     <span>Onboard Talent</span>
                  </button>
               </Protected>
            ) : (
               <div className="min-h-11 px-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-xs font-medium flex items-center gap-1.5 select-none">
                  <Lock size={13} />
                  <span>{canViewAll ? 'Hiring Restricted' : 'My HR Profile'}</span>
               </div>
            )}
         </div>
      </div>
   );
};
