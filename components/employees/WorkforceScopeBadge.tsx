import React from 'react';
import { Employee } from '../../types';
import { resolveEmployeeScopeLevel } from '../../utils/roleSegregation';

export default function WorkforceScopeBadge({ employee }: { employee: Employee }) {
   const scopeLevel = employee.scopeLevel || resolveEmployeeScopeLevel(
      employee.role,
      employee.region_code || employee.regionCode
   );
   const isRegional = scopeLevel === 'REGIONAL';
   const label = isRegional ? 'Regional Staff' : 'HQ Staff';

   return (
      <span
         className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
            isRegional
               ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20'
               : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
         }`}
         title={isRegional ? 'Regional workforce scope' : 'Headquarters workforce scope'}
      >
         {label}
      </span>
   );
}
