import React from 'react';
import { Loader2, User } from 'lucide-react';
import { Employee, Site, UserRole } from '../../types';
import { SYSTEM_ROLES } from '../../utils/roles';
import EmployeeRow from '../EmployeeRow';

interface DirectoryListProps {
   displayedEmployees: Employee[];
   isLoadingEmployees: boolean;
   sites: Site[];
   setSelectedEmployee: (emp: Employee) => void;
   canViewAll: boolean;
   currentUser?: { id?: string; role?: UserRole; siteId?: string } | null;
}

export default function DirectoryList({
   displayedEmployees,
   isLoadingEmployees,
   sites,
   setSelectedEmployee,
   canViewAll,
   currentUser
}: DirectoryListProps) {
   return (
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl isolate overflow-hidden shadow-[var(--shadow-sm)]">
         <div className="divide-y divide-[var(--theme-border-subtle)]">
            {isLoadingEmployees && (
               <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-[var(--theme-text-muted)]" size={24} />
               </div>
            )}

            {displayedEmployees.length > 0 ? (
               displayedEmployees.map((employee) => {
                  const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || {
                     id: employee.role,
                     label: employee.role?.replace(/_/g, ' ') || 'Staff',
                     desc: 'Team Member',
                     level: 4,
                     styles: { text: 'text-[var(--theme-text-muted)]', bg: 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_10%,transparent)]', border: 'border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]', badge: 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_20%,transparent)] text-[var(--theme-text-muted)]' }
                  };
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
                        currentUser={currentUser}
                     />
                  );
               })
            ) : (
               <div className="px-6 py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mx-auto mb-3">
                     <User size={22} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                     {canViewAll ? "No employees found" : "Profile not found"}
                  </p>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                     Try adjusting your search query or filters.
                  </p>
               </div>
            )}
         </div>
      </div>
   );
}
