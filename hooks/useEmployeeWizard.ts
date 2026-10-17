import { useState, useEffect } from 'react';
import { Employee, Site, UserRole } from '../types';
import { autoSelectSiteForRole, getRecommendedDepartment, validateRoleSiteAssignment, getRoleLocationDescription, canRoleBeAtSiteType, validateRegionalBoundary } from '../utils/roleSegregation';
import { SYSTEM_ROLES, canEmployRole, getRoleHierarchy } from '../utils/roles';
import { logger } from '../utils/logger';
import { employeesService } from '../services/employees.service';
import { formatEmployeeCode, parseEmployeeCode, normalizeCountryCode, generateEmployeeEmail } from '../utils/employeeIdGenerator';
import { getSiteCountryId } from '../utils/siteIdGenerator';
import { isDirectOnboardingAuthorized, persistCandidateDocuments } from '../utils/employeeOnboardingGovernance';
import { saveEmployeeDraft } from '../utils/employeeDrafts';
import { systemLogsService } from '../services/system-logs.service';
import { createAuthAccountForNewHire } from '../utils/employeeAuthHelper';
import { headcountQuotaService, QuotaEvaluationResult } from '../services/headcountQuota.service';

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

const DEPARTMENTS = ['Retail Operations', 'Logistics & Warehouse', 'Finance', 'Management', 'Human Resources', 'Security', 'Transport', 'Procurement'];

