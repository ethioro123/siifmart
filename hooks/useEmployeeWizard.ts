import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Employee, Site, UserRole } from '../types';
import { autoSelectSiteForRole, getRecommendedDepartment, validateRoleSiteAssignment, getRoleLocationDescription, canRoleBeAtSiteType } from '../utils/roleSegregation';
import { SYSTEM_ROLES, canEmployRole, getRoleHierarchy } from '../utils/roles';
import { logger } from '../utils/logger';
import { employeesService } from '../services/employees.service';
import { saveEmployeeDocument } from '../utils/employeeProfileData';

export interface NewEmployeeFormData {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   password: string;
   role: UserRole;
   department: string;
   salary: string;
   specialization: string;
   address: string;
   emergencyContact: string;
   joinDate: string;
   avatar: string;
   siteId?: string;
   nationalIdNumber?: string;
   nationalIdPhoto?: string | null;
   nationalIdInfo?: any;
   resume?: any;
   certificates?: any[];
}

interface UseEmployeeWizardProps {
   user?: { id?: string; role?: UserRole; name?: string; email?: string } | null;
   employees: Employee[];
   sites: Site[];
   activeSite: Site | null | undefined;
   addEmployee: (emp: Employee, user?: string) => Promise<Employee | undefined | void> | void;
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
      siteId: activeSite?.id,
      nationalIdNumber: '',
      nationalIdPhoto: null as string | null,
      nationalIdInfo: null as any,
      resume: null as any,
      certificates: [] as any[]
   });

   const getCreatableRoles = (): UserRole[] => {
      if (!user?.role) return [];
      if (user.role === 'super_admin' || (user.role as string) === 'CEO') {
         return SYSTEM_ROLES.map(r => r.id).filter(id => id !== 'super_admin');
      }

      const userLevel = SYSTEM_ROLES.find(r => r.id === user.role)?.level || 4;
      const userHierarchy = getRoleHierarchy(user.role);

      // HR and above (Level 2 & above, hierarchy >= 82): strictly roles below their level and rank
      if (userLevel <= 2 || userHierarchy >= 82) {
         return SYSTEM_ROLES.filter(r => canEmployRole(user.role, r.id)).map(r => r.id);
      }

      // Site Managers: strictly roles below their level and rank within their facility domain
      if (user.role === 'store_manager') {
         const storePool: UserRole[] = ['assistant_manager', 'shift_lead', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'pos', 'cs_manager', 'store_supervisor', 'merchandiser'];
         return storePool.filter(roleId => canEmployRole(user.role, roleId));
      }

      if (user.role === 'warehouse_manager') {
         const warehousePool: UserRole[] = ['assistant_manager', 'shift_lead', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'dispatcher'];
         return warehousePool.filter(roleId => canEmployRole(user.role, roleId));
      }

      if (user.role === 'dispatch_manager') {
         const dispatchPool: UserRole[] = ['driver', 'dispatcher'];
         return dispatchPool.filter(roleId => canEmployRole(user.role, roleId));
      }

      if (user.role === 'logistics_manager') {
         const logisticsPool: UserRole[] = ['assistant_manager', 'shift_lead', 'driver', 'dispatcher'];
         return logisticsPool.filter(roleId => canEmployRole(user.role, roleId));
      }

      if (user.role === 'inventory_manager') {
         const inventoryPool: UserRole[] = ['assistant_manager', 'shift_lead', 'inventory_specialist', 'stock_clerk', 'receiver'];
         return inventoryPool.filter(roleId => canEmployRole(user.role, roleId));
      }

      if (user.role === 'security_manager') {
         const securityPool: UserRole[] = ['loss_prevention'];
         return securityPool.filter(roleId => canEmployRole(user.role, roleId));
      }

      return [];
   };

   const getAvailableDepartments = () => {
      if (!user?.role) return [];
      if (['super_admin', 'admin', 'hr', 'hr_manager', 'regional_manager', 'operations_manager', 'finance_manager', 'supply_chain_manager', 'procurement_manager'].includes(user.role)) return DEPARTMENTS;
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
      const initialRole = validRoles.length > 0 ? validRoles[0] : 'pos';

      // Determine initial site location:
      // 1. User activeSite if present in sites list
      // 2. Auto-selected site matching initialRole
      // 3. First available site in sites
      let initialSiteId = '';
      if (activeSite?.id && sites.some(s => s.id === activeSite.id)) {
         initialSiteId = activeSite.id;
      } else {
         const autoSiteId = autoSelectSiteForRole(initialRole, sites);
         if (autoSiteId) {
            initialSiteId = autoSiteId;
         } else if (sites.length > 0) {
            initialSiteId = sites[0].id;
         }
      }

      setNewEmpData({
         firstName: '', lastName: '', email: '', phone: '', password: '',
         role: initialRole,
         department: validDepts.length > 0 ? validDepts[0] : 'Retail Operations',
         salary: '', specialization: '', address: '',
         emergencyContact: '', joinDate: new Date().toISOString().split('T')[0],
         avatar: '',
         siteId: initialSiteId,
         nationalIdNumber: '',
         nationalIdPhoto: null,
         nationalIdInfo: null,
         resume: null,
         certificates: []
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
         if (!newEmpData.siteId || !newEmpData.siteId.trim()) {
            addNotification('alert', 'Work location is mandatory. Please select a valid workplace location.');
            return;
         }
         const targetSite = sites.find(s => s.id === newEmpData.siteId);
         if (!targetSite) {
            addNotification('alert', 'The selected workplace location does not exist. Please select a valid location.');
            return;
         }
      }
      if (addStep === 2) {
         if (!newEmpData.siteId || !newEmpData.siteId.trim()) {
            addNotification('alert', 'Work location is mandatory. Every employee must be assigned to an operating workplace location.');
            return;
         }
         const selectedSite = sites.find(s => s.id === newEmpData.siteId);
         if (!selectedSite) {
            addNotification('alert', 'Assigned workplace location does not exist in the system.');
            return;
         }
         const validationError = validateRoleSiteAssignment(newEmpData.role, selectedSite.type);
         if (validationError) {
            addNotification('alert', validationError);
            return;
         }
      }
      setAddStep(prev => Math.min(prev + 1, 5));
   };

   const handleWizardBack = () => {
      setAddStep(prev => Math.max(prev - 1, 1));
   };

   const handleFinalSubmit = async () => {
      setIsSubmitting(true);

      // Validate work location is mandatory
      if (!newEmpData.siteId || !newEmpData.siteId.trim()) {
         setIsSubmitting(false);
         const errorMsg = 'Work location is mandatory. Every employee must have a location they are getting employed to.';
         addNotification('alert', errorMsg);
         return errorMsg;
      }

      const selectedSite = sites.find(s => s.id === newEmpData.siteId);
      if (!selectedSite) {
         setIsSubmitting(false);
         const errorMsg = 'Invalid workplace location. The assigned location does not exist in the system.';
         addNotification('alert', errorMsg);
         return errorMsg;
      }

      // Validate user is authorized to hire this specific role
      const creatableRoles = getCreatableRoles();
      if (!creatableRoles.includes(newEmpData.role)) {
         setIsSubmitting(false);
         const roleLabel = SYSTEM_ROLES.find(r => r.id === newEmpData.role)?.label || newEmpData.role;
         const errorMsg = `Unauthorized: You cannot employ a ${roleLabel}. You may only hire employees in roles strictly below your level.`;
         addNotification('alert', errorMsg);
         return errorMsg;
      }

      // Validate role-site assignment
      const validationError = validateRoleSiteAssignment(newEmpData.role, selectedSite.type);
      if (validationError) {
         setIsSubmitting(false);
         addNotification('alert', validationError);
         return validationError;
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
         if (!newEmpData.siteId || !newEmpData.siteId.trim()) {
            throw new Error("Workplace location is mandatory. Every employee must be assigned to an operating location.");
         }
         const validatedSiteId = newEmpData.siteId.trim();

         let maxCodeNumber = 39; // Baseline known employee count in database
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
         try {
            const nextDbCode = await employeesService.getNextCode();
            const match = nextDbCode.match(/SIIF-(\d+)/i);
            if (match) {
               const num = parseInt(match[1], 10);
               if (num > maxCodeNumber) {
                  maxCodeNumber = num - 1;
               }
            }
         } catch (e) {
            logger.warn('useEmployeeWizard', 'Failed to fetch next DB employee code, using local max', { error: String(e) });
         }

         let nextCodeNumber = maxCodeNumber + 1;
         let employeeCode = `SIIF-${nextCodeNumber.toString().padStart(4, '0')}`;
         while (employees.some(emp => emp.code === employeeCode)) {
            nextCodeNumber++;
            employeeCode = `SIIF-${nextCodeNumber.toString().padStart(4, '0')}`;
         }

         const adminClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
               auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                  detectSessionInUrl: false,
                  storage: {
                     getItem: () => null,
                     setItem: () => {},
                     removeItem: () => {}
                  },
                  storageKey: 'siifmart-onboarding-temp'
               }
            }
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
                  siteId: validatedSiteId
               }
            }
         });

         let authData: any = null;
         const { data: firstAttempt, error: firstError } = await adminClient.auth.signUp(buildPayload());

         if (firstError) {
            const errStr = (firstError.message || '').toLowerCase();
            if (errStr.includes('already registered') || errStr.includes('already exist') || (firstError as any).status === 422) {
               // Ghost auth record or existing email — retry with a unique timestamp suffix
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
            siteId: validatedSiteId,
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
            emergencyContact: newEmpData.emergencyContact,
            nationalIdNumber: newEmpData.nationalIdNumber || undefined,
            nationalIdPhoto: newEmpData.nationalIdPhoto || undefined,
            resumeUrl: newEmpData.resume?.name || undefined
         };

         const result = addEmployee(newEmp);
         if (result instanceof Promise) await result;

         // Persist onboarding documents to verified personnel records
         if (newEmpData.nationalIdPhoto) {
            saveEmployeeDocument(employeeId, {
               name: 'National_ID_Card.jpg',
               size: newEmpData.nationalIdInfo?.compressedSize || '180 KB',
               type: 'jpg',
               dataUrl: newEmpData.nationalIdPhoto
            });
         }
         if (newEmpData.resume?.dataUrl) {
            saveEmployeeDocument(employeeId, {
               name: newEmpData.resume.name,
               size: newEmpData.resume.size,
               type: newEmpData.resume.type,
               dataUrl: newEmpData.resume.dataUrl
            });
         }
         if (Array.isArray(newEmpData.certificates)) {
            newEmpData.certificates.forEach((cert: any) => {
               saveEmployeeDocument(employeeId, {
                  name: cert.name,
                  size: cert.size,
                  type: cert.type,
                  dataUrl: cert.dataUrl
               });
            });
         }

         resetWizard();
         addNotification('success', `✅ Employee Profile Created!\n\n${newEmpData.firstName} has been onboarded successfully.`);
         return null;
      } catch (error: any) {
         logger.error('useEmployeeWizard', 'Failed to create employee:', error);
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
