import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Employee } from '../../types';
import { SYSTEM_ROLES, canViewLocation } from '../../utils/roles';

interface DirectoryGridProps {
   displayedEmployees: Employee[];
   isLoadingEmployees: boolean;
   sites: any[];
   setSelectedEmployee: (emp: Employee) => void;
   currentUser?: any;
}

export default function DirectoryGrid({ displayedEmployees, isLoadingEmployees, sites, setSelectedEmployee, currentUser }: DirectoryGridProps) {
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
            const isOwn = currentUser?.id === employee.id;
            const canSeeLocation = canViewLocation(currentUser?.role, employee.role, isOwn);
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
                        {(() => {
                           const loggedInToday = employee.lastLoginAt && (() => {
                              const date = new Date(employee.lastLoginAt);
                              const today = new Date();
                              return date.getDate() === today.getDate() &&
                                 date.getMonth() === today.getMonth() &&
                                 date.getFullYear() === today.getFullYear();
                           })();
                           const isOnlineAndActive = employee.status === 'Active' && loggedInToday;
                           return (
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#131915] ${isOnlineAndActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                           );
                        })()}
                     </div>

                     <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{employee.name}</h3>
                        <p className={`text-xs mt-0.5 font-semibold ${roleConfig.styles.text}`}>{roleConfig.label}</p>
                        <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-1.5 truncate font-medium">
                           {sites.find(s => s.id === employee.siteId)?.name || 'Unassigned'}
                        </p>
                        {canSeeLocation && employee.lastLoginGps ? (
                           <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5 truncate" title={employee.lastLoginGps}>
                              📍 {employee.lastLoginGps.replace('GPS: ', '')}
                           </p>
                        ) : employee.lastLoginGps ? (
                           <p className="text-[10px] text-stone-300 dark:text-stone-600 italic mt-0.5 truncate select-none" title="Location is hidden due to hierarchy permissions">
                              📍 Protected
                           </p>
                        ) : null}
                        {employee.lastLoginAt && (
                           (() => {
                              const date = new Date(employee.lastLoginAt);
                              const today = new Date();
                              const loggedInToday = date.getDate() === today.getDate() &&
                                 date.getMonth() === today.getMonth() &&
                                 date.getFullYear() === today.getFullYear();
                              
                              return loggedInToday ? (
                                 <div className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 mt-1.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 w-fit">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    Logged In Today
                                 </div>
                              ) : null;
                           })()
                        )}
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
