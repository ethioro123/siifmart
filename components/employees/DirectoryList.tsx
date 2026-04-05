import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Employee } from '../../types';
import { SYSTEM_ROLES } from '../../utils/roles';
import EmployeeRow from '../EmployeeRow';

interface DirectoryListProps {
   displayedEmployees: Employee[];
   isLoadingEmployees: boolean;
   sites: any[];
   setSelectedEmployee: (emp: Employee) => void;
   canViewAll: boolean;
}

export default function DirectoryList({ displayedEmployees, isLoadingEmployees, sites, setSelectedEmployee, canViewAll }: DirectoryListProps) {
   return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
         <div className="divide-y divide-white/[0.04]">
            {isLoadingEmployees && (
               <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-white/50" size={24} />
               </div>
            )}

            {displayedEmployees.length > 0 ? (
               displayedEmployees.map((employee) => {
                  const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || SYSTEM_ROLES[8];
                  return (
                     <EmployeeRow
                        key={employee.id}
                        employee={employee}
                        sites={sites}
                        roleConfig={roleConfig}
                        pendingTasks={0}
                        onSelect={() => setSelectedEmployee(employee)}
                        onMessage={() => setSelectedEmployee(employee)}
                        canResetPassword={false}
                        canDelete={false}
                        canApprove={false}
                        isSuperAdmin={false}
                     />
                  );
               })
            ) : (
               <div className="px-6 py-16 text-center text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                     <User size={32} className="opacity-50" />
                  </div>
                  <p className="text-lg font-medium">{canViewAll ? "No employees found." : "Profile not found."}</p>
               </div>
            )}
         </div>
      </div>
   );
}
