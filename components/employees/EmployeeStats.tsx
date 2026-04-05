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
      className={`relative overflow-hidden bg-black/40 border rounded-2xl p-6 hover:bg-white/5 transition-all group ${onClick ? 'cursor-pointer' : ''} ${active ? 'border-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.15)] bg-white/5' : 'border-white/10'}`}
   >
      <div className="flex items-center justify-between z-10 relative">
         <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white font-mono">{value}</h3>
            {onClick && (
               <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider ${active ? 'text-cyber-primary' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                  <span>{active ? 'Hide Queue' : 'View Queue'}</span>
                  <ArrowRight size={10} className={active ? '-rotate-90 transition-transform' : 'group-hover:translate-x-1 transition-transform'} />
               </div>
            )}
         </div>
         <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${color}`}>
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
         <StatCard title="Total Workforce" value={employees.length} icon={User} color="text-blue-400" />
         <StatCard title="Active Shift" value={Math.floor(employees.length * 0.7)} icon={Clock} color="text-green-400" />
         <StatCard
            title="Pending Tasks"
            value={tasks.filter(t => t.status !== 'Completed').length}
            icon={ClipboardList}
            color="text-yellow-400"
            onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
            active={isTaskQueueOpen}
         />
         <StatCard title="Avg Performance" value="88%" icon={TrendingUp} color="text-cyber-primary" />
      </div>
   );
}
