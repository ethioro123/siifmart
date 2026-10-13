import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Network, Calendar, UserPlus, Lock, Shield, AlertTriangle } from 'lucide-react';
import { Employee, PayrollRun } from '../types';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useEmployeeData } from '../hooks/useEmployeeData';
import { useEmployeeActions } from '../hooks/useEmployeeActions';
import { useEmployeeWizard } from '../hooks/useEmployeeWizard';
import { Protected } from '../components/Protected';
import { hasPermission, canViewAllEmployees } from '../utils/permissions';
import OrgChart from '../components/OrgChart';
import ShiftPlanner from '../components/ShiftPlanner';
import StaffProfileView from '../components/StaffProfileView';
import EmployeeStats from '../components/employees/EmployeeStats';
import GlobalTaskQueue from '../components/employees/GlobalTaskQueue';
import PhotoApprovalList from '../components/employees/PhotoApprovalList';
import DirectoryHeader from '../components/employees/DirectoryHeader';
import DirectoryGrid from '../components/employees/DirectoryGrid';
import DirectoryList from '../components/employees/DirectoryList';
import EmployeePagination from '../components/employees/EmployeePagination';
import EmployeeModals from '../components/employees/EmployeeModals';
import SalaryApprovalQueueModal from '../components/employees/SalaryApprovalQueueModal';
import { EmployeeChangeApprovalModal } from '../components/employees/modals/EmployeeChangeApprovalModal';
import { EmployeeGovernanceBanners } from '../components/employees/EmployeeGovernanceBanners';
import { EmployeesHeader, ViewMode } from '../components/employees/EmployeesHeader';
import RecruitmentPipelineTab from '../components/employees/recruitment/RecruitmentPipelineTab';
import DisciplinaryRegisterTab from '../components/employees/disciplinary/DisciplinaryRegisterTab';
import AccessReviewTab from '../components/employees/compliance/AccessReviewTab';
import { salaryRequestsService } from '../services/salary-requests.service';
import { employeeChangesService } from '../services/employee-changes.service';
import { payrollRunsService } from '../services/payroll-runs.service';
import { employeesService } from '../services/employees.service';

// Pagination Shelf Limit (Rule 10: 25-Item Shelf Rule)
const ITEMS_PER_PAGE = 25;

