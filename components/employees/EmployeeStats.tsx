import React from 'react';
import { User, Clock, ClipboardList, TrendingUp, ArrowRight } from 'lucide-react';
import { Employee, EmployeeTask } from '../../types';

interface StatCardProps {
   title: string;
   value: string | number;
   icon: React.ElementType;
   color: string;
   onClick?: () => void;
   active?: boolean;
}

const StatCard = ({ title, value, icon: Icon, color, onClick, active }: StatCardProps) => (
   <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white/80 dark:bg-[#18201B]/60 border rounded-2xl p-6 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/5 transition-all group ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${active ? 'border-[#2C5E3B] dark:border-[#A9CBA2] shadow-[0_4px_16px_rgba(44,94,59,0.1)] bg-white/5' : 'border-[#E2DCCE] dark:border-emerald-950/20'}`}
   >
      <div className="flex items-center justify-between z-10 relative">
         <div>
            <p className="text-[#4D6E56] dark:text-[#7A9E83] text-xs font-black uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-[#1E3F27] dark:text-white font-mono">{value}</h3>
            {onClick && (
               <div className={`flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-wider ${active ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-500 dark:text-gray-500 group-hover:text-[#2C5E3B] dark:group-hover:text-white'} transition-colors`}>
                  <span>{active ? 'Hide Queue' : 'View Queue'}</span>
                  <ArrowRight size={10} className={active ? '-rotate-90 transition-transform' : 'group-hover:translate-x-1 transition-transform'} />
               </div>
            )}
         </div>
         <div className={`p-3 rounded-xl bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 group-hover:scale-110 transition-transform ${color}`}>
            <Icon size={24} />
         </div>
      </div>
   </div>
);

interface EmployeeStatsProps {
   employees: Employee[];
   tasks: EmployeeTask[];
   isTaskQueueOpen: boolean;
   setIsTaskQueueOpen: (open: boolean) => void;
}

export default function EmployeeStats({ employees, tasks, isTaskQueueOpen, setIsTaskQueueOpen }: EmployeeStatsProps) {
   return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <StatCard title="Total Workforce" value={employees.length} icon={User} color="text-sky-700 dark:text-sky-400" />
         <StatCard title="Active Shift" value={Math.floor(employees.length * 0.7)} icon={Clock} color="text-emerald-700 dark:text-[#A9CBA2]" />
         <StatCard
            title="Pending Tasks"
            value={tasks.filter(t => t.status !== 'Completed').length}
            icon={ClipboardList}
            color="text-amber-700 dark:text-amber-400"
            onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
            active={isTaskQueueOpen}
         />
         <StatCard title="Avg Performance" value="88%" icon={TrendingUp} color="text-emerald-700 dark:text-[#A9CBA2]" />
      </div>
   );
}
