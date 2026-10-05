import { useState, useEffect, useMemo } from 'react';
import { Employee, Site, UserRole } from '../types';
import { employeesService } from '../services/supabase.service';
import { canViewAllSites, hasPermission } from '../utils/permissions';
import { getRoleHierarchy } from '../utils/roles';
import { Country } from '../utils/localization';
import { logger } from '../utils/logger';
import type { EmployeeFilters } from '../services/employees.service';

interface UseEmployeeDataProps {
   user: { id?: string; role?: UserRole; siteId?: string } | null;
   activeSite: Site | null;
   filterSite: string;
   filterRole: string;
   filterStatus: string;
   filterDepartment: string;
   searchTerm: string;
   currentPage: number;
   ITEMS_PER_PAGE: number;
   country?: Country;
   countrySites?: Site[];
   fallbackEmployees?: Employee[];
}

export function useEmployeeData({
   user,
   activeSite,
   filterSite,
   filterRole,
   filterStatus,
   filterDepartment,
   searchTerm,
   currentPage,
   ITEMS_PER_PAGE,
   country = 'ET',
   countrySites = [],
   fallbackEmployees = []
}: UseEmployeeDataProps) {
   const [paginatedEmployees, setPaginatedEmployees] = useState<Employee[]>([]);
   const [totalPages, setTotalPages] = useState(1);
   const [totalCount, setTotalCount] = useState(0);
   const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

   const restricted = !canViewAllSites(user?.role);
   const canManageEmployees = hasPermission(user?.role, 'EDIT_EMPLOYEE');
   const isDepartmentManager = hasPermission(user?.role, 'ACCESS_EMPLOYEES') && !canManageEmployees;
   const canViewAll = canManageEmployees || isDepartmentManager;

   useEffect(() => {
      let isMounted = true;
      const fetchEmployees = async () => {
         setIsLoadingEmployees(true);
         try {
            // Apply Site Context/Filter
            let querySiteId: string | undefined = undefined;
            if (restricted) {
               querySiteId = user?.siteId || 'NONE';
            } else if (filterSite && filterSite !== 'All') {
               querySiteId = filterSite;
            }

            // Derive site IDs belonging to the active country
            const countrySiteIds = countrySites.map(s => s.id);

            // Build country-scoped filters object
            const queryFilters: EmployeeFilters = {
               role: filterRole,
               status: filterStatus,
               department: filterDepartment,
               country,
               countrySiteIds
            };

            const { data, count } = await employeesService.getPaginated(
               querySiteId,
               currentPage,
               ITEMS_PER_PAGE,
               searchTerm,
               queryFilters
            );

            if (!isMounted) return;
            setPaginatedEmployees(data || []);
            setTotalCount(count);
            setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
         } catch (error) {
            logger.error('useEmployeeData', 'Failed to fetch employees, using scoped fallback:', error);
            if (!isMounted) return;

            // Resilient in-memory fallback using country-scoped employees
            let filtered = [...fallbackEmployees];
            if (restricted && user?.siteId) {
               filtered = filtered.filter(e => e.siteId === user.siteId);
            } else if (filterSite && filterSite !== 'All') {
               filtered = filtered.filter(e => e.siteId === filterSite);
            }
            if (filterRole !== 'All') filtered = filtered.filter(e => e.role === filterRole);
            if (filterStatus !== 'All') filtered = filtered.filter(e => e.status === filterStatus);
            if (filterDepartment !== 'All') filtered = filtered.filter(e => e.department === filterDepartment);
            if (searchTerm) {
               const term = searchTerm.toLowerCase();
               filtered = filtered.filter(e => 
                  e.name.toLowerCase().includes(term) || 
                  e.email.toLowerCase().includes(term) || 
                  (e.code && e.code.toLowerCase().includes(term)) ||
                  (e.phone && e.phone.includes(term))
               );
            }

            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            setPaginatedEmployees(filtered.slice(from, from + ITEMS_PER_PAGE));
            setTotalCount(filtered.length);
            setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
         } finally {
            if (isMounted) setIsLoadingEmployees(false);
         }
      };

      const timer = setTimeout(() => {
         fetchEmployees();
      }, 300);

      return () => {
         isMounted = false;
         clearTimeout(timer);
      };
   }, [
      currentPage, searchTerm, filterRole, filterStatus, filterDepartment,
      filterSite, activeSite?.id, restricted, user?.siteId, ITEMS_PER_PAGE,
      country, countrySites, fallbackEmployees
   ]);

   const displayedEmployees = useMemo(() => {
      return [...paginatedEmployees].sort((a, b) => {
         const hierarchyA = getRoleHierarchy(a.role);
         const hierarchyB = getRoleHierarchy(b.role);
         if (hierarchyA !== hierarchyB) return hierarchyB - hierarchyA;
         return a.name.localeCompare(b.name);
      });
   }, [paginatedEmployees]);

   return {
      displayedEmployees,
      totalCount,
      totalPages,
      isLoadingEmployees,
      canViewAll,
      restricted
   };
}