export default function Employees() {
   const navigate = useNavigate();
   const { user, updateUserAvatar, onlineIds } = useStore();
   const { employees, addEmployee, updateEmployee, deleteEmployee, activeSite, sites, addNotification, tasks, shifts, effectiveCountry, activeRegionCode } = useData();

   // --- STATE ---
   const [viewMode, setViewMode] = useState<ViewMode>('directory');
   const [searchTerm, setSearchTerm] = useState('');
   const [filterRole, setFilterRole] = useState('All');
   const [filterStatus, setFilterStatus] = useState('All');
   const [filterDepartment, setFilterDepartment] = useState('All');
   const [filterSite, setFilterSite] = useState('All');
   const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
   const [currentPage, setCurrentPage] = useState(1);
   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
   const [idCardEmployee, setIdCardEmployee] = useState<Employee | null>(null);
   const [isTaskQueueOpen, setIsTaskQueueOpen] = useState(false);
   const [terminateInput, setTerminateInput] = useState('');
   const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const [pendingOnboardingImageSrc, setPendingOnboardingImageSrc] = useState<string | null>(null);
   const [isOnboardingEditorOpen, setIsOnboardingEditorOpen] = useState(false);
   const [isSalaryQueueOpen, setIsSalaryQueueOpen] = useState(false);
   const [pendingSalaryCount, setPendingSalaryCount] = useState(0);
   const [isChangeApprovalModalOpen, setIsChangeApprovalModalOpen] = useState(false);
   const [pendingChangeCount, setPendingChangeCount] = useState(0);
   const [pendingPayrollRun, setPendingPayrollRun] = useState<PayrollRun | null>(null);

   const refreshPendingSalary = useCallback(async () => {
      try {
         const pending = await salaryRequestsService.getPending(activeSite?.id, effectiveCountry);
         setPendingSalaryCount(pending.length);
      } catch {
         // Fallback
      }
   }, [activeSite?.id, effectiveCountry]);

   const refreshPendingChanges = useCallback(async () => {
      try {
         const pending = await employeeChangesService.getPending(undefined, effectiveCountry);
         setPendingChangeCount(pending.length);
      } catch {
         // Fallback
      }
   }, [effectiveCountry]);

   const refreshPayrollRun = useCallback(async () => {
      try {
         const run = await payrollRunsService.getLatestRun(activeSite?.id, effectiveCountry);
         setPendingPayrollRun(run);
      } catch {
         // Fallback
      }
   }, [activeSite?.id, effectiveCountry]);

   const scopedSites = React.useMemo(() => {
      const targetRegion = activeRegionCode || user?.regionCode;
      if (targetRegion) {
         return sites.filter(s => s.regionCode === targetRegion || (s as any).region_code === targetRegion);
      }
      return sites;
   }, [sites, activeRegionCode, user?.regionCode]);

   const [pendingRecruits, setPendingRecruits] = useState<Employee[]>(() =>
      employees.filter(e => e.status === 'Pending Approval')
   );

   const refreshPendingRecruits = useCallback(async () => {
      try {
         const targetSiteIds = scopedSites.map(s => s.id);
         const recruits = await employeesService.getPendingApproval(effectiveCountry, targetSiteIds);
         setPendingRecruits(recruits);
      } catch {
         setPendingRecruits(employees.filter(e => e.status === 'Pending Approval'));
      }
   }, [scopedSites, effectiveCountry, employees]);

   useEffect(() => {
      refreshPendingSalary();
      refreshPendingChanges();
      refreshPayrollRun();
      refreshPendingRecruits();
      const handleCreated = () => { refreshPendingSalary(); refreshPendingChanges(); refreshPendingRecruits(); };
      const handleApproved = () => { refreshPendingSalary(); refreshPendingChanges(); refreshPendingRecruits(); };
      const handleRejected = () => { refreshPendingSalary(); refreshPendingChanges(); refreshPendingRecruits(); };
      const handlePayrollUpdated = () => refreshPayrollRun();

      window.addEventListener('salary:request-created', handleCreated);
      window.addEventListener('salary:request-approved', handleApproved);
      window.addEventListener('salary:request-rejected', handleRejected);
      window.addEventListener('employee:created', handleCreated);
      window.addEventListener('employee:updated', handleCreated);
      window.addEventListener('employee:approved', handleApproved);
      window.addEventListener('employee-change:updated', refreshPendingChanges);
      window.addEventListener('payroll:updated', handlePayrollUpdated);
      window.addEventListener('payroll:disbursed', handlePayrollUpdated);

      return () => {
         window.removeEventListener('salary:request-created', handleCreated);
         window.removeEventListener('salary:request-approved', handleApproved);
         window.removeEventListener('salary:request-rejected', handleRejected);
         window.removeEventListener('employee:created', handleCreated);
         window.removeEventListener('employee:updated', handleCreated);
         window.removeEventListener('employee:approved', handleApproved);
         window.removeEventListener('employee-change:updated', refreshPendingChanges);
         window.removeEventListener('payroll:updated', handlePayrollUpdated);
         window.removeEventListener('payroll:disbursed', handlePayrollUpdated);
      };
   }, [refreshPendingSalary, refreshPendingChanges, refreshPayrollRun, refreshPendingRecruits]);

   useEffect(() => {
      const fromContext = employees.filter(e => e.status === 'Pending Approval');
      if (fromContext.length > 0) {
         setPendingRecruits(prev => {
            const map = new Map<string, Employee>();
            prev.forEach(p => map.set(p.id, p));
            fromContext.forEach(p => map.set(p.id, p));
            return Array.from(map.values()).filter(p => p.status === 'Pending Approval');
         });
      }
   }, [employees]);

   const handleCertifyPayrollAsHR = async () => {
      if (!pendingPayrollRun) return;
      try {
         await payrollRunsService.signAsHR(
            pendingPayrollRun.id,
            user?.name || 'HR Officer',
            user?.role || 'hr',
            'HR verified active staff roster, leaves, and attendance telemetry.'
         );
         addNotification('success', `Roster certified for ${pendingPayrollRun.period}. Handed off to Finance.`);
         refreshPayrollRun();
      } catch (err: any) {
         addNotification('alert', err.message || 'Certification failed');
      }
   };

   // --- HOOKS ---
   const { displayedEmployees, totalCount, totalPages, isLoadingEmployees, canViewAll, restricted, isOnlyManagers } = useEmployeeData({
      user,
      activeSite: activeSite || null,
      filterSite,
      filterRole,
      filterStatus,
      filterDepartment,
      searchTerm,
      currentPage,
      ITEMS_PER_PAGE,
      country: effectiveCountry,
      countrySites: sites,
      fallbackEmployees: employees,
      regionCode: activeRegionCode || user?.regionCode
   });
   const actions = useEmployeeActions({ user, employees, updateEmployee, deleteEmployee, addNotification, updateUserAvatar });
   const wizard = useEmployeeWizard({ user, employees, sites, activeSite, addEmployee, addNotification });

   // --- HANDLERS ---
   const handlePhotoClick = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
         setPendingOnboardingImageSrc(reader.result as string);
         setIsOnboardingEditorOpen(true);
      };
      reader.readAsDataURL(file);
   };

   const handleSaveOnboardingPhoto = (croppedResult: string) => {
      wizard.setNewEmpData(prev => ({ ...prev, avatar: croppedResult }));
      setPendingOnboardingImageSrc(null);
      setIsOnboardingEditorOpen(false);
      addNotification('success', 'Profile photo adjusted for new recruit');
   };

   const handleTerminate = async (details?: any) => {
      if (!selectedEmployee) return;
      const success = await actions.handleTerminateEmployee(selectedEmployee, terminateInput, details);
      if (success) {
         setIsTerminateModalOpen(false);
         setTerminateInput('');
      }
   };

   // --- ACCESS CONTROL ---
   const canAccessDirectory = canViewAllEmployees(user?.role) || [
      'super_admin', 'admin', 'hr', 'hr_manager', 'regional_manager', 'operations_manager',
      'supply_chain_manager', 'store_manager', 'warehouse_manager', 'assistant_manager',
      'shift_lead', 'store_supervisor', 'logistics_manager', 'inventory_manager', 'security_manager', 'fleet_maintenance_supervisor'
   ].includes(user?.role || '');

   if (!canAccessDirectory) {
      const self = employees.find(e => e.id === user?.id || (user?.email && e.email === user.email));
      return self ? (
         <div className="p-6 max-w-7xl mx-auto">
            <StaffProfileView employee={self} isOwnProfile={true} />
         </div>
      ) : (
         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-4">
               <Shield size={26} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)] mb-2">Access Restricted</h2>
            <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm">You do not have permission to access the team directory.</p>
         </div>
      );
   }

   return (
      <div className="space-y-5 sm:space-y-6">
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            aria-label="Upload Employee Photo" 
            accept="image/*"
         />
         
         {/* Apple Section Header with Maker-Checker Sign-Offs */}
         <EmployeesHeader
            viewMode={viewMode}
            setViewMode={setViewMode}
            canViewAll={canViewAll}
            canOnboard={wizard.getCreatableRoles().length > 0}
            onOpenWizard={wizard.handleOpenWizard}
            userRole={user?.role}
            pendingSignOffsCount={
               pendingSalaryCount + 
               pendingChangeCount + 
               (pendingPayrollRun && !pendingPayrollRun.hrApprovedBy && pendingPayrollRun.status !== 'disbursed' && pendingPayrollRun.status !== 'rejected' ? 1 : 0) + 
               pendingRecruits.length
            }
            onOpenSignOffQueue={() => {
               if (pendingRecruits.length > 0) {
                  setViewMode('directory');
                  setFilterStatus('Pending Approval');
                  setCurrentPage(1);
               } else if (pendingSalaryCount > 0) {
                  setIsSalaryQueueOpen(true);
               } else if (pendingChangeCount > 0) {
                  setIsChangeApprovalModalOpen(true);
               }
            }}
         />

         <PhotoApprovalList photoRequests={actions.photoRequests} onApprove={actions.handleApprovePhoto} onReject={actions.handleRejectPhoto} />
         
         {/* Governance Alert Banners */}
         <EmployeeGovernanceBanners
            pendingSalaryCount={pendingSalaryCount}
            onOpenSalaryQueue={() => setIsSalaryQueueOpen(true)}
            pendingChangeCount={pendingChangeCount}
            onOpenChangeModal={() => setIsChangeApprovalModalOpen(true)}
            pendingPayrollRun={pendingPayrollRun}
            canViewAll={canViewAll}
            userRole={user?.role}
            onCertifyPayroll={handleCertifyPayrollAsHR}
            onNavigateFinance={() => navigate('/finance')}
            pendingRecruitsCount={pendingRecruits.length}
            filterStatus={filterStatus}
            onFilterPendingRecruits={() => { setFilterStatus('Pending Approval'); setCurrentPage(1); }}
            onShowAllRecruits={() => { setFilterStatus('All'); setCurrentPage(1); }}
         />

         {/* --- DIRECTORY TAB CONTENT --- */}
         {canViewAll && viewMode === 'directory' && (
            <EmployeeStats
               employees={employees}
               tasks={tasks}
               shifts={shifts}
               onlineIds={onlineIds}
               isTaskQueueOpen={isTaskQueueOpen}
               setIsTaskQueueOpen={setIsTaskQueueOpen}
            />
         )}

         {canViewAll && isTaskQueueOpen && (
            <GlobalTaskQueue tasks={tasks} employees={employees} setIsTaskQueueOpen={setIsTaskQueueOpen} />
         )}

         {viewMode === 'directory' && (
            <div className="space-y-4">
               <DirectoryHeader
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filterRole={filterRole}
                  setFilterRole={setFilterRole}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterDepartment={filterDepartment}
                  setFilterDepartment={setFilterDepartment}
                  filterSite={filterSite}
                  setFilterSite={setFilterSite}
                  sites={scopedSites}
                  layoutMode={layoutMode}
                  setLayoutMode={setLayoutMode}
                  isTaskQueueOpen={isTaskQueueOpen}
                  setIsTaskQueueOpen={setIsTaskQueueOpen}
                  totalCount={totalCount}
                  tasksCount={tasks.length}
                  canViewAll={canViewAll}
                  restricted={restricted}
                  setCurrentPage={setCurrentPage}
                  visibleEmployees={employees}
                  pendingSalaryCount={pendingSalaryCount}
                  onOpenSalaryQueue={() => setIsSalaryQueueOpen(true)}
                  isOnlyManagers={isOnlyManagers}
               />

               {layoutMode === 'grid' ? (
                  <DirectoryGrid
                     displayedEmployees={displayedEmployees}
                     isLoadingEmployees={isLoadingEmployees}
                     sites={sites}
                     setSelectedEmployee={setSelectedEmployee}
                     currentUser={user}
                     onlineIds={onlineIds}
                  />
               ) : (
                  <DirectoryList
                     displayedEmployees={displayedEmployees}
                     isLoadingEmployees={isLoadingEmployees}
                     sites={sites}
                     setSelectedEmployee={setSelectedEmployee}
                     canViewAll={canViewAll}
                     currentUser={user}
                  />
               )}

               <EmployeePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                  setCurrentPage={setCurrentPage}
               />
            </div>
         )}

         {/* --- OTHER TABS --- */}
         {viewMode === 'org' && (
            <OrgChart
               employees={employees && employees.length > 0 ? employees : (displayedEmployees || [])}
               sites={sites}
               isLoading={isLoadingEmployees}
               onlineIds={onlineIds}
               onSelectEmployee={setSelectedEmployee}
               onOpenAddEmployee={wizard.handleOpenWizard}
               onOpenIdCard={setIdCardEmployee}
            />
         )}

         {viewMode === 'shifts' && (
            <ShiftPlanner
               employees={employees}
               canEdit={hasPermission(user?.role, 'MANAGE_SHIFTS')}
               initialSiteFilter={filterSite !== 'All' ? filterSite : (activeSite?.id || 'All')}
            />
         )}

         {viewMode === 'recruitment' && <RecruitmentPipelineTab />}
         {viewMode === 'disciplinary' && <DisciplinaryRegisterTab />}
         {viewMode === 'access-audit' && <AccessReviewTab />}

         {/* Modals Container */}
         <EmployeeModals 
            selectedEmployee={selectedEmployee} 
            setSelectedEmployee={setSelectedEmployee} 
            idCardEmployee={idCardEmployee} 
            setIdCardEmployee={setIdCardEmployee} 
            isAddModalOpen={wizard.isAddModalOpen} 
            sites={sites}
            employees={employees}
            wizardProps={{ ...wizard, handlePhotoClick, fileInputRef, handleFileChange }} 
            terminateProps={{ 
               isOpen: isTerminateModalOpen, 
               onClose: () => setIsTerminateModalOpen(false), 
               onConfirm: handleTerminate, 
               input: terminateInput, 
               setInput: setTerminateInput,
               employee: selectedEmployee
            }} 
            deleteProps={{ 
               isOpen: actions.isDeleteModalOpen, 
               onClose: () => actions.setIsDeleteModalOpen(false), 
               onConfirm: actions.handleConfirmDelete, 
               input: actions.deleteInput, 
               setInput: actions.setDeleteInput,
               employee: actions.employeeToDelete
            }} 
            approveProps={{ 
               isOpen: actions.isApproveModalOpen, 
               onClose: () => actions.setIsApproveModalOpen(false), 
               onOpen: (emp: Employee) => {
                  actions.setEmployeeToApprove(emp);
                  actions.setIsApproveModalOpen(true);
               },
               employee: actions.employeeToApprove,
               handleConfirmApprove: async () => {
                  const emp = actions.employeeToApprove;
                  await actions.handleConfirmApprove();
                  if (selectedEmployee && emp && selectedEmployee.id === emp.id) {
                     setSelectedEmployee(prev => prev ? { ...prev, status: 'Active' } : null);
                  }
                  refreshPendingRecruits();
               }
            }} 
            validationProps={{ isOpen: false, onClose: () => {}, onConfirm: () => {}, message: '' }} 
            cropperProps={{ isOpen: false, onClose: () => {}, imageSrc: '', onCropComplete: () => {} }} 
            isProcessingImage={actions.isProcessingImage} 
            processingStatus={actions.processingStatus} 
            user={user}
            isOnboardingEditorOpen={isOnboardingEditorOpen}
            setIsOnboardingEditorOpen={setIsOnboardingEditorOpen}
            pendingOnboardingImageSrc={pendingOnboardingImageSrc}
            setPendingOnboardingImageSrc={setPendingOnboardingImageSrc}
            handleSaveOnboardingPhoto={handleSaveOnboardingPhoto}
         />

         {isSalaryQueueOpen && (
            <SalaryApprovalQueueModal
               isOpen={isSalaryQueueOpen}
               onClose={() => setIsSalaryQueueOpen(false)}
               onRequestsUpdated={refreshPendingSalary}
            />
         )}

         {isChangeApprovalModalOpen && (
            <EmployeeChangeApprovalModal
               isOpen={isChangeApprovalModalOpen}
               onClose={() => setIsChangeApprovalModalOpen(false)}
               onRequestsUpdated={refreshPendingChanges}
            />
         )}
      </div>
   );
}
