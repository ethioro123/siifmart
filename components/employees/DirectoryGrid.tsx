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
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-xl p-5 cursor-pointer transition-all duration-200"
               >
                  <div className="flex items-start gap-4">
                     <div className="relative flex-shrink-0">
                        <img
                           src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=1a1a1a&color=ffffff&bold=true`}
                           className="w-12 h-12 rounded-full object-cover"
                           alt={employee.name}
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${employee.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                     </div>

                     <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{employee.name}</h3>
                        <p className={`text-xs mt-0.5 ${roleConfig.styles.text}`}>{roleConfig.label}</p>
                        <p className="text-[11px] text-gray-500 mt-1 truncate">
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
