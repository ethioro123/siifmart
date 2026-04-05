import { useState, useEffect, useMemo } from 'react';
import { Employee, UserRole } from '../types';
import { employeesService } from '../services/supabase.service';
import { canViewAllSites, hasPermission } from '../utils/permissions';
import { getRoleHierarchy } from '../utils/roles';

interface UseEmployeeDataProps {
   user: any;
   activeSite: any;
   filterSite: string;
   filterRole: string;
   filterStatus: string;
   filterDepartment: string;
   searchTerm: string;
   currentPage: number;
   ITEMS_PER_PAGE: number;
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
   ITEMS_PER_PAGE
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
      const fetchEmployees = async () => {
         setIsLoadingEmployees(true);
         try {
            // Apply Site Context/Filter
            let querySiteId = restricted ? (user?.siteId || 'NONE') : activeSite?.id;
            if (!restricted && !querySiteId && filterSite !== 'All') {
               querySiteId = filterSite;
            }

            // Build filters object
            const queryFilters = {
               role: filterRole,
               status: filterStatus,
               department: filterDepartment
            };

            const { data, count } = await employeesService.getPaginated(
               querySiteId,
               currentPage,
               ITEMS_PER_PAGE,
               searchTerm,
               queryFilters
            );

            setPaginatedEmployees(data || []);
            setTotalCount(count);
            setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
         } catch (error) {
            console.error('Failed to fetch employees:', error);
         } finally {
            setIsLoadingEmployees(false);
         }
      };

      const timer = setTimeout(() => {
         fetchEmployees();
      }, 300);

      return () => clearTimeout(timer);
   }, [currentPage, searchTerm, filterRole, filterStatus, filterDepartment, filterSite, activeSite?.id, restricted, user?.siteId, ITEMS_PER_PAGE]);

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
