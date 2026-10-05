import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Network, Calendar, UserPlus, Lock, Shield, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
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
import RecruitmentPipelineTab from '../components/employees/recruitment/RecruitmentPipelineTab';
import DisciplinaryRegisterTab from '../components/employees/disciplinary/DisciplinaryRegisterTab';
import AccessReviewTab from '../components/employees/compliance/AccessReviewTab';
import { salaryRequestsService } from '../services/salary-requests.service';
import { employeeChangesService } from '../services/employee-changes.service';
import { payrollRunsService } from '../services/payroll-runs.service';

type ViewMode = 'directory' | 'recruitment' | 'disciplinary' | 'access-audit' | 'org' | 'shifts';

export default function Employees() {
   const navigate = useNavigate();
   const { user, updateUserAvatar, onlineIds } = useStore();
   const { employees, addEmployee, updateEmployee, deleteEmployee, activeSite, sites, addNotification, tasks, shifts, effectiveCountry } = useData();

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

   useEffect(() => {
      refreshPendingSalary();
      refreshPendingChanges();
      refreshPayrollRun();
      const handleCreated = () => { refreshPendingSalary(); refreshPendingChanges(); };
      const handleApproved = () => { refreshPendingSalary(); refreshPendingChanges(); };
      const handleRejected = () => { refreshPendingSalary(); refreshPendingChanges(); };
      const handlePayrollUpdated = () => refreshPayrollRun();

      window.addEventListener('salary:request-created', handleCreated);
      window.addEventListener('salary:request-approved', handleApproved);
      window.addEventListener('salary:request-rejected', handleRejected);
      window.addEventListener('employee-change:updated', refreshPendingChanges);
      window.addEventListener('payroll:updated', handlePayrollUpdated);
      window.addEventListener('payroll:disbursed', handlePayrollUpdated);

      return () => {
         window.removeEventListener('salary:request-created', handleCreated);
         window.removeEventListener('salary:request-approved', handleApproved);
         window.removeEventListener('salary:request-rejected', handleRejected);
         window.removeEventListener('employee-change:updated', refreshPendingChanges);
         window.removeEventListener('payroll:updated', handlePayrollUpdated);
         window.removeEventListener('payroll:disbursed', handlePayrollUpdated);
      };
   }, [refreshPendingSalary, refreshPendingChanges, refreshPayrollRun]);

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
   const { displayedEmployees, totalCount, totalPages, isLoadingEmployees, canViewAll, restricted } = useEmployeeData({
      user,
      activeSite: activeSite || null,
      filterSite,
      filterRole,
      filterStatus,
      filterDepartment,
      searchTerm,
      currentPage,
      ITEMS_PER_PAGE: 20,
      country: effectiveCountry,
      countrySites: sites,
      fallbackEmployees: employees
   });
   const actions = useEmployeeActions({ user, employees, updateEmployee, deleteEmployee, addNotification, updateUserAvatar });
   const wizard = useEmployeeWizard({ user, employees, sites, activeSite, addEmployee, addNotification });
   const pendingRecruits = employees.filter(e => e.status === 'Pending Approval');

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
      return self ? <div className="p-6 max-w-7xl mx-auto"><StaffProfileView employee={self} isOwnProfile={true} /></div> : 
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6"><Shield size={64} className="text-stone-400 dark:text-gray-600 mb-4" /><h2 className="text-2xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-2">Access Restricted</h2></div>;
   }

   return (
      <div className="space-y-6">
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            aria-label="Upload Employee Photo" 
            accept="image/*"
         />
         
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2.5">
                  <Briefcase className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                  Human Capital Management
               </h2>
               <p className="text-[#4D6E56] dark:text-gray-400 text-sm font-medium">Orchestrate your workforce, track performance, and manage shifts.</p>
            </div>
             <div className="flex items-center gap-3">
                <div className="flex bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-1 mr-4 overflow-x-auto max-w-[55vw]">
                   {[ 
                      { id: 'directory', icon: User, label: 'Directory' }, 
                      ...(canViewAll ? [
                         { id: 'recruitment', icon: Briefcase, label: 'Recruitment' },
                         { id: 'disciplinary', icon: AlertTriangle, label: 'Disciplinary' },
                         { id: 'access-audit', icon: Shield, label: 'Access Review' }
                      ] : []),
                      { id: 'org', icon: Network, label: 'Org Chart' }, 
                      { id: 'shifts', icon: Calendar, label: 'Shift Planner' } 
                   ].map(v => (
                      <button key={v.id} onClick={() => setViewMode(v.id as ViewMode)} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${viewMode === v.id ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24]' : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white hover:bg-stone-200/20 dark:hover:bg-white/5'}`}><v.icon size={14} />{v.label}</button>
                   ))}
                </div>
                {wizard.getCreatableRoles().length > 0 ? (
                   <Protected permission="ADD_EMPLOYEE"><button onClick={wizard.handleOpenWizard} className="woody-btn-primary flex items-center cursor-pointer"><UserPlus className="w-4 h-4 mr-2" />Onboard Talent</button></Protected>
                ) : <div className="px-4 py-2 rounded-lg bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/5 text-[#2C5E3B] dark:text-gray-400 text-sm flex items-center gap-2"><Lock size={14} /><span>{canViewAll ? 'Hiring Restricted' : 'My HR Profile'}</span></div>}
             </div>
         </div>

         <PhotoApprovalList photoRequests={actions.photoRequests} onApprove={actions.handleApprovePhoto} onReject={actions.handleRejectPhoto} />
         
         {pendingSalaryCount > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                     <ShieldCheck size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
                        {pendingSalaryCount} Compensation Adjustment {pendingSalaryCount === 1 ? 'Proposal' : 'Proposals'} Awaiting Authorization
                     </h4>
                     <p className="text-xs text-emerald-800 dark:text-emerald-400/80">
                        Dual-Control 4-Eyes Governance: Compensation changes proposed by HR require Finance Manager or CEO co-signature.
                     </p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={() => setIsSalaryQueueOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 shadow-xs"
               >
                  Review Salary Queue
               </button>
            </div>
         )}

         {pendingChangeCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
                     <ShieldCheck size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-amber-950 dark:text-amber-300">
                        {pendingChangeCount} Cross-Department Profile {pendingChangeCount === 1 ? 'Change' : 'Changes'} Awaiting Sign-Off
                     </h4>
                     <p className="text-xs text-amber-800 dark:text-amber-400/80">
                        Segregation of Duties: HR modifications to legal identity, age, departments, or roles require managerial authorization.
                     </p>
                  </div>
               </div>
               <button
                  type="button"
                  onClick={() => setIsChangeApprovalModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 shadow-xs"
               >
                  Review Approvals Queue
               </button>
            </div>
         )}

         {pendingPayrollRun && !pendingPayrollRun.hrApprovedBy && pendingPayrollRun.status !== 'disbursed' && pendingPayrollRun.status !== 'rejected' && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex-shrink-0">
                     <DollarSign size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-blue-950 dark:text-blue-300">
                        Monthly Payroll Cycle ({pendingPayrollRun.period}) Awaiting HR Certification
                     </h4>
                     <p className="text-xs text-blue-800 dark:text-blue-400/80">
                        Zero-Trust Multi-Department Governance: Staff roster, active attendance, and leave deductions must be certified by HR before Finance can release funds.
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                  <button
                     type="button"
                     onClick={() => navigate('/finance')}
                     className="px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-white/10 dark:hover:bg-white/15 text-blue-900 dark:text-blue-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                     Details in Financials
                  </button>
                  {canViewAll && (user?.role === 'hr' || user?.role === 'hr_manager' || user?.role === 'super_admin') && (
                     <button
                        type="button"
                        onClick={handleCertifyPayrollAsHR}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                     >
                        <ShieldCheck size={14} />
                        <span>Certify Roster & Attendance</span>
                     </button>
                  )}
               </div>
            </div>
         )}
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
         {canViewAll && isTaskQueueOpen && <GlobalTaskQueue tasks={tasks} employees={employees} setIsTaskQueueOpen={setIsTaskQueueOpen} />}

         {viewMode === 'directory' && (
            <div className="space-y-6">
               {pendingRecruits.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                           <AlertTriangle size={20} />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                              {pendingRecruits.length} Pending Onboarding {pendingRecruits.length === 1 ? 'Recruit' : 'Recruits'} Awaiting Approval
                           </h4>
                           <p className="text-xs text-amber-700 dark:text-amber-400/80">
                              Talent onboarded with "Pending Approval" require authorization from HR or Super Admin before activating system access.
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {filterStatus !== 'Pending Approval' ? (
                           <button
                              onClick={() => {
                                 setFilterStatus('Pending Approval');
                                 setCurrentPage(1);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                           >
                              Filter Pending ({pendingRecruits.length})
                           </button>
                        ) : (
                           <button
                              onClick={() => {
                                 setFilterStatus('All');
                                 setCurrentPage(1);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                           >
                              Show All
                           </button>
                        )}
                     </div>
                  </div>
               )}
               <DirectoryHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterRole={filterRole} setFilterRole={setFilterRole} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterDepartment={filterDepartment} setFilterDepartment={setFilterDepartment} filterSite={filterSite} setFilterSite={setFilterSite} sites={sites} layoutMode={layoutMode} setLayoutMode={setLayoutMode} isTaskQueueOpen={isTaskQueueOpen} setIsTaskQueueOpen={setIsTaskQueueOpen} totalCount={totalCount} tasksCount={tasks.length} canViewAll={canViewAll} restricted={restricted} setCurrentPage={setCurrentPage} visibleEmployees={employees} pendingSalaryCount={pendingSalaryCount} onOpenSalaryQueue={() => setIsSalaryQueueOpen(true)} />
               {layoutMode === 'grid' ? <DirectoryGrid displayedEmployees={displayedEmployees} isLoadingEmployees={isLoadingEmployees} sites={sites} setSelectedEmployee={setSelectedEmployee} currentUser={user} onlineIds={onlineIds} /> : <DirectoryList displayedEmployees={displayedEmployees} isLoadingEmployees={isLoadingEmployees} sites={sites} setSelectedEmployee={setSelectedEmployee} canViewAll={canViewAll} currentUser={user} />}
               <EmployeePagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} ITEMS_PER_PAGE={20} setCurrentPage={setCurrentPage} />
            </div>
         )}
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
