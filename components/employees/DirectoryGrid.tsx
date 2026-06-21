import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Employee } from '../../types';
import { SYSTEM_ROLES } from '../../utils/roles';

interface DirectoryGridProps {
   displayedEmployees: Employee[];
   isLoadingEmployees: boolean;
   sites: any[];
   setSelectedEmployee: (emp: Employee) => void;
}

export default function DirectoryGrid({ displayedEmployees, isLoadingEmployees, sites, setSelectedEmployee }: DirectoryGridProps) {
   if (isLoadingEmployees && displayedEmployees.length === 0) {
      return (
         <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-white/50" size={24} />
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
         {displayedEmployees.map((employee) => {
            const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || SYSTEM_ROLES[8];
            return (
               <div
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className="bg-white/80 dark:bg-[#18201B]/40 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/5 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-sm active:scale-[0.98]"
               >
                  <div className="flex items-start gap-4">
                     <div className="relative flex-shrink-0 select-none">
                        <img
                           src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=2C5E3B&color=ffffff&bold=true`}
                           className="w-12 h-12 rounded-full object-cover border border-[#E2DCCE] dark:border-white/10"
                           alt={employee.name}
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#131915] ${employee.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                     </div>

                     <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{employee.name}</h3>
                        <p className={`text-xs mt-0.5 font-semibold ${roleConfig.styles.text}`}>{roleConfig.label}</p>
                        <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-1.5 truncate font-medium">
                           {sites.find(s => s.id === employee.siteId)?.name || 'Unassigned'}
                        </p>
                     </div>
                  </div>
               </div>
            );
         })}

         {displayedEmployees.length === 0 && !isLoadingEmployees && (
            <div className="col-span-full flex justify-center py-16 text-center text-gray-500">
               <User size={32} className="mx-auto mb-3 opacity-30" />
               <p className="text-sm">No employees found</p>
            </div>
         )}
      </div>
   );
}
