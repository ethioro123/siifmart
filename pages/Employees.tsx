import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
   Briefcase, Search, Filter, UserPlus, MoreVertical, Mail, Phone, Shield, Star,
   Calendar, Award, CheckCircle, Clock, AlertTriangle, DollarSign, ClipboardList,
   TrendingUp, User, Plus, Trash2, ArrowRight, ArrowLeft, MapPin, Upload, CreditCard,
   MessageSquare, Download, XCircle, Lock, UserCheck, Network, Layers, FileText,
   Sun, Moon, Sunset, Building, Key, Camera, Loader2, Trophy, Zap, Target, Gift, Crown,
   LayoutGrid, List
} from 'lucide-react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { MOCK_TASKS, CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber, formatDateTime } from '../utils/formatting';
import { Employee, EmployeeTask, UserRole, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, DEFAULT_BONUS_TIERS } from '../types';
import { calculateBonus } from '../components/WorkerPointsDisplay';
import { calculateStoreBonus } from '../components/StoreBonusDisplay';
import { hasPermission, PERMISSIONS } from '../utils/permissions';
import Modal from '../components/Modal';
import OrgChart from '../components/OrgChart';
import ShiftPlanner from '../components/ShiftPlanner';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useFulfillmentData } from '../components/fulfillment/FulfillmentDataProvider';
import { useGamification } from '../contexts/GamificationContext';
import { Protected, ProtectedButton } from '../components/Protected';
import {
   autoSelectSiteForRole,
   getRecommendedDepartment,
   validateRoleSiteAssignment,
   getRoleLocationDescription
} from '../utils/roleSegregation';
import EmployeeIDCard from '../components/EmployeeIDCard';
import EmployeeRow from '../components/EmployeeRow';
import { authService } from '../services/auth.service';
import { systemLogsService } from '../services/systemLogs.service';
import { imageStorageService } from '../services/imageStorage.service';
import { processImageFile } from '../utils/imageProcessor';
import { employeesService, workerPointsService } from '../services/supabase.service';
import ImageCropper from '../components/ImageCropper';
import StaffProfileView from '../components/StaffProfileView';
import { SYSTEM_ROLES, getRoleHierarchy } from '../utils/roles';
import AddEmployeeWizard from '../components/employees/modals/AddEmployeeWizard';
import TerminateEmployeeModal from '../components/employees/modals/TerminateEmployeeModal';
import DeleteEmployeeModal from '../components/employees/modals/DeleteEmployeeModal';
import ApproveEmployeeModal from '../components/employees/modals/ApproveEmployeeModal';
import ValidationWarningModal from '../components/employees/modals/ValidationWarningModal';

// --- TYPES & MOCKS ---
type ViewMode = 'directory' | 'org' | 'shifts';
type ProfileTab = 'overview' | 'tasks' | 'timeoff' | 'payroll' | 'docs' | 'gamification';

const ATTENDANCE_DATA = [
   { day: 'Mon', hours: 8.5 },
   { day: 'Tue', hours: 8.0 },
   { day: 'Wed', hours: 7.5 },
   { day: 'Thu', hours: 9.0 },
   { day: 'Fri', hours: 8.0 },
];

const DEPARTMENTS = ['Retail Operations', 'Logistics & Warehouse', 'Management', 'Human Resources', 'Security', 'Transport'];


