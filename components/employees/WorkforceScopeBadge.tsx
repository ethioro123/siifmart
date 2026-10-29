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
      ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border-[var(--theme-border-accent)]'
      : scopeLevel === 'HQ'
         ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
         : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]';

   return (
      <span
         className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${styleClass}`}
         title={`Facility Tier: ${label}`}
      >
         {label}
      </span>
   );
}