const ROLE_POOLS: Partial<Record<UserRole, UserRole[]>> = {
   store_manager: ['assistant_manager', 'shift_lead', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'pos', 'cs_manager', 'store_supervisor', 'merchandiser'],
   warehouse_manager: ['assistant_manager', 'shift_lead', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'dispatcher'],
   dispatch_manager: ['driver', 'dispatcher'],
   logistics_manager: ['assistant_manager', 'shift_lead', 'fleet_maintenance_supervisor', 'driver', 'dispatcher'],
   inventory_manager: ['assistant_manager', 'shift_lead', 'replenishment_planner', 'inventory_specialist', 'stock_clerk', 'receiver'],
   security_manager: ['loss_prevention']
};

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
   const [quotaResult, setQuotaResult] = useState<QuotaEvaluationResult | null>(null);
   
   const [newEmpData, setNewEmpData] = useState<NewEmployeeFormData>({
      firstName: '', lastName: '', email: '', phone: '', password: '',
      role: 'pos' as UserRole,
      department: 'Retail Operations',
      salary: '', specialization: '', address: '',
      emergencyContact: '', joinDate: new Date().toISOString().split('T')[0],
      avatar: '',
      siteId: activeSite?.id,
      nationalIdNumber: '',
      nationalIdPhoto: null,
      nationalIdInfo: null,
      resume: null,
      certificates: []
   });

   // Automatically evaluate facility headcount quota when role, site or salary changes
   useEffect(() => {
      const siteId = newEmpData.siteId || activeSite?.id;
      if (siteId && newEmpData.role) {
         const proposedSalary = parseFloat(newEmpData.salary) || undefined;
         headcountQuotaService.evaluateFrontlineOnboarding(siteId, newEmpData.role, proposedSalary)
            .then(res => setQuotaResult(res))
            .catch(() => setQuotaResult(null));
      } else {
         setQuotaResult(null);
      }
   }, [newEmpData.siteId, newEmpData.role, newEmpData.salary, activeSite?.id]);

   const getCreatableRoles = (): UserRole[] => {
      if (!user?.role) return [];
      if (user.role === 'super_admin' || (user.role as string) === 'CEO') {
         return SYSTEM_ROLES.map(r => r.id).filter(id => id !== 'super_admin');
      }

      const userLevel = SYSTEM_ROLES.find(r => r.id === user.role)?.level || 4;
      const userHierarchy = getRoleHierarchy(user.role);

      if (userLevel <= 2 || userHierarchy >= 82) {
         return SYSTEM_ROLES.filter(r => canEmployRole(user.role, r.id)).map(r => r.id);
      }

      if (ROLE_POOLS[user.role]) {
         return ROLE_POOLS[user.role]!.filter(roleId => canEmployRole(user.role, roleId));
      }

      return [];
   };

   const getAvailableDepartments = () => {
      if (!user?.role) return [];
      if (['super_admin', 'admin', 'hr', 'hr_manager', 'regional_manager', 'regional_hr_officer', 'operations_manager', 'finance_manager', 'supply_chain_manager', 'procurement_manager'].includes(user.role)) return DEPARTMENTS;
      if (user.role === 'regional_procurement_lead') return ['Procurement', 'Logistics & Warehouse'];
      if (user.role === 'regional_finance_officer') return ['Management'];
      if (user.role === 'regional_logistics_lead') return ['Transport', 'Logistics & Warehouse'];
      if (user.role === 'regional_security_supervisor') return ['Security'];
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
      const isRegional = ['regional_manager', 'regional_hr_officer', 'regional_procurement_lead', 'regional_finance_officer', 'regional_logistics_lead', 'regional_security_supervisor'].includes(user?.role || '');
      const userRegion = (user as any)?.regionCode || (user as any)?.region_code;
      const candidateSites = isRegional && userRegion
         ? sites.filter(s => s.regionCode === userRegion || (s as any).region_code === userRegion)
         : sites;

      const currentSite = sites.find(s => s.id === newEmpData.siteId);
      let nextSiteId = newEmpData.siteId;

      if (!currentSite || !canRoleBeAtSiteType(newRole, currentSite.type)) {
         const autoSiteId = autoSelectSiteForRole(newRole, candidateSites);
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
      const userRegion = (user as any)?.regionCode || (user as any)?.region_code;
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
         const regErr = validateRegionalBoundary(user?.role, userRegion, targetSite);
         if (regErr) {
            addNotification('alert', regErr);
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
         const regErr = validateRegionalBoundary(user?.role, userRegion, selectedSite);
         if (regErr) {
            addNotification('alert', regErr);
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

      if (!newEmpData.firstName.trim() || !newEmpData.lastName.trim()) {
         setIsSubmitting(false);
         const errorMsg = 'First and Last name are strictly required.';
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

      const userRegion = (user as any)?.regionCode || (user as any)?.region_code;
      const regErr = validateRegionalBoundary(user?.role, userRegion, selectedSite);
      if (regErr) {
         setIsSubmitting(false);
         addNotification('alert', regErr);
         return regErr;
      }

      const creatableRoles = getCreatableRoles();
      if (!creatableRoles.includes(newEmpData.role)) {
         setIsSubmitting(false);
         const roleLabel = SYSTEM_ROLES.find(r => r.id === newEmpData.role)?.label || newEmpData.role;
         const errorMsg = `Unauthorized: You cannot employ a ${roleLabel}. You may only hire employees in roles strictly below your level.`;
         addNotification('alert', errorMsg);
         return errorMsg;
      }

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
      const isAutoApproved = isDirectOnboardingAuthorized(
         user?.role,
         newEmpData.role,
         Boolean(quotaResult?.canAutoActivate)
      );
      const initialStatus = isAutoApproved ? 'Active' : 'Pending Approval';
      const onboardingTier = isAutoApproved
         ? (quotaResult?.canAutoActivate ? 'FRONTLINE_FAST_TRACK' : 'HQ_GOVERNANCE')
         : 'HQ_GOVERNANCE';
      const quotaStatus = quotaResult?.canAutoActivate
         ? 'WITHIN_QUOTA'
         : (quotaResult ? 'EXCEEDED_QUOTA' : 'WITHIN_QUOTA');

      try {
         if (!newEmpData.password || newEmpData.password.length < 6) {
            throw new Error("A valid password (minimum 6 characters) is required.");
         }
         if (!newEmpData.siteId || !newEmpData.siteId.trim()) {
            throw new Error("Workplace location is mandatory. Every employee must be assigned to an operating location.");
         }
         const validatedSiteId = newEmpData.siteId.trim();
         const assignedSite = sites.find(s => s.id === validatedSiteId);
         const targetCountry = normalizeCountryCode(getSiteCountryId(assignedSite) || activeSite?.country || 'ET');

         let maxCodeNumber = targetCountry === 'ET' ? 39 : 0;
         if (Array.isArray(employees)) {
            employees.forEach(emp => {
               const parsed = parseEmployeeCode(emp.code);
               if (parsed && parsed.country === targetCountry && parsed.seq > maxCodeNumber) {
                  maxCodeNumber = parsed.seq;
               }
            });
         }
         try {
            const nextDbCode = await employeesService.getNextCode(targetCountry);
            const parsed = parseEmployeeCode(nextDbCode);
            if (parsed && parsed.country === targetCountry && parsed.seq > maxCodeNumber) {
               maxCodeNumber = parsed.seq - 1;
            }
         } catch (e) {
            logger.warn('useEmployeeWizard', 'Failed to fetch next DB employee code, using local max', { error: String(e) });
         }

         let nextCodeNumber = maxCodeNumber + 1;
         let employeeCode = formatEmployeeCode(targetCountry, nextCodeNumber);
         while (employees.some(emp => emp.code?.toUpperCase() === employeeCode.toUpperCase())) {
            nextCodeNumber++;
            employeeCode = formatEmployeeCode(targetCountry, nextCodeNumber);
         }

         let signupEmail = generateEmployeeEmail(employeeCode);
         let employeeId: string = crypto.randomUUID();

         // Direct authorized executives or quota-approved frontline hires register live credentials
         if (isAutoApproved) {
            const authRes = await createAuthAccountForNewHire({
               signupEmail,
               password: newEmpData.password,
               firstName: newEmpData.firstName,
               lastName: newEmpData.lastName,
               role: newEmpData.role,
               siteId: validatedSiteId,
               employeeCode,
               fallbackEmployeeId: employeeId
            });
            employeeId = authRes.employeeId;
            signupEmail = authRes.finalEmail;
            if (authRes.error && !authRes.accountCreated) {
               addNotification('alert', `Staff created, but login credentials had an alert: ${authRes.error}`);
            }
         }

         const newEmp: Employee = {
            id: employeeId,
            code: employeeCode,
            siteId: validatedSiteId,
            regionCode: assignedSite?.region_code || (assignedSite as any)?.regionCode || undefined,
            region_code: assignedSite?.region_code || (assignedSite as any)?.regionCode || undefined,
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
            badges: isAutoApproved ? ['New Recruit'] : ['Pending HR Review'],
            address: newEmpData.address,
            emergencyContact: newEmpData.emergencyContact,
            nationalIdNumber: newEmpData.nationalIdNumber || undefined,
            nationalIdPhoto: newEmpData.nationalIdPhoto || undefined,
            resumeUrl: newEmpData.resume?.name || undefined,
            quotaApprovedBy: isAutoApproved && quotaResult?.canAutoActivate ? (user?.name || user?.role) : undefined,
            onboardingTier,
            quotaStatus
         };

         const result = addEmployee(newEmp);
         if (result instanceof Promise) await result;

         if (typeof window !== 'undefined' && newEmpData.password) {
            localStorage.setItem(`siifmart_temp_pwd_${employeeId}`, newEmpData.password);
            localStorage.setItem(`siifmart_temp_pwd_by_code_${employeeCode.toLowerCase()}`, newEmpData.password);
            localStorage.setItem(`siifmart_temp_pwd_by_name_${newEmp.name.toLowerCase()}`, newEmpData.password);
         }

         if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('employee:created', { detail: { employee: newEmp } }));
            window.dispatchEvent(new CustomEvent('employee:updated'));
         }

         // Persist onboarding documents
         persistCandidateDocuments(employeeId, newEmpData);

         // Zero-Trust audit log under Rule 5
         await systemLogsService.create({
            action: isAutoApproved ? 'EMPLOYEE_ONBOARDED' : 'CANDIDATE_DRAFT_SUBMITTED_TO_HR',
            module: 'HR',
            site_id: validatedSiteId,
            country_code: targetCountry,
            user_name: user?.name || 'Unknown',
            employee_id: user?.id,
            details: {
               candidateName: `${newEmpData.firstName} ${newEmpData.lastName}`,
               role: newEmpData.role,
               siteId: validatedSiteId,
               status: initialStatus,
               onboardingTier,
               quotaStatus,
               submittedByRole: user?.role
            }
         }).catch(err => {
            logger.warn('useEmployeeWizard', 'Failed to record audit log', { error: err });
         });

         resetWizard();

         if (quotaResult?.canAutoActivate) {
            addNotification('success', `Frontline Fast-Track Active!\n\n${newEmpData.firstName} has been activated immediately within pre-approved site quota.`);
         } else if (isAutoApproved) {
            addNotification('success', `Employee Profile Created!\n\n${newEmpData.firstName} has been onboarded successfully.`);
         } else {
            addNotification('success', `Candidate Proposal Submitted to HQ!\n\n${newEmpData.firstName} ${newEmpData.lastName} has been submitted to Corporate HQ for approval.`);
         }
         return null;
      } catch (error: any) {
         logger.error('useEmployeeWizard', 'Failed to submit candidate:', error);
         addNotification('alert', `Failed to process candidate: ${error.message || 'Unknown error'}`);
         return error.message || 'Unknown error';
      }
   };

   const handleSaveDraft = () => {
      if (!newEmpData.firstName.trim() && !newEmpData.role) {
         addNotification('alert', 'Please enter at least candidate name or role before saving a draft.');
         return;
      }
      const assignedSite = sites.find(s => s.id === newEmpData.siteId);
      const targetCountry = normalizeCountryCode(getSiteCountryId(assignedSite) || activeSite?.country || 'ET');
      const draft = saveEmployeeDraft(newEmpData, addStep, undefined, targetCountry, assignedSite?.name);
      addNotification('success', `Draft saved: "${draft.title}" at Step ${addStep}. You can resume anytime.`);
   };

   const canAdjustPayroll = ['super_admin', 'hr_manager', 'hr', 'admin'].includes(user?.role || '');

   return {
      addStep, setAddStep, isSubmitting, setIsSubmitting, isAddModalOpen, setIsAddModalOpen,
      newEmpData, setNewEmpData, availableRoles, availableDepartments,
      resetWizard, handleOpenWizard, handleRoleChange, handleFinalSubmit,
      getCreatableRoles, handleWizardNext, handleWizardBack, canAdjustPayroll,
      handleSaveDraft,
      quotaResult,
      isDirectOnboarding: isDirectOnboardingAuthorized(user?.role, newEmpData.role, Boolean(quotaResult?.canAutoActivate))
   };
}
