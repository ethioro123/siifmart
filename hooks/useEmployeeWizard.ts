import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Employee, UserRole } from '../types';
import { autoSelectSiteForRole, getRecommendedDepartment, validateRoleSiteAssignment, getRoleLocationDescription, canRoleBeAtSiteType } from '../utils/roleSegregation';
import { SYSTEM_ROLES } from '../utils/roles';

interface UseEmployeeWizardProps {
   user: any;
   employees: Employee[];
   sites: any[];
   activeSite: any;
   addEmployee: (emp: Employee) => void | Promise<void>;
   addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}

const DEPARTMENTS = ['Retail Operations', 'Logistics & Warehouse', 'Management', 'Human Resources', 'Security', 'Transport', 'Procurement'];

export function useEmployeeWizard({
   user,
   employees,
   sites,
   activeSite,
   addEmployee,
   addNotification
}: UseEmployeeWizardProps) {
   const [addStep, setAddStep] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   
   const [newEmpData, setNewEmpData] = useState({
      firstName: '', lastName: '', email: '', phone: '', password: '',
      role: 'pos' as UserRole,
      department: 'Retail Operations',
      salary: '', specialization: '', address: '',
      emergencyContact: '', joinDate: new Date().toISOString().split('T')[0],
      avatar: '',
      siteId: activeSite?.id
   });

   const getCreatableRoles = (): UserRole[] => {
      if (!user) return [];
      switch (user.role) {
         case 'super_admin':
            return SYSTEM_ROLES.map(r => r.id);
         case 'regional_manager':
         case 'operations_manager':
         case 'admin':
         case 'hr_manager':
         case 'hr':
            // Can onboard any role except super_admin (CEO)
            return SYSTEM_ROLES.map(r => r.id).filter(id => id !== 'super_admin');
         case 'store_manager':
            return ['assistant_manager', 'shift_lead', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'pos', 'cs_manager', 'store_supervisor', 'merchandiser'];
         case 'warehouse_manager':
            return ['assistant_manager', 'shift_lead', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'dispatcher'];
         case 'dispatch_manager':
            return ['driver', 'dispatcher'];
         default: return [];
      }
   };

   const getAvailableDepartments = () => {
      if (!user) return [];
      if (['super_admin', 'admin', 'hr', 'hr_manager'].includes(user.role)) return DEPARTMENTS;
      if (user.role === 'store_manager') return ['Retail Operations', 'Logistics & Warehouse', 'Transport'];
      if (user.role === 'warehouse_manager') return ['Logistics & Warehouse', 'Transport'];
      if (user.role === 'logistics_manager') return ['Transport', 'Logistics & Warehouse'];
      if (user.role === 'inventory_manager') return ['Logistics & Warehouse', 'Management'];
      if (user.role === 'security_manager') return ['Security'];
      return [];
   };

   const availableRoles = SYSTEM_ROLES.filter(r => getCreatableRoles().includes(r.id));
   const availableDepartments = getAvailableDepartments();

   const resetWizard = () => {
      setIsAddModalOpen(false);
      setAddStep(1);
   };

   const handleOpenWizard = () => {
      const validRoles = getCreatableRoles();
      const validDepts = getAvailableDepartments();
      setNewEmpData({
         firstName: '', lastName: '', email: '', phone: '', password: '',
         role: validRoles.length > 0 ? validRoles[0] : 'pos',
         department: validDepts.length > 0 ? validDepts[0] : 'Retail Operations',
         salary: '', specialization: '', address: '',
         emergencyContact: '', joinDate: new Date().toISOString().split('T')[0],
         avatar: '',
         siteId: activeSite?.id
      });
      setIsAddModalOpen(true);
      setAddStep(1);
   };

   const handleRoleChange = (newRole: UserRole) => {
      const currentSite = sites.find(s => s.id === newEmpData.siteId);
      let nextSiteId = newEmpData.siteId;

      if (!currentSite || !canRoleBeAtSiteType(newRole, currentSite.type)) {
         const autoSiteId = autoSelectSiteForRole(newRole, sites);
         if (autoSiteId) {
            nextSiteId = autoSiteId;
         }
      }

      const recommendedDept = getRecommendedDepartment(newRole);
      setNewEmpData(prev => ({ ...prev, role: newRole, siteId: nextSiteId, department: recommendedDept }));
      const locationDesc = getRoleLocationDescription(newRole);
      if (locationDesc) addNotification('info', `Role Selected: ${locationDesc}`);
   };

   const handleWizardNext = () => {
      if (addStep === 1) {
         if (!newEmpData.firstName.trim()) {
            addNotification('alert', 'First Name is required.');
            return;
         }
         if (!newEmpData.password || newEmpData.password.length < 6) {
            addNotification('alert', 'A valid password (minimum 6 characters) is required.');
            return;
         }
      }
      setAddStep(prev => Math.min(prev + 1, 4));
   };

   const handleWizardBack = () => {
      setAddStep(prev => Math.max(prev - 1, 1));
   };

   const handleFinalSubmit = async () => {
      setIsSubmitting(true);

      // Validate role-site assignment
      const selectedSite = sites.find(s => s.id === newEmpData.siteId);
      if (selectedSite) {
         const validationError = validateRoleSiteAssignment(newEmpData.role, selectedSite.type);
         if (validationError) {
            setIsSubmitting(false);
            return validationError;
         }
      }

      const result = await submitEmployeeData();
      setIsSubmitting(false);
      return result;
   };

   const submitEmployeeData = async () => {
      const isAutoApproved = ['super_admin', 'admin', 'hr'].includes(user?.role || '');
      const initialStatus = isAutoApproved ? 'Active' : 'Pending Approval';

      try {
         if (!newEmpData.password || newEmpData.password.length < 6) {
            throw new Error("A valid password (minimum 6 characters) is required.");
         }

         let maxCodeNumber = 0;
         if (Array.isArray(employees)) {
            employees.forEach(emp => {
               if (emp.code) {
                  const match = emp.code.match(/SIIF-(\d+)/i);
                  if (match) {
                     const num = parseInt(match[1], 10);
                     if (num > maxCodeNumber) {
                        maxCodeNumber = num;
                     }
                  }
               }
            });
         }
         let nextCodeNumber = Math.max(employees.length + 1, maxCodeNumber + 1);
         let employeeCode = `SIIF-${nextCodeNumber.toString().padStart(4, '0')}`;
         while (employees.some(emp => emp.code === employeeCode)) {
            nextCodeNumber++;
            employeeCode = `SIIF-${nextCodeNumber.toString().padStart(4, '0')}`;
         }

         const adminClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
         );

         // Email is always auto-generated from employee code
         let signupEmail = `${employeeCode.toLowerCase()}@siifmart.com`;

         const buildPayload = () => ({
            email: signupEmail,
            password: newEmpData.password,
            options: {
               data: {
                  name: `${newEmpData.firstName} ${newEmpData.lastName}`,
                  role: newEmpData.role,
                  siteId: newEmpData.siteId || activeSite?.id || 'SITE-001'
               }
            }
         });

         let authData: any = null;
         const { data: firstAttempt, error: firstError } = await adminClient.auth.signUp(buildPayload());

         if (firstError) {
            if (firstError.message?.toLowerCase().includes('already registered')) {
               // Ghost auth record — retry with a unique timestamp suffix
               const ts = Date.now().toString(36);
               signupEmail = `${employeeCode.toLowerCase()}-${ts}@siifmart.com`;
               const { data: retryData, error: retryError } = await adminClient.auth.signUp(buildPayload());
               if (retryError) throw retryError;
               if (!retryData.user) throw new Error('Failed to create user account on retry');
               authData = retryData;
            } else {
               throw firstError;
            }
         } else {
            authData = firstAttempt;
         }

         if (!authData?.user) throw new Error('Failed to create user account');

         const employeeId = authData.user.id;

         const newEmp: Employee = {
            id: employeeId,
            code: employeeCode,
            siteId: newEmpData.siteId || activeSite?.id || 'SITE-001',
            name: `${newEmpData.firstName} ${newEmpData.lastName}`,
            role: newEmpData.role,
            email: signupEmail,
            phone: newEmpData.phone || 'N/A',
            status: initialStatus,
            joinDate: newEmpData.joinDate,
            department: newEmpData.department,
            avatar: newEmpData.avatar || `https://ui-avatars.com/api/?name=${newEmpData.firstName}+${newEmpData.lastName}&background=random`,
            performanceScore: 100,
            specialization: newEmpData.specialization || 'Generalist',
            salary: parseFloat(newEmpData.salary) || 0,
            attendanceRate: 100,
            badges: ['New Recruit'],
            address: newEmpData.address,
            emergencyContact: newEmpData.emergencyContact
         };

         const result = addEmployee(newEmp);
         if (result instanceof Promise) await result;
         resetWizard();
         addNotification('success', `✅ Employee Profile Created!\n\n${newEmpData.firstName} has been onboarded successfully.`);
         return null;
      } catch (error: any) {
         console.error('Failed to create employee:', error);
         addNotification('alert', `Failed to onboard employee: ${error.message || 'Unknown error'}`);
         return error.message || 'Unknown error';
      }
    };

    const canAdjustPayroll = ['super_admin', 'hr_manager', 'hr', 'admin'].includes(user?.role || '');

    return {
       addStep, setAddStep, isSubmitting, setIsSubmitting, isAddModalOpen, setIsAddModalOpen,
       newEmpData, setNewEmpData, availableRoles, availableDepartments,
       resetWizard, handleOpenWizard, handleRoleChange, handleFinalSubmit,
       getCreatableRoles, handleWizardNext, handleWizardBack, canAdjustPayroll
    };
}
