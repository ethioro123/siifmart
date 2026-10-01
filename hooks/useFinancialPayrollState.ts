import { useState, useEffect, useMemo } from 'react';
import type { Employee } from '../types';

export function useFinancialPayrollState(employees: Employee[]) {
   const [payrollSearch, setPayrollSearch] = useState('');
   const [payrollRoleFilter, setPayrollRoleFilter] = useState('All');
   const [payrollSort, setPayrollSort] = useState<'name' | 'salary' | 'department'>('name');
   const [payrollSortDir, setPayrollSortDir] = useState<'asc' | 'desc'>('asc');
   const [payrollPage, setPayrollPage] = useState(1);
   const [payrollPerPage, setPayrollPerPage] = useState(10);

   const filteredEmployees = useMemo(() => {
      return employees.filter(emp => {
         const matchesSearch = emp.name.toLowerCase().includes(payrollSearch.toLowerCase()) ||
            emp.role.toLowerCase().includes(payrollSearch.toLowerCase());
         const matchesRole = payrollRoleFilter === 'All' || emp.role === payrollRoleFilter;
         return matchesSearch && matchesRole;
      }).sort((a, b) => {
         let valA = a[payrollSort] || '';
         let valB = b[payrollSort] || '';
         if (payrollSort === 'salary') {
            valA = a.salary || 0;
            valB = b.salary || 0;
         }
         if (valA < valB) return payrollSortDir === 'asc' ? -1 : 1;
         if (valA > valB) return payrollSortDir === 'asc' ? 1 : -1;
         return 0;
      });
   }, [employees, payrollSearch, payrollRoleFilter, payrollSort, payrollSortDir]);

   useEffect(() => {
      setPayrollPage(1);
   }, [payrollSearch, payrollRoleFilter]);

   const payrollTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / payrollPerPage));
   const payrollStartIndex = (payrollPage - 1) * payrollPerPage;
   const payrollEndIndex = payrollStartIndex + payrollPerPage;
   const paginatedEmployees = filteredEmployees.slice(payrollStartIndex, payrollEndIndex);

   const getPayrollPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;
      if (payrollTotalPages <= maxVisible) {
         for (let i = 1; i <= payrollTotalPages; i++) pages.push(i);
      } else {
         pages.push(1);
         if (payrollPage > 3) pages.push('...');
         const start = Math.max(2, payrollPage - 1);
         const end = Math.min(payrollTotalPages - 1, payrollPage + 1);
         for (let i = start; i <= end; i++) pages.push(i);
         if (payrollPage < payrollTotalPages - 2) pages.push('...');
         pages.push(payrollTotalPages);
      }
      return pages;
   };

   const uniqueRoles = ['All', ...Array.from(new Set(employees.map(e => e.role)))];

   return {
      payrollSearch, setPayrollSearch,
      payrollRoleFilter, setPayrollRoleFilter,
      payrollSort, setPayrollSort,
      payrollSortDir, setPayrollSortDir,
      payrollPage, setPayrollPage,
      payrollPerPage, setPayrollPerPage,
      filteredEmployees,
      payrollTotalPages,
      payrollStartIndex,
      payrollEndIndex,
      paginatedEmployees,
      getPayrollPageNumbers,
      uniqueRoles
   };
}