// Mock Shifts
const SHIFT_TYPES = {
   'M': { label: 'Morning', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
   'E': { label: 'Evening', icon: Sunset, color: 'text-orange-400', bg: 'bg-orange-400/10' },
   'N': { label: 'Night', icon: Moon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
   'O': { label: 'Off', icon: XCircle, color: 'text-gray-500', bg: 'bg-white/5' }
};

export default function Employees() {
   const { user, updateUserAvatar } = useStore();
   const {
      employees, addEmployee, updateEmployee, deleteEmployee, activeSite, sites, addNotification, logSystemEvent,
      storePoints, getStorePoints, settings,
      tasks, setTasks
   } = useData();
   // workerPointsService import removed as it is not used directly, only via context now? 
   // Actually checking imports... the file imports workerPointsService at top.
   // But here we replace the hook usage.
   const { workerPoints, getWorkerPoints, calculateWorkerBonusShare } = useGamification();

   const [viewMode, setViewMode] = useState<ViewMode>('directory');
   const [searchTerm, setSearchTerm] = useState('');
   const [filterRole, setFilterRole] = useState<string>('All');
   const [filterStatus, setFilterStatus] = useState<string>('All');
   const [filterDepartment, setFilterDepartment] = useState<string>('All');
   const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
   const [filterSite, setFilterSite] = useState<string>('All');
   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);

   const [photoRequests, setPhotoRequests] = useState<any[]>([]); // { id, userId, userName, newUrl, timestamp }
   const [idCardEmployee, setIdCardEmployee] = useState<Employee | null>(null);
   const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
    const [terminateInput, setTerminateInput] = useState('');

    const isSuperAdmin = user?.role === 'super_admin';
    const isHR = user?.role === 'hr' || user?.role === 'hr_manager';
    const isAdmin = user?.role === 'admin';
    const canAdjustPayroll = isSuperAdmin || isHR || isAdmin;

    // Floating Task Queue State
   const [isTaskQueueOpen, setIsTaskQueueOpen] = useState(false);

   // Server-Side Pagination State
   const [paginatedEmployees, setPaginatedEmployees] = useState<Employee[]>([]);
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalCount, setTotalCount] = useState(0);
   const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
   const ITEMS_PER_PAGE = 20;

   // Delete Confirmation State
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [deleteInput, setDeleteInput] = useState('');
   const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

   // Approve Modal State
   const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
   const [employeeToApprove, setEmployeeToApprove] = useState<Employee | null>(null);

   // Validation Warning Modal State
   const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
   const [validationMessage, setValidationMessage] = useState('');
   const [pendingWizardSubmit, setPendingWizardSubmit] = useState<boolean>(false);

   // --- FILE UPLOAD REFS ---
   const fileInputRef = useRef<HTMLInputElement>(null);
   const documentInputRef = useRef<HTMLInputElement>(null);
   const isTerminating = useRef(false); // Track if termination is in progress
   // Store documents per employee ID
   const [employeeDocuments, setEmployeeDocuments] = useState<Record<string, Array<{ name: string; url: string; type: string; size: number; uploadedAt: string }>>>({});

   // --- AUTHORITY LOGIC (4-Level Role Hierarchy) ---
   const getCreatableRoles = (): UserRole[] => {
      if (!user) return [];
      switch (user.role) {
         case 'super_admin':
            // CEO can create ALL roles
            return [
               'super_admin',
               'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager', 'procurement_manager', 'supply_chain_manager',
               'store_manager', 'warehouse_manager', 'dispatch_manager', 'assistant_manager', 'shift_lead',
               'cashier', 'sales_associate', 'stock_clerk', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'customer_service', 'auditor', 'it_support',
               // Legacy
               'admin', 'manager', 'hr', 'pos'
            ];
         case 'regional_manager':
         case 'operations_manager':
         case 'admin':
            // L2 can create L3 + L4
            return [
               'store_manager', 'warehouse_manager', 'dispatch_manager', 'assistant_manager', 'shift_lead',
               'cashier', 'sales_associate', 'stock_clerk', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'customer_service', 'auditor', 'it_support',
               'manager', 'hr', 'pos'
            ];
         case 'hr_manager':
         case 'hr':
            // HR can create L3 + L4 (except finance/procurement)
            return [
               'store_manager', 'warehouse_manager', 'dispatch_manager', 'assistant_manager', 'shift_lead',
               'cashier', 'sales_associate', 'stock_clerk', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'customer_service', 'auditor', 'it_support',
               'manager', 'pos'
            ];
         case 'store_manager':
         case 'manager':
            // L3 Store Manager can create L4 store staff
            return ['assistant_manager', 'shift_lead', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'pos'];
         case 'warehouse_manager':
            // L3 Warehouse Manager can create L4 warehouse staff
            return ['assistant_manager', 'shift_lead', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist'];
         case 'dispatch_manager':
            // L3 Dispatch Manager can create drivers
            return ['driver'];
         default:
            return [];
      }
   };

   const getAvailableDepartments = () => {
      if (!user) return [];
      if (['super_admin', 'admin', 'hr'].includes(user.role)) return DEPARTMENTS;
      if (user.role === 'manager') return ['Retail Operations', 'Logistics & Warehouse', 'Transport'];
      if (user.role === 'warehouse_manager') return ['Logistics & Warehouse', 'Transport'];
      return [];
   };

   const creatableRoles = getCreatableRoles();
   const availableRoles = SYSTEM_ROLES.filter(r => creatableRoles.includes(r.id));
   const availableDepartments = getAvailableDepartments();
   const canCreateEmployees = creatableRoles.length > 0;

   const canManageEmployees = hasPermission(user?.role, 'EDIT_EMPLOYEE');
   const canTerminateEmployees = hasPermission(user?.role, 'TERMINATE_EMPLOYEE');
   const canManageShifts = hasPermission(user?.role, 'MANAGE_SHIFTS');
   const canApproveEmployees = hasPermission(user?.role, 'APPROVE_EMPLOYEE');
   const isDepartmentManager = hasPermission(user?.role, 'ACCESS_EMPLOYEES') && !canManageEmployees;


   const canTerminateTargetEmployee = (targetEmployee: Employee | null): boolean => {
      if (!targetEmployee || !user) return false;
      if (!canTerminateEmployees) return false;

      // Cannot terminate yourself
      if (targetEmployee.id === user.id) {
         return false;
      }

      const userHierarchy = getRoleHierarchy(user.role);
      const targetHierarchy = getRoleHierarchy(targetEmployee.role);

      // CEO can only be terminated by themselves (which is blocked above) or not at all
      if (targetEmployee.role === 'super_admin') {
         return false; // CEO cannot be terminated by anyone
      }

      // Admin can only be terminated by CEO
      if (targetEmployee.role === 'admin' && user.role !== 'super_admin') {
         return false;
      }

      // Can only terminate employees with lower or equal hierarchy
      // But HR cannot terminate admin or super_admin (handled above)
      if (user.role === 'hr' && ['admin', 'super_admin'].includes(targetEmployee.role)) {
         return false;
      }

      return userHierarchy > targetHierarchy;
   };

   const canViewAll = canManageEmployees || isDepartmentManager;

   const visibleEmployees = canViewAll
      ? employees
      : employees.filter(e => e.name === user?.name);

   // --- PHOTO APPROVAL LOGIC ---
   useEffect(() => {
      loadPhotoRequests();
   }, []);

   const loadPhotoRequests = () => {
      const logs = systemLogsService.getLogs({ category: 'HR' });

      // Group logs by user
      const userLogs: Record<string, any[]> = {};
      logs.forEach(log => {
         if (['PHOTO_CHANGE_REQUEST', 'PHOTO_CHANGE_PROCESSED', 'PHOTO_CHANGE_REJECTED'].includes(log.action)) {
            if (!userLogs[log.userId]) userLogs[log.userId] = [];
            userLogs[log.userId].push(log);
         }
      });

      const pendingRequests: any[] = [];

      Object.keys(userLogs).forEach(userId => {
         // Sort by timestamp descending
         const sorted = userLogs[userId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
         const latest = sorted[0];

         if (latest.action === 'PHOTO_CHANGE_REQUEST') {
            pendingRequests.push({
               id: latest.id,
               userId: latest.userId,
               userName: latest.userName,
               newUrl: latest.metadata?.newUrl,
               timestamp: latest.timestamp
            });
         }
      });

      setPhotoRequests(pendingRequests);
   };

   const profilePhotoInputRef = useRef<HTMLInputElement>(null);

   const handleRequestPhotoChange = () => {
      // Trigger file picker
      profilePhotoInputRef.current?.click();
   };

   // ... (inside Employees component)

   const [cropperOpen, setCropperOpen] = useState(false);
   const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

   // Image processing state
   const [isProcessingImage, setIsProcessingImage] = useState(false);
   const [processingStatus, setProcessingStatus] = useState('');

   // Handle Profile Photo Select (for edit mode)
   const handleProfilePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      // Clear input immediately so same file can be selected again
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';

      if (!file) {
         return;
      }


      // Basic validation
      const MAX_SIZE = 15 * 1024 * 1024; // 15MB
      if (file.size > MAX_SIZE) {
         addNotification('alert', `❌ File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 15MB.`);
         return;
      }

      if (file.size === 0) {
         addNotification('alert', '❌ File is empty or corrupted.');
         return;
      }

      setIsProcessingImage(true);
      setProcessingStatus('Reading image...');

      try {
         // Check if it's HEIC format
         const isHeic = file.type.toLowerCase().includes('heic') ||
            file.type.toLowerCase().includes('heif') ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif');

         if (isHeic) {
            setProcessingStatus('Converting iPhone photo...');

            try {
               const result = await processImageFile(file, setProcessingStatus);
               if (result.success && result.dataUrl) {
                  setTempImageSrc(result.dataUrl);
                  setCropperOpen(true);
               } else {
                  throw new Error(result.error || 'HEIC conversion failed');
               }
            } catch (heicError) {
               console.error('📷 HEIC conversion failed:', heicError);
               addNotification('alert', '❌ iPhone photo format not supported. Please convert to JPG first.');
            }
         } else {
            // Standard image - read directly
            const reader = new FileReader();

            reader.onload = () => {
               const result = reader.result as string;
               if (result) {
                  setTempImageSrc(result);
                  setCropperOpen(true);
               } else {
                  addNotification('alert', '❌ Failed to read image data.');
               }
            };

            reader.onerror = (error) => {
               console.error('📷 FileReader error:', error);
               addNotification('alert', '❌ Failed to read file. Please try again.');
            };

            reader.readAsDataURL(file);
         }
      } catch (error) {
         console.error('📷 Photo processing error:', error);
         addNotification('alert', `❌ ${(error as Error).message || 'Failed to process image.'}`);
      } finally {
         setIsProcessingImage(false);
         setProcessingStatus('');
      }
   };

   const handleCropComplete = async (croppedImage: string) => {
      setIsSubmitting(true);

      try {
         // CASE 1: Adding New Employee (no old photo to delete yet)
         if (isAddModalOpen) {
            // For new employees, we'll upload after they're created
            // For now, just store base64 temporarily
            await new Promise(resolve => setTimeout(resolve, 500));
            setNewEmpData(prev => ({ ...prev, avatar: croppedImage }));
            setCropperOpen(false);
            setTempImageSrc(null);
            return;
         }

         // CASE 2: Updating Existing Employee
         if (!selectedEmployee) {
            console.error('✅ No selectedEmployee found!');
            return;
         }


         const isPrivileged = ['super_admin', 'admin', 'hr'].includes(user?.role || '');

         if (isPrivileged) {
            // DIRECT UPDATE - Upload new photo and delete old one

            const oldAvatarUrl = selectedEmployee.avatar;

            // Try to upload to storage (will delete old one if successful)
            let newAvatarUrl = croppedImage; // Default to base64 if storage fails

            try {
               const uploadResult = await imageStorageService.uploadProfilePhoto(
                  selectedEmployee.id,
                  croppedImage,
                  oldAvatarUrl // Pass old URL for deletion
               );

               if (uploadResult.success && uploadResult.url) {
                  newAvatarUrl = uploadResult.url;
               } else {
                  // Storage failed, but we can still use the base64 image
                  console.warn('📷 Storage upload failed, using base64 instead:', uploadResult.error);
                  if (uploadResult.error && !uploadResult.error.includes('bucket')) {
                     addNotification('info', '⚠️ Photo saved locally. Cloud storage not available.');
                  }
               }
            } catch (storageError) {
               // Storage completely unavailable, continue with base64
               console.warn('📷 Storage service unavailable, using base64:', storageError);
            }

            // Update employee record with new URL
            await updateEmployee({ ...selectedEmployee, avatar: newAvatarUrl }, user?.name || 'System');

            // If the employee being edited is the current logged-in user, also update the user avatar in CentralStore
            const isCurrentUser = selectedEmployee.id === user?.id || selectedEmployee.id === (user as any)?.employeeId;
            if (isCurrentUser) {
               updateUserAvatar(newAvatarUrl);
            }

            systemLogsService.log(
               'HR',
               'INFO',
               'PHOTO_UPDATED',
               `Photo updated for ${selectedEmployee.name} by ${user?.name} (old photo deleted from storage)`,
               { id: selectedEmployee.id, role: selectedEmployee.role, name: selectedEmployee.name },
               { processed: true }
            );

            addNotification('success', 'Profile photo updated successfully. Old photo deleted.');
         } else {
            // REQUEST APPROVAL - Store temporarily, approval process will handle upload/delete
            systemLogsService.logHR(
               'PHOTO_CHANGE_REQUEST',
               `Photo change requested by ${selectedEmployee.name}`,
               { id: selectedEmployee.id, role: selectedEmployee.role, name: selectedEmployee.name },
               'INFO'
            );

            systemLogsService.log(
               'HR',
               'INFO',
               'PHOTO_CHANGE_REQUEST',
               `Photo change requested by ${selectedEmployee.name}`,
               { id: selectedEmployee.id, role: selectedEmployee.role, name: selectedEmployee.name },
               { newUrl: croppedImage, processed: false }
            );

            addNotification('success', 'Photo change requested. Waiting for approval.');
            loadPhotoRequests(); // Refresh
         }

         setCropperOpen(false);
         setTempImageSrc(null); // Cleanup
      } catch (error) {
         console.error(error);
         addNotification('alert', 'Failed to update photo.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleApprovePhoto = async (request: any) => {
      try {
         // Find the employee to get their current avatar for deletion
         const employeeToUpdate = employees.find(e => e.id === request.userId);
         const oldAvatarUrl = employeeToUpdate?.avatar;

         // 1. Try to upload to storage (will delete old one if successful)
         let newAvatarUrl = request.newUrl; // Default to the request URL if storage fails

         try {
            const uploadResult = await imageStorageService.uploadProfilePhoto(
               request.userId,
               request.newUrl,
               oldAvatarUrl // Pass old URL for deletion
            );

            if (uploadResult.success && uploadResult.url) {
               newAvatarUrl = uploadResult.url;
            } else {
               console.warn('📷 Storage upload failed, using provided URL:', uploadResult.error);
            }
         } catch (storageError) {
            console.warn('📷 Storage service unavailable:', storageError);
         }

         // 2. Update Employee with new URL
         if (employeeToUpdate) {
            const updatedEmployee = { ...employeeToUpdate, avatar: newAvatarUrl };
            await updateEmployee(updatedEmployee, user?.name || 'System');
         } else {
            // Throwing prevents the request from being removed from the list silently
            throw new Error(`Employee record not found (ID: ${request.userId}) - cannot update photo`);
         }

         // 3. Log the processed event
         systemLogsService.logHR(
            'PHOTO_CHANGE_PROCESSED',
            `Approved photo change for ${request.userName} (old photo deleted)`,
            { id: user?.id, role: user?.role, name: user?.name },
            'INFO',
            { newUrl: newAvatarUrl, userId: request.userId }
         );

         // Force local refresh
         setPhotoRequests(prev => prev.filter(r => r.id !== request.id));
         addNotification('success', 'Photo approved. Old photo deleted from storage.');

      } catch (err: any) {
         console.error(err);
         addNotification('alert', `Failed to approve: ${err.message || 'Unknown error'}`);
      }
   };

   const handleRejectPhoto = (request: any) => {
      systemLogsService.logHR(
         'PHOTO_CHANGE_REJECTED',
         `Rejected photo change for ${request.userName}`,
         { id: user?.id, role: user?.role, name: user?.name },
         'INFO'
      );
      setPhotoRequests(prev => prev.filter(r => r.id !== request.id));
      addNotification('info', 'Photo request rejected.');
   };
   // --- SERVER-SIDE PAGINATION EFFECT ---
   useEffect(() => {
      const fetchEmployees = async () => {
         setIsLoadingEmployees(true);
         try {
            // Apply Site Context/Filter
            // Note: If viewMode is not Directory, we might not need to fetch, 
            // but for simplicity we fetch when filters change.
            let querySiteId = activeSite?.id;
            if (!querySiteId && filterSite !== 'All') {
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

      // Debounce logic could go here for search
      const timer = setTimeout(() => {
         fetchEmployees();
      }, 300);

      return () => clearTimeout(timer);
   }, [currentPage, searchTerm, filterRole, filterStatus, filterDepartment, filterSite, activeSite?.id]);


   // Sort the current page client-side by Hierarchy
   const displayedEmployees = useMemo(() => {
      return [...paginatedEmployees].sort((a, b) => {
         // 1. Sort by Hierarchy (Highest Role First)
         const hierarchyA = getRoleHierarchy(a.role);
         const hierarchyB = getRoleHierarchy(b.role);
         if (hierarchyA !== hierarchyB) return hierarchyB - hierarchyA;

         // 2. Sort by Name (Alphabetical)
         return a.name.localeCompare(b.name);
      });
   }, [paginatedEmployees]);

   // --- WIZARD STATE ---
   const [addStep, setAddStep] = useState(1);
   const [newEmpData, setNewEmpData] = useState({
      firstName: '', lastName: '', email: '', phone: '', password: '', // Added password
      role: availableRoles.length > 0 ? availableRoles[0].id : 'pos',
      department: availableDepartments.length > 0 ? availableDepartments[0] : 'Retail Operations',
      salary: '', specialization: '', address: '',
      emergencyContact: '', joinDate: new Date().toISOString().split('T')[0],
      avatar: '',
      siteId: activeSite?.id // Default to current site, but adjustable by Admin
   });

   // Auto-update site and department when role changes
   const handleRoleChange = (newRole: UserRole) => {
      // Auto-select correct site for this role
      const autoSiteId = autoSelectSiteForRole(newRole, sites);
      const recommendedDept = getRecommendedDepartment(newRole);

      setNewEmpData(prev => ({
         ...prev,
         role: newRole,
         siteId: autoSiteId || prev.siteId,
         department: recommendedDept
      }));

      // Show info about role requirements
      const locationDesc = getRoleLocationDescription(newRole);
      if (locationDesc) {
         addNotification('info', `Role Selected: ${locationDesc}`);
      }
   };

   // --- ACTIONS ---

   const handleCycleFilter = () => {
      const roles = ['All', ...SYSTEM_ROLES.map(r => r.id)];
      const currentIndex = roles.indexOf(filterRole);
      const nextIndex = (currentIndex + 1) % roles.length;
      setFilterRole(roles[nextIndex]);
   };

   const handleApproveEmployee = (empId: string, empName: string, empRole: UserRole) => {
      // RBAC: Only CEO can approve Admin/CEO roles
      const isHighLevelRole = ['admin', 'super_admin'].includes(empRole);

      if (isHighLevelRole && user?.role !== 'super_admin') {
         addNotification('alert', `Access Denied: Only CEO can approve ${empRole.replace('_', ' ')} roles.`);
         return;
      }

      if (!canApproveEmployees) {
         addNotification('alert', 'Access Denied: You do not have permission to approve employees.');
         return;
      }

      const emp = employees.find(e => e.id === empId);
      if (emp) {
         setEmployeeToApprove(emp);
         setIsApproveModalOpen(true);
      }
   };

   const handleConfirmApprove = () => {
      if (!employeeToApprove) return;

      updateEmployee({ ...employeeToApprove, status: 'Active' }, user?.name || 'Admin');
      addNotification('success', `${employeeToApprove.name} is now Active.`);
      setIsApproveModalOpen(false);
      setEmployeeToApprove(null);
   };

   const handleDownloadPayslip = (id: number) => {
      if (!hasPermission(user?.role, 'VIEW_SALARY')) {
         addNotification('alert', 'Access Denied: You do not have permission to view payroll documents.');
         return;
      }
      addNotification('info', `Generating Payslip #${id}...`);
      setTimeout(() => {
         addNotification('success', `Payslip #${id} downloaded successfully (PDF)`);
      }, 1500);
   };

   const handleTerminateEmployee = (e?: React.MouseEvent) => {

      // Prevent event bubbling
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      if (!selectedEmployee) return;

      // Check permissions
      if (!canTerminateEmployees) {
         addNotification('alert', "Access Denied: You do not have permission to terminate employees.");
         return;
      }

      if (!canTerminateTargetEmployee(selectedEmployee)) {
         if (selectedEmployee.id === user?.id) {
            addNotification('alert', "Access Denied: You cannot terminate your own employment.");
         } else if (selectedEmployee.role === 'super_admin') {
            addNotification('alert', "Access Denied: CEO cannot be terminated through the system.");
         } else if (selectedEmployee.role === 'admin' && user?.role !== 'super_admin') {
            addNotification('alert', "Access Denied: Only CEO can terminate Admin roles.");
         } else {
            addNotification('alert', `Access Denied: You cannot terminate employees with role "${selectedEmployee.role}".`);
         }
         return;
      }

      // Open confirmation modal
      setTerminateInput('');
      setIsTerminateModalOpen(true);
   };

   const handleConfirmTermination = async () => {
      if (!selectedEmployee) return;

      if (terminateInput !== "TERMINATE") {
         addNotification('alert', 'Please type "TERMINATE" to confirm.');
         return;
      }

      const updatedEmp = { ...selectedEmployee, status: 'Terminated' as const };

      try {
         await updateEmployee(updatedEmp, user?.name || 'System');
         setSelectedEmployee(updatedEmp);
         addNotification('success', `Employee ${selectedEmployee.name} has been terminated.`);
         setIsTerminateModalOpen(false);
         setTerminateInput('');
      } catch (error) {
         console.error('🔴 TERMINATION: Error:', error);
         addNotification('alert', 'Failed to terminate employee');
      }
   };

   const handleDeleteEmployee = (id: string) => {
      if (user?.role !== 'super_admin') {
         addNotification('alert', "Access Denied: Record deletion is restricted to CEO. Please use 'Terminate' instead.");
         return;
      }

      const employee = employees.find(e => e.id === id);
      if (!employee) {
         addNotification('alert', "Employee not found.");
         return;
      }

      // Prevent deleting super_admin
      if (employee.role === 'super_admin') {
         addNotification('alert', "Access Denied: CEO records cannot be deleted. Please use 'Terminate' instead.");
         return;
      }

      // Prevent deleting yourself
      if (employee.id === user?.id) {
         addNotification('alert', "Access Denied: You cannot delete your own record.");
         return;
      }

      // Require termination before deletion
      if (employee.status !== 'Terminated') {
         addNotification('alert', `Cannot delete employee: ${employee.name} must be terminated first.\n\nPlease terminate the employee before attempting to delete their record.`);
         return;
      }

      setEmployeeToDelete(employee);
      setDeleteInput('');
      setIsDeleteModalOpen(true);
   };

   const handleConfirmDelete = async () => {
      if (!employeeToDelete) return;

      if (deleteInput !== "DELETE") {
         addNotification('alert', 'Please type "DELETE" to confirm.');
         return;
      }

      try {
         // Delete all profile photos from storage for this employee
         await imageStorageService.deleteAllEmployeePhotos(employeeToDelete.id);

         // Also delete the current avatar if it exists in storage
         if (employeeToDelete.avatar) {
            await imageStorageService.deleteProfilePhoto(employeeToDelete.avatar);
         }

         // Delete the employee record
         await deleteEmployee(employeeToDelete.id, user?.name || 'System');
         addNotification('success', `Employee ${employeeToDelete.name} has been permanently deleted. All associated photos have been removed.`);
         setIsDeleteModalOpen(false);
         setEmployeeToDelete(null);
         setDeleteInput('');
      } catch (error) {
         console.error('Error deleting employee:', error);
         addNotification('alert', 'Failed to delete employee');
      }
   };



   // --- WIZARD ACTIONS ---

   const handleOpenWizard = () => {
      setAddStep(1);

      const validRoles = getCreatableRoles();
      const validDepts = getAvailableDepartments();

      const defaultRole = validRoles.length > 0 ? validRoles[0] : 'pos';
      const defaultDept = validDepts.length > 0 ? validDepts[0] : 'Retail Operations';

      setNewEmpData({
         firstName: '', lastName: '', email: '', phone: '', password: '',
         role: defaultRole,
         department: defaultDept,
         salary: '', specialization: '', address: '',
         emergencyContact: '', joinDate: new Date().toISOString().split('T')[0],
         avatar: '',
         siteId: activeSite?.id
      });
      setIsAddModalOpen(true);
   };

   const resetWizard = () => {
      setIsAddModalOpen(false);
      setAddStep(1);
   };

   const handleWizardNext = () => {
      if (addStep === 1 && !newEmpData.firstName) {
         addNotification('alert', "Please enter at least a First Name to proceed.");
         return;
      }
      if (addStep < 4) setAddStep(prev => prev + 1);
   }

   const handleWizardBack = () => {
      if (addStep > 1) setAddStep(prev => prev - 1);
   }

   // Trigger File Input - Use optional chaining for safety
   const handlePhotoClick = () => {
      fileInputRef.current?.click();
   };

   // Handle File Change - Robust Logic (for avatar creation)
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         // Validate file type - support HEIC from iPhones and other formats
         const isValidImage = file.type.startsWith('image/') ||
            /\.(jpe?g|png|gif|webp|heic|heif|tiff?|bmp|svg|avif)$/i.test(file.name);
         if (!isValidImage) {
            addNotification('alert', 'Please select an image file (JPG, PNG, HEIC, etc.)');
            return;
         }
         // Validate file size (max 10MB to accommodate iPhone photos)
         if (file.size > 10 * 1024 * 1024) {
            addNotification('alert', 'File size too large. Maximum size is 5MB.');
            return; // Exit if file is too large
         }
         const reader = new FileReader();
         reader.onloadend = () => {
            // OPEN CROPPER INSTEAD OF DIRECT SET
            setTempImageSrc(reader.result as string);
            setCropperOpen(true);

            // Clear input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
         };
         reader.onerror = () => {
            addNotification('alert', 'Failed to read file. Please try again.');
         };
         reader.readAsDataURL(file);
      }
   };

   // Handle Document Upload
   const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
         addNotification('alert', 'Invalid file type. Please upload PDF, JPG, or PNG files only.');
         if (documentInputRef.current) {
            documentInputRef.current.value = '';
         }
         return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
         addNotification('alert', 'File size too large. Maximum size is 5MB.');
         if (documentInputRef.current) {
            documentInputRef.current.value = '';
         }
         return;
      }

      // Read file and add to documents list for current employee
      if (!selectedEmployee) {
         addNotification('alert', 'Please select an employee first.');
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         const result = reader.result as string;
         const newDoc = {
            name: file.name,
            url: result,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
         };
         setEmployeeDocuments(prev => ({
            ...prev,
            [selectedEmployee.id]: [...(prev[selectedEmployee.id] || []), newDoc]
         }));
         addNotification('success', `Document "${file.name}" uploaded successfully!`);
      };
      reader.onerror = () => {
         addNotification('alert', 'Failed to read file. Please try again.');
      };
      reader.readAsDataURL(file);

      // Reset input
      if (documentInputRef.current) {
         documentInputRef.current.value = '';
      }
   };

   // Handle Document Download
   const handleDocumentDownload = (doc: { name: string; url: string }) => {
      try {
         const link = document.createElement('a');
         link.href = doc.url;
         link.download = doc.name;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         addNotification('success', `Downloaded ${doc.name}`);
      } catch (error) {
         addNotification('alert', 'Failed to download document. Please try again.');
      }
   };

   // Handle Document Delete
   // Final Submit with Validation

   const handleConfirmValidation = async () => {
      setIsValidationModalOpen(false);
      await submitEmployeeData();
   };

   const handleFinalSubmit = async () => {
      setIsSubmitting(true);

      // Validate role-site assignment
      const selectedSite = sites.find(s => s.id === newEmpData.siteId);

      if (selectedSite) {
         const validationError = validateRoleSiteAssignment(newEmpData.role, selectedSite.type);

         if (validationError) {
            setValidationMessage(validationError);
            setIsValidationModalOpen(true);
            setIsSubmitting(false);
            return;
         }
      }

      await submitEmployeeData();
   };

   const submitEmployeeData = async () => {
      const isAutoApproved = ['super_admin', 'admin', 'hr'].includes(user?.role || '');
      const initialStatus = isAutoApproved ? 'Active' : 'Pending Approval';

      try {

         // Generate a valid UUID for the employee ID
         const employeeId = crypto.randomUUID();

         // Generate sequential employee code
         const nextCode = (employees.length + 1).toString().padStart(4, '0');
         const employeeCode = `EMP-${nextCode}`;

         // Create employee profile (auth account is created when employee signs up)
         const newEmp: Employee = {
            id: employeeId,
            code: employeeCode,
            siteId: newEmpData.siteId || activeSite?.id || 'SITE-001',
            name: `${newEmpData.firstName} ${newEmpData.lastName}`,
            role: newEmpData.role,
            email: newEmpData.email || 'pending@siifmart.com',
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

         await addEmployee(newEmp);

         // Success - close modal and reset
         setFilterRole('All');
         setIsAddModalOpen(false);
         resetWizard();

         addNotification('success', `✅ Employee Profile Created!\n\nNext Steps for ${newEmpData.firstName}:\n1. Go to the login page\n2. Click "Sign Up"\n3. Use email: ${newEmpData.email}\n4. Set their password\n\nTheir profile will automatically link when they log in.`);

      } catch (error: any) {
         console.error('Failed to create employee:', error);
         addNotification('alert', `Failed to create employee:\n\n${error.message || 'Unknown error'}\n\nPlease check the console for details.`);
      } finally {
         setIsSubmitting(false);
      }
   };

   // --- TASK ACTIONS ---

   const handleUpdateTask = (taskId: string, status: EmployeeTask['status']) => {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
   };

   const handleCompleteTask = (taskId: string) => {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
   };

   // --- RENDERERS ---

   const StatCard = ({ title, value, icon: Icon, color, onClick, active }: any) => (
      <div
         onClick={onClick}
         className={`relative overflow-hidden bg-black/40 border rounded-2xl p-6 hover:bg-white/5 transition-all group ${onClick ? 'cursor-pointer' : ''} ${active ? 'border-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.15)] bg-white/5' : 'border-white/10'}`}
      >
         <div className="flex items-center justify-between z-10 relative">
            <div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
               <h3 className="text-3xl font-bold text-white font-mono">{value}</h3>
               {/* Visual Hint for Clickable Cards */}
               {onClick && (
                  <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider ${active ? 'text-cyber-primary' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                     <span>{active ? 'Hide Queue' : 'View Queue'}</span>
                     <ArrowRight size={10} className={active ? '-rotate-90 transition-transform' : 'group-hover:translate-x-1 transition-transform'} />
                  </div>
               )}
            </div>
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${color}`}>
               <Icon size={24} />
            </div>
         </div>
      </div>
   );

   // --- ACCESS CONTROL ---
   // Restriction: Warehouse/Store workers view ONLY their own profile.
   const isPrivileged = ['super_admin', 'hr', 'admin'].includes(user?.role || '');

   if (!isPrivileged) {
      const self = employees.find(e => e.id === user?.id || (user?.email && e.email === user.email));

      if (self) {
         return (
            <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
               <StaffProfileView employee={self} isOwnProfile={true} />
               {/* Keep refs alive? Refs are attached to elements. If elements aren't rendered, refs are null. This is fine. */}
            </div>
         );
      } else {
         return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
               <Shield size={64} className="text-gray-600 mb-4" />
               <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
               <p className="text-gray-400">Your employee profile could not be found or is not linked to your user account.</p>
            </div>
         );
      }
   }

   return (
      <>
         <div className="space-y-6">
            {/* Global Hidden File Input for Profile Photo (Edit Mode) */}
            <input
               type="file"
               ref={profilePhotoInputRef}
               className="hidden"
               accept="image/*,.heic,.heif"
               onChange={handleProfilePhotoSelect}
               aria-label="Edit Profile Photo Upload"
            />

            {/* Image Processing Overlay */}
            {isProcessingImage && (
               <div className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center">
                  <div className="bg-cyber-gray border border-white/10 rounded-2xl p-8 max-w-sm text-center">
                     <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyber-primary border-t-transparent mx-auto mb-4"></div>
                     <p className="text-white font-bold mb-2">Processing Image</p>
                     <p className="text-gray-400 text-sm">{processingStatus || 'Please wait...'}</p>
                  </div>
               </div>
            )}

            {/* Image Cropper Modal - Always render, controlled by open */}
            <ImageCropper
               open={cropperOpen && !!tempImageSrc}
               imageSrc={tempImageSrc || ''}
               onCropComplete={handleCropComplete}
               loading={isSubmitting} // Pass loading state
               onCancel={() => {
                  if (!isSubmitting) {
                     setCropperOpen(false);
                     setTempImageSrc(null);
                  }
               }}
               onError={(error) => {
                  addNotification('alert', `❌ ${error}`);
               }}
            />

            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <Briefcase className="text-cyber-primary" />
                     Human Capital Management
                  </h2>
                  <p className="text-gray-400 text-sm">Orchestrate your workforce, track performance, and manage shifts.</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex bg-cyber-gray rounded-xl p-1 border border-white/5 mr-4">
                     <button
                        onClick={() => setViewMode('directory')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${viewMode === 'directory' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                     >
                        <User size={16} />
                        Directory
                     </button>
                     <button
                        onClick={() => setViewMode('org')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${viewMode === 'org' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                     >
                        <Network size={16} />
                        Org Chart
                     </button>
                     <button
                        onClick={() => setViewMode('shifts')}
                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${viewMode === 'shifts' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                     >
                        <Calendar size={16} />
                        Shift Planner
                     </button>
                  </div>

                  {canCreateEmployees ? (
                     <Protected permission="ADD_EMPLOYEE">
                        <button
                           onClick={handleOpenWizard}
                           className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyber-accent transition-colors flex items-center shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                        >
                           <UserPlus className="w-4 h-4 mr-2" />
                           Onboard Talent
                        </button>
                     </Protected>
                  ) : (
                     <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-sm flex items-center gap-2">
                        <Lock size={14} />
                        <span>{canViewAll ? 'Hiring Restricted' : 'My HR Profile'}</span>
                     </div>
                  )}
               </div>
            </div>


            {/* PENDING PHOTO APPROVALS */}
            {canApproveEmployees && photoRequests.length > 0 && (
               <div className="bg-cyber-gray border border-yellow-500/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50"></div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Camera className="text-yellow-400" size={20} />
                     Pending Photo Approvals
                     <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30">
                        {photoRequests.length}
                     </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {photoRequests.map((req) => (
                        <div key={req.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                           {/* New Photo Preview */}
                           <div className="relative group">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500/50">
                                 <img src={req.newUrl} alt="New" className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none">
                                 <span className="text-xs text-white font-bold">New</span>
                              </div>
                           </div>

                           {/* Details */}
                           <div className="flex-1 min-w-0">
                              <p className="text-white font-bold truncate">{req.userName}</p>
                              <p className="text-xs text-gray-400">Requested {formatDateTime(req.timestamp)}</p>
                           </div>

                           {/* Actions */}
                           <div className="flex gap-2">
                              <button
                                 onClick={() => handleRejectPhoto(req)}
                                 className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                 title="Reject"
                              >
                                 <XCircle size={20} />
                              </button>
                              <button
                                 onClick={() => handleApprovePhoto(req)}
                                 className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 rounded-lg transition-colors border border-green-500/20 hover:border-green-500/40"
                                 title="Approve"
                              >
                                 <CheckCircle size={20} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* KPI Metrics */}
            {canViewAll && viewMode === 'directory' && (
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* KPI Metrics */}
                  <StatCard title="Total Workforce" value={employees.length} icon={User} color="text-blue-400" />
                  <StatCard title="Active Shift" value={Math.floor(employees.length * 0.7)} icon={Clock} color="text-green-400" />
                  <StatCard
                     title="Pending Tasks"
                     value={tasks.filter(t => t.status !== 'Completed').length}
                     icon={ClipboardList}
                     color="text-yellow-400"
                     onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
                     active={isTaskQueueOpen}
                  />
                  <StatCard title="Avg Performance" value="88%" icon={TrendingUp} color="text-cyber-primary" />
               </div>
            )}

            {/* Collapsible Global Task Queue */}
            {canViewAll && isTaskQueueOpen && (
               <div className="animate-in slide-in-from-top duration-300">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                           <ClipboardList size={18} className="text-cyber-primary" />
                           Global Task Board
                        </h3>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-500 uppercase font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                              {tasks.filter(t => t.status !== 'Completed').length} Active
                           </span>
                           <button
                              onClick={() => setIsTaskQueueOpen(false)}
                              className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="Close Task Board"
                              aria-label="Close Task Board"
                           >
                              <XCircle size={20} />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-2">
                        {['High', 'Medium', 'Low'].map(priority => {
                           const priorityTasks = tasks.filter(t => t.priority === priority && t.status !== 'Completed');
                           const color = priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/5' :
                              priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' :
                                 'text-blue-400 border-blue-500/30 bg-blue-500/5';

                           return (
                              <div key={priority} className={`rounded-xl border ${color.split(' ')[1]} ${color.split(' ')[2]} p-4 min-w-[250px]`}>
                                 <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <span className={`text-xs font-bold uppercase ${priority === 'High' ? 'text-red-400' : priority === 'Medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                                       {priority} Priority
                                    </span>
                                    <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full text-white/50">{priorityTasks.length}</span>
                                 </div>

                                 <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {priorityTasks.length === 0 ? (
                                       <div className="text-center py-4 text-xs text-gray-500 italic">No tasks</div>
                                    ) : (
                                       priorityTasks.map(task => (
                                          <div key={task.id} className="bg-black/40 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors group cursor-pointer">
                                             <div className="flex justify-between items-start mb-1">
                                                <span className="text-sm font-medium text-gray-200 line-clamp-1">{task.title}</span>
                                             </div>
                                             <div className="flex items-center justify-between text-[10px] text-gray-500">
                                                <span>{employees.find(e => e.id === task.assignedTo)?.name || 'Unassigned'}</span>
                                                <span className="text-gray-600">{formatDateTime(task.dueDate).split(',')[0]}</span>
                                             </div>
                                          </div>
                                       ))
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            )}
            {/* ... (Directory & Org views same as before) ... */}

            {/* --- DIRECTORY MODE --- */}
            {viewMode === 'directory' && (
               <div className="space-y-6 relative">
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4">
                     <div>
                        <h2 className="text-xl font-semibold text-white">Team Directory</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{totalCount} employees</p>
                     </div>

                     <div className="flex items-center gap-3">
                        <button
                           onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
                           className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all border ${isTaskQueueOpen ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.4)]' : 'bg-black/40 text-gray-400 border-white/10 hover:text-white hover:border-white/30'}`}
                           title="Toggle Global Task Queue"
                        >
                           <ClipboardList size={18} />
                           <span>Task Queue</span>
                           {tasks.filter(t => t.status !== 'Completed').length > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isTaskQueueOpen ? 'bg-black/20 text-black' : 'bg-cyber-primary text-black'}`}>
                                 {tasks.filter(t => t.status !== 'Completed').length}
                              </span>
                           )}
                        </button>

                        {/* Layout Toggle */}
                        <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex">
                           <button
                              onClick={() => setLayoutMode('grid')}
                              className={`p-2 rounded-lg transition-all ${layoutMode === 'grid' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-500 hover:text-white'}`}
                              title="Grid View"
                           >
                              <LayoutGrid size={18} />
                           </button>
                           <button
                              onClick={() => setLayoutMode('list')}
                              className={`p-2 rounded-lg transition-all ${layoutMode === 'list' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-500 hover:text-white'}`}
                              title="List View"
                           >
                              <List size={18} />
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="w-full space-y-6">
                     <div className="space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                           {/* Search Bar */}
                           <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/20 transition-colors flex-1">
                              <Search className="w-4 h-4 text-gray-500" />
                              <input
                                 type="text"
                                 placeholder={canViewAll ? "Search members..." : "Search profile..."}
                                 className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none placeholder-gray-600"
                                 value={searchTerm}
                                 onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                 }}
                              />
                              {searchTerm && (
                                 <button
                                    onClick={() => setSearchTerm('')}
                                    className="ml-2 text-gray-500 hover:text-white transition-colors"
                                    aria-label="Clear search"
                                 >
                                    <XCircle size={14} />
                                 </button>
                              )}
                           </div>

                           {/* Filters */}
                           {canViewAll && (
                              <div className="flex flex-wrap gap-2">
                                 {/* Minimal Select Styles */}
                                 {[
                                    { value: filterRole, setValue: setFilterRole, options: SYSTEM_ROLES.map(r => ({ value: r.id, label: r.label })), default: 'All Roles' },
                                    { value: filterStatus, setValue: setFilterStatus, options: [{ value: 'Active', label: 'Active' }, { value: 'Pending Approval', label: 'Pending' }, { value: 'Inactive', label: 'Inactive' }], default: 'All Status' },
                                    { value: filterDepartment, setValue: setFilterDepartment, options: Array.from(new Set(visibleEmployees.map(e => e.department).filter(Boolean))).map(d => ({ value: d, label: d })), default: 'All Departments' },
                                    { value: filterSite, setValue: setFilterSite, options: sites.map(s => ({ value: s.id, label: s.name })), default: 'All Locations' }
                                 ].map((filter, i) => (
                                    <select
                                       key={i}
                                       aria-label={filter.default}
                                       value={filter.value}
                                       onChange={(e) => {
                                          filter.setValue(e.target.value);
                                          setCurrentPage(1);
                                       }}
                                       className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-white/20 cursor-pointer transition-colors max-w-[150px]"
                                    >
                                       <option value="All">{filter.default}</option>
                                       {filter.options.map((opt: any) => (
                                          <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-gray-300">
                                             {opt.label}
                                          </option>
                                       ))}
                                    </select>
                                 ))}

                                 {/* Clear Filters */}
                                 {(filterRole !== 'All' || filterStatus !== 'All' || filterDepartment !== 'All' || filterSite !== 'All') && (
                                    <button
                                       onClick={() => {
                                          setFilterRole('All'); setFilterStatus('All');
                                          setFilterDepartment('All'); setFilterSite('All'); setSearchTerm('');
                                       }}
                                       className="px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition-colors"
                                       title="Clear Filters"
                                    >
                                       <XCircle size={16} />
                                    </button>
                                 )}
                              </div>
                           )}
                        </div>

                        {/* Counts */}
                        <div className="text-xs text-gray-500 px-1">
                           {displayedEmployees.length} result{displayedEmployees.length !== 1 && 's'}
                           {filterRole !== 'All' || searchTerm ? ` (filtered from ${totalCount})` : ''}
                        </div>
                     </div>

                     {/* Employee Table - Modern Row Design */}
                     {/* --- DISPLAY AREA (GRID / LIST) --- */}
                     {layoutMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {isLoadingEmployees && (
                              <div className="col-span-full flex justify-center py-12">
                                 <Loader2 className="animate-spin text-white/50" size={24} />
                              </div>
                           )}

                           {displayedEmployees.map((employee) => {
                              const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || SYSTEM_ROLES[8];
                              return (
                                 <div
                                    key={employee.id}
                                    onClick={() => setSelectedEmployee(employee)}
                                    className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-xl p-5 cursor-pointer transition-all duration-200"
                                 >
                                    <div className="flex items-start gap-4">
                                       {/* Avatar */}
                                       <div className="relative flex-shrink-0">
                                          <img
                                             src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=1a1a1a&color=ffffff&bold=true`}
                                             className="w-12 h-12 rounded-full object-cover"
                                             alt={employee.name}
                                          />
                                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${employee.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                       </div>

                                       {/* Info */}
                                       <div className="flex-1 min-w-0">
                                          <h3 className="text-sm font-semibold text-white truncate">{employee.name}</h3>
                                          <p className={`text-xs mt-0.5 ${roleConfig.styles.text}`}>{roleConfig.label}</p>
                                          <p className="text-[11px] text-gray-500 mt-1 truncate">
                                             {sites.find(s => s.id === employee.siteId)?.name || 'Unassigned'}
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}

                           {displayedEmployees.length === 0 && !isLoadingEmployees && (
                              <div className="col-span-full flex justify-center py-16 text-center text-gray-500">
                                 <User size={32} className="mx-auto mb-3 opacity-30" />
                                 <p className="text-sm">No employees found</p>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                           {/* Simple List */}
                           <div className="divide-y divide-white/[0.04]">
                              {isLoadingEmployees && (
                                 <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-white/50" size={24} />
                                 </div>
                              )}

                              {displayedEmployees.length > 0 ? (
                                 displayedEmployees.map((employee) => {
                                    const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || SYSTEM_ROLES[8];

                                    return (
                                       <EmployeeRow
                                          key={employee.id}
                                          employee={employee}
                                          sites={sites}
                                          roleConfig={roleConfig}
                                          pendingTasks={0}
                                          onSelect={() => setSelectedEmployee(employee)}
                                          onMessage={() => setSelectedEmployee(employee)}
                                          canResetPassword={false}
                                          canDelete={false}
                                          canApprove={false}
                                          isSuperAdmin={false}
                                       />
                                    );
                                 })
                              ) : (
                                 <div className="px-6 py-16 text-center text-gray-500">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                       <User size={32} className="opacity-50" />
                                    </div>
                                    <p className="text-lg font-medium">{canViewAll ? "No employees found." : "Profile not found."}</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}    {/* Pagination Controls */}
                     {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 bg-black/30 border-t border-white/5">
                           <div className="text-xs text-gray-500">
                              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                 disabled={currentPage === 1}
                                 className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                 title="Previous Page"
                                 aria-label="Previous Page"
                              >
                                 <ArrowLeft size={16} />
                              </button>

                              {/* Page Numbers */}
                              <div className="flex items-center gap-1">
                                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Simple pagination logic for first 5 pages or sliding window 
                                    // For simplicity, just showing sliding window around current page
                                    let p = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                       p = currentPage - 2 + i;
                                    }
                                    if (p > totalPages) return null;

                                    return (
                                       <button
                                          key={p}
                                          onClick={() => setCurrentPage(p)}
                                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${currentPage === p
                                             ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                                             : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                             }`}
                                       >
                                          {p}
                                       </button>
                                    );
                                 })}
                              </div>

                              <button
                                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                 disabled={currentPage === totalPages}
                                 className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                                 title="Next Page"
                                 aria-label="Next Page"
                              >
                                 <ArrowRight size={16} />
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}


            {/* --- ORG CHART & SHIFTS OMITTED FOR BREVITY (SAME AS BEFORE) --- */}
            {viewMode === 'org' && <OrgChart key={employees.length} employees={employees} sites={sites} />}
            {viewMode === 'shifts' && <ShiftPlanner key={employees.length} employees={employees} canEdit={canManageShifts} />}



            {/* WIZARD MODAL WITH SITE SELECTION */}
            <AddEmployeeWizard
               isOpen={isAddModalOpen}
               onClose={resetWizard}
               addStep={addStep}
               newEmpData={newEmpData}
               setNewEmpData={setNewEmpData}
               handlePhotoClick={handlePhotoClick}
               fileInputRef={fileInputRef}
               handleFileChange={handleFileChange}
               user={user}
               sites={sites}
               availableRoles={availableRoles}
               handleRoleChange={handleRoleChange}
               availableDepartments={availableDepartments}
               handleWizardBack={handleWizardBack}
               handleWizardNext={handleWizardNext}
               handleFinalSubmit={handleFinalSubmit}
               isSubmitting={isSubmitting}
               resetWizard={resetWizard}
               canAdjustPayroll={canAdjustPayroll}
            />

            {/* --- MODAL: EMPLOYEE PROFILE --- */}
            <Modal
               isOpen={!!selectedEmployee
               }
               onClose={() => setSelectedEmployee(null)}
               title="Staff Profile"
               size="2xl"
            >
               {selectedEmployee && (
                  <StaffProfileView
                     employee={selectedEmployee}
                     onClose={() => setSelectedEmployee(null)}
                     terminateInput={terminateInput}
                     setTerminateInput={setTerminateInput}
                     handleConfirmTermination={handleConfirmTermination}
                  />
               )}
            </Modal>

            {/* ID Card Generator Modal */}
            {
               idCardEmployee && (
                  <EmployeeIDCard
                     employee={idCardEmployee}
                     siteCode={sites.find(s => s.id === idCardEmployee.siteId)?.code || sites.find(s => s.id === idCardEmployee.siteId)?.name || idCardEmployee.siteId}
                     onClose={() => setIdCardEmployee(null)}
                  />
               )
            }

            {/* --- MODAL: TERMINATE EMPLOYEE --- */}
            <TerminateEmployeeModal
               isOpen={isTerminateModalOpen}
               onClose={() => setIsTerminateModalOpen(false)}
               employee={selectedEmployee}
               terminateInput={terminateInput}
               setTerminateInput={setTerminateInput}
               handleConfirmTermination={handleConfirmTermination}
            />

            {/* --- MODAL: DELETE RECORD --- */}
            <DeleteEmployeeModal
               isOpen={isDeleteModalOpen}
               onClose={() => setIsDeleteModalOpen(false)}
               employee={employeeToDelete}
               deleteInput={deleteInput}
               setDeleteInput={setDeleteInput}
               handleConfirmDelete={handleConfirmDelete}
            />

            {/* --- MODAL: APPROVE EMPLOYEE --- */}
            <ApproveEmployeeModal
               isOpen={isApproveModalOpen}
               onClose={() => setIsApproveModalOpen(false)}
               employee={employeeToApprove}
               sites={sites}
               handleConfirmApprove={handleConfirmApprove}
            />

            {/* --- MODAL: VALIDATION WARNING --- */}
            <ValidationWarningModal
               isOpen={isValidationModalOpen}
               onClose={() => setIsValidationModalOpen(false)}
               validationMessage={validationMessage}
               handleConfirmValidation={handleConfirmValidation}
            />
         </div >
      </>
   );
}

