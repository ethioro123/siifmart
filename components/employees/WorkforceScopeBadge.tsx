import React from 'react';
import { Employee } from '../../types';
import { isRegionalWorkforceRole, resolveEmployeeScopeLevel } from '../../utils/roleSegregation';

export default function WorkforceScopeBadge({ employee }: { employee: Employee }) {
   const isRegionalAdmin = isRegionalWorkforceRole(employee.role);
   const scopeLevel = employee.scopeLevel || resolveEmployeeScopeLevel(
      employee.role,
      employee.region_code || employee.regionCode
   );

   const label = isRegionalAdmin
      ? 'Regional Administration'
      : scopeLevel === 'HQ'
         ? 'HQ'
         : 'Operation Site';

   const styleClass = isRegionalAdmin
      ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20'
      : scopeLevel === 'HQ'
         ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
         : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';

   return (
      <span
         className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${styleClass}`}
         title={`Facility Tier: ${label}`}
      >
         {label}
      </span>
   );
}
