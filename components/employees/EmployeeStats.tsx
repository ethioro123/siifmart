import React, { useMemo } from 'react';
import { User, Clock, ClipboardList, TrendingUp, ArrowRight } from 'lucide-react';
import { Employee, EmployeeTask, ShiftRecord } from '../../types';

interface StatCardProps {
   title: string;
   value: string | number;
   icon: React.ElementType;
   iconBg: string;
   iconColor: string;
   onClick?: () => void;
   active?: boolean;
}

const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, onClick, active }: StatCardProps) => (
   <div
      onClick={onClick}
      className={`relative bg-[var(--theme-bg-card)] border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between ${
         onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${
         active
            ? 'border-[var(--theme-border-focus)] dark:border-[var(--theme-border-focus)] shadow-[0_2px_12px_rgba(0,113,227,0.15)] ring-1 ring-[var(--theme-accent)]/20'
            : 'border-[var(--theme-border)] shadow-[var(--shadow-sm)] hover:border-[var(--theme-border-strong)]'
      }`}
   >
      <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
               <Icon size={16} />
            </div>
            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
               {title}
            </span>
         </div>
      </div>

      <div className="flex items-end justify-between">
         <h3 className="text-2xl sm:text-3xl font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight">
            {value}
         </h3>

         {onClick && (
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
               active
                  ? 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)]'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}>
               <span>{active ? 'Hide' : 'Queue'}</span>
               <ArrowRight size={12} className={active ? '-rotate-90 transition-transform' : 'transition-transform'} />
            </div>
         )}
      </div>
   </div>
);

interface EmployeeStatsProps {
   employees: Employee[];
   tasks: EmployeeTask[];
   shifts?: ShiftRecord[];
   onlineIds?: Set<string>;
   isTaskQueueOpen: boolean;
   setIsTaskQueueOpen: (open: boolean) => void;
}

export default function EmployeeStats({
   employees,
   tasks,
   shifts = [],
   onlineIds = new Set(),
   isTaskQueueOpen,
   setIsTaskQueueOpen
}: EmployeeStatsProps) {
   // Real active shifts calculation
   const activeShiftsCount = useMemo(() => {
      const openShifts = shifts.filter(s => (s.status as string) === 'Open' || (s.status as string) === 'open' || !s.endTime);
      if (openShifts.length > 0) return openShifts.length;
      return onlineIds.size;
   }, [shifts, onlineIds]);

   // Real calculated average performance score
   const avgPerformanceText = useMemo(() => {
      const rated = employees.filter(e => typeof e.performanceScore === 'number' && e.performanceScore > 0);
      if (rated.length > 0) {
         const avg = Math.round(rated.reduce((acc, e) => acc + (e.performanceScore || 0), 0) / rated.length);
         return `${avg}%`;
      }
      return employees.length > 0 ? 'N/A' : '0%';
   }, [employees]);

   return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
         <StatCard
            title="Workforce"
            value={employees.length.toLocaleString()}
            icon={User}
            iconBg="bg-[var(--theme-status-info-bg)]"
            iconColor="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]"
         />
         <StatCard
            title="Active Shift"
            value={activeShiftsCount.toLocaleString()}
            icon={Clock}
            iconBg="bg-[var(--theme-status-success-bg)]"
            iconColor="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]"
         />
         <StatCard
            title="Pending Tasks"
            value={tasks.filter(t => t.status !== 'Completed').length.toLocaleString()}
            icon={ClipboardList}
            iconBg="bg-[var(--theme-status-warning-bg)]"
            iconColor="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]"
            onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
            active={isTaskQueueOpen}
         />
         <StatCard
            title="Avg Score"
            value={avgPerformanceText}
            icon={TrendingUp}
            iconBg="bg-[var(--theme-accent-muted)]"
            iconColor="text-[var(--theme-accent)] text-[var(--theme-accent)]"
         />
      </div>
   );
}
