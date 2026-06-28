import React, { useState, useRef } from 'react';
import { Briefcase, User, Network, Calendar, UserPlus, Lock, Shield } from 'lucide-react';
import { Employee } from '../types';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useEmployeeData } from '../hooks/useEmployeeData';
import { useEmployeeActions } from '../hooks/useEmployeeActions';
import { useEmployeeWizard } from '../hooks/useEmployeeWizard';
import { Protected } from '../components/Protected';
import { hasPermission } from '../utils/permissions';
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

type ViewMode = 'directory' | 'org' | 'shifts';

export default function Employees() {
   const { user, updateUserAvatar } = useStore();
   const { employees, addEmployee, updateEmployee, deleteEmployee, activeSite, sites, addNotification, tasks } = useData();

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

   // --- HOOKS ---
   const { displayedEmployees, totalCount, totalPages, isLoadingEmployees, canViewAll, restricted } = useEmployeeData({
      user, activeSite, filterSite, filterRole, filterStatus, filterDepartment, searchTerm, currentPage, ITEMS_PER_PAGE: 20
   });
   const actions = useEmployeeActions({ user, employees, updateEmployee, deleteEmployee, addNotification, updateUserAvatar });
   const wizard = useEmployeeWizard({ user, employees, sites, activeSite, addEmployee, addNotification });

   // --- HANDLERS ---
   const handleTerminate = async () => {
      if (!selectedEmployee || terminateInput !== "TERMINATE") return;
      await updateEmployee({ ...selectedEmployee, status: 'Terminated' }, user?.name || 'System');
      addNotification('success', 'Employee terminated.');
      setIsTerminateModalOpen(false);
   };

   // --- ACCESS CONTROL ---
   const isPrivileged = ['super_admin', 'hr', 'hr_manager', 'admin'].includes(user?.role || '');
   if (!isPrivileged) {
      const self = employees.find(e => e.id === user?.id || (user?.email && e.email === user.email));
      return self ? <div className="p-6 max-w-7xl mx-auto"><StaffProfileView employee={self} isOwnProfile={true} onRequestPhotoChange={() => fileInputRef.current?.click()} /></div> : 
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6"><Shield size={64} className="text-stone-400 dark:text-gray-600 mb-4" /><h2 className="text-2xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-2">Access Restricted</h2></div>;
   }

   return (
      <div className="space-y-6">
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={() => {}} 
            className="hidden" 
            aria-label="Upload Employee Photo" 
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
                <div className="flex bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-1 mr-4">
                   {[ { id: 'directory', icon: User, label: 'Directory' }, { id: 'org', icon: Network, label: 'Org Chart' }, { id: 'shifts', icon: Calendar, label: 'Shift Planner' } ].map(v => (
                      <button key={v.id} onClick={() => setViewMode(v.id as ViewMode)} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold cursor-pointer ${viewMode === v.id ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24]' : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white hover:bg-stone-200/20 dark:hover:bg-white/5'}`}><v.icon size={16} />{v.label}</button>
                   ))}
                </div>
                {wizard.getCreatableRoles().length > 0 ? (
                   <Protected permission="ADD_EMPLOYEE"><button onClick={wizard.handleOpenWizard} className="woody-btn-primary flex items-center cursor-pointer"><UserPlus className="w-4 h-4 mr-2" />Onboard Talent</button></Protected>
                ) : <div className="px-4 py-2 rounded-lg bg-[#FAF8F5] dark:bg-white/5 border border-[#E2DCCE] dark:border-white/5 text-[#2C5E3B] dark:text-gray-400 text-sm flex items-center gap-2"><Lock size={14} /><span>{canViewAll ? 'Hiring Restricted' : 'My HR Profile'}</span></div>}
             </div>
         </div>

         <PhotoApprovalList photoRequests={actions.photoRequests} onApprove={actions.handleApprovePhoto} onReject={actions.handleRejectPhoto} />
         {canViewAll && viewMode === 'directory' && <EmployeeStats employees={employees} tasks={tasks} isTaskQueueOpen={isTaskQueueOpen} setIsTaskQueueOpen={setIsTaskQueueOpen} />}
         {canViewAll && isTaskQueueOpen && <GlobalTaskQueue tasks={tasks} employees={employees} setIsTaskQueueOpen={setIsTaskQueueOpen} />}

         {viewMode === 'directory' && (
            <div className="space-y-6">
               <DirectoryHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterRole={filterRole} setFilterRole={setFilterRole} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterDepartment={filterDepartment} setFilterDepartment={setFilterDepartment} filterSite={filterSite} setFilterSite={setFilterSite} sites={sites} layoutMode={layoutMode} setLayoutMode={setLayoutMode} isTaskQueueOpen={isTaskQueueOpen} setIsTaskQueueOpen={setIsTaskQueueOpen} totalCount={totalCount} tasksCount={tasks.length} canViewAll={canViewAll} restricted={restricted} setCurrentPage={setCurrentPage} visibleEmployees={employees} />
               {layoutMode === 'grid' ? <DirectoryGrid displayedEmployees={displayedEmployees} isLoadingEmployees={isLoadingEmployees} sites={sites} setSelectedEmployee={setSelectedEmployee} currentUser={user} /> : <DirectoryList displayedEmployees={displayedEmployees} isLoadingEmployees={isLoadingEmployees} sites={sites} setSelectedEmployee={setSelectedEmployee} canViewAll={canViewAll} currentUser={user} />}
               <EmployeePagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} ITEMS_PER_PAGE={20} setCurrentPage={setCurrentPage} />
            </div>
         )}
         {viewMode === 'org' && <OrgChart employees={employees} sites={sites} />}
         {viewMode === 'shifts' && <ShiftPlanner employees={employees} canEdit={hasPermission(user?.role, 'MANAGE_SHIFTS')} />}

         <EmployeeModals 
            selectedEmployee={selectedEmployee} 
            setSelectedEmployee={setSelectedEmployee} 
            idCardEmployee={idCardEmployee} 
            setIdCardEmployee={setIdCardEmployee} 
            isAddModalOpen={wizard.isAddModalOpen} 
            sites={sites}
            employees={employees}
            wizardProps={wizard} 
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
               employee: actions.employeeToApprove,
               handleConfirmApprove: actions.handleConfirmApprove 
            }} 
            validationProps={{ isOpen: false, onClose: () => {}, onConfirm: () => {}, message: '' }} 
            cropperProps={{ isOpen: false, onClose: () => {}, imageSrc: '', onCropComplete: () => {} }} 
            isProcessingImage={actions.isProcessingImage} 
            processingStatus={actions.processingStatus} 
         />
      </div>
   );
}
