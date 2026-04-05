import React from 'react';
import { Building, Store } from 'lucide-react';

interface LocationBadgeProps {
   user: any;
   sites: any[];
   employees: any[];
   activeSite: any;
}

export function LocationBadge({ user, sites, employees, activeSite }: LocationBadgeProps) {
   // Find current user's employee record
   let currentEmployee = null;

   if (user && employees.length > 0) {
      if (user.employeeId) {
         currentEmployee = employees.find(emp => emp.id === user.employeeId);
      }
      if (!currentEmployee && user.id) {
         currentEmployee = employees.find(emp => emp.id === user.id);
      }
      if (!currentEmployee && user.name) {
         currentEmployee = employees.find(emp =>
            emp.name.toLowerCase() === user.name.toLowerCase()
         );
      }
   }

   const employeeSite = currentEmployee
      ? sites.find(s => s.id === currentEmployee.siteId || s.id === currentEmployee.site_id)
      : null;

   const siteId = currentEmployee
      ? (currentEmployee.siteId || currentEmployee.site_id)
      : user?.siteId;

   const finalSite = employeeSite || (siteId ? sites.find(s => s.id === siteId) : null);
   const displaySite = activeSite || finalSite;
   const locationName = displaySite?.name || 'Administration';
   const siteType = displaySite?.type;

   if (!locationName) return null;

   const isWarehouse = siteType === 'Warehouse' || siteType === 'Distribution Center';

   return (
      <div className="flex flex-col ml-3 sm:ml-4 pl-3 sm:pl-4 border-l border-white/5 relative group cursor-default">
         {/* Simple Accent Bar */}
         <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[1.5px] h-3/5 rounded-full ${
            isWarehouse ? 'bg-blue-500/60' : 'bg-cyber-primary/60'
         }`} />

         <div className="flex flex-col">
            <span className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-tight leading-none mb-0.5 sm:mb-1">
               {locationName}
            </span>
            {displaySite?.code && (
               <span className="font-mono text-[8px] sm:text-[10px] text-gray-500 font-bold tracking-widest leading-none">
                  {displaySite.code}
               </span>
            )}
         </div>
      </div>
   );
}
