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

// Role Definitions with Complete Tailwind Classes for visibility
const SYSTEM_ROLES: {
   id: UserRole,
   label: string,
   desc: string,
   level: number,
   styles: { text: string, bg: string, border: string, badge: string }
}[] = [
      // ═══ LEVEL 1 - EXECUTIVE ═══
      {
         id: 'super_admin', label: 'CEO', desc: 'Unrestricted Access (Owner)', level: 1,
         styles: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', badge: 'bg-yellow-400/20 text-yellow-400' }
      },

      // ═══ LEVEL 2 - REGIONAL/DIRECTORS ═══
      {
         id: 'regional_manager', label: 'Regional Manager', desc: 'Multi-Store Oversight', level: 2,
         styles: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-500' }
      },
      {
         id: 'operations_manager', label: 'Operations Manager', desc: 'HQ Operations', level: 2,
         styles: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', badge: 'bg-blue-400/20 text-blue-400' }
      },
      {
         id: 'finance_manager', label: 'Finance Manager', desc: 'Financial Oversight', level: 2,
         styles: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', badge: 'bg-emerald-400/20 text-emerald-400' }
      },
      {
         id: 'hr_manager', label: 'HR Manager', desc: 'Staff & Payroll Management', level: 2,
         styles: { text: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20', badge: 'bg-pink-400/20 text-pink-400' }
      },
      {
         id: 'procurement_manager', label: 'Procurement Manager', desc: 'Supply Chain & Purchasing', level: 2,
         styles: { text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', badge: 'bg-indigo-400/20 text-indigo-400' }
      },
      {
         id: 'supply_chain_manager', label: 'Supply Chain Manager', desc: 'End-to-End Logistics', level: 2,
         styles: { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', badge: 'bg-violet-400/20 text-violet-400' }
      },

      // ═══ LEVEL 3 - SITE MANAGERS ═══
      {
         id: 'store_manager', label: 'Store Manager', desc: 'Single Store Operations', level: 3,
         styles: { text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20', badge: 'bg-teal-400/20 text-teal-400' }
      },
      {
         id: 'warehouse_manager', label: 'Warehouse Manager', desc: 'Warehouse Operations Lead', level: 3,
         styles: { text: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', badge: 'bg-teal-500/20 text-teal-500' }
      },
      {
         id: 'dispatch_manager', label: 'Dispatch Manager', desc: 'Fleet & Delivery Management', level: 3,
         styles: { text: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/20', badge: 'bg-lime-400/20 text-lime-400' }
      },
      {
         id: 'assistant_manager', label: 'Assistant Manager', desc: 'Deputy Management', level: 3,
         styles: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', badge: 'bg-cyan-400/20 text-cyan-400' }
      },
      {
         id: 'shift_lead', label: 'Shift Lead', desc: 'Team Lead', level: 3,
         styles: { text: 'text-blue-200', bg: 'bg-blue-200/10', border: 'border-blue-200/20', badge: 'bg-blue-200/20 text-blue-200' }
      },

      // ═══ LEVEL 4 - STAFF ═══
      {
         id: 'cashier', label: 'Cashier', desc: 'POS Operations', level: 4,
         styles: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', badge: 'bg-green-400/20 text-green-400' }
      },
      {
         id: 'sales_associate', label: 'Sales Associate', desc: 'Floor Sales', level: 4,
         styles: { text: 'text-green-300', bg: 'bg-green-300/10', border: 'border-green-300/20', badge: 'bg-green-300/20 text-green-300' }
      },
      {
         id: 'stock_clerk', label: 'Stock Clerk', desc: 'Shelving & Stocking', level: 4,
         styles: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', badge: 'bg-amber-400/20 text-amber-400' }
      },
      {
         id: 'picker', label: 'Picker', desc: 'Order Picking', level: 4,
         styles: { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', badge: 'bg-orange-400/20 text-orange-400' }
      },
      {
         id: 'packer', label: 'Packer', desc: 'Order Packing', level: 4,
         styles: { text: 'text-orange-300', bg: 'bg-orange-300/10', border: 'border-orange-300/20', badge: 'bg-orange-300/20 text-orange-300' }
      },
      {
         id: 'receiver', label: 'Receiver', desc: 'Goods Receiving', level: 4,
         styles: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', badge: 'bg-cyan-400/20 text-cyan-400' }
      },
      {
         id: 'driver', label: 'Driver', desc: 'Delivery', level: 4,
         styles: { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', badge: 'bg-slate-400/20 text-slate-400' }
      },
      {
         id: 'forklift_operator', label: 'Forklift Operator', desc: 'Equipment Operator', level: 4,
         styles: { text: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', badge: 'bg-gray-400/20 text-gray-400' }
      },
      {
         id: 'inventory_specialist', label: 'Inventory Specialist', desc: 'Stock Control', level: 4,
         styles: { text: 'text-amber-300', bg: 'bg-amber-300/10', border: 'border-amber-300/20', badge: 'bg-amber-300/20 text-amber-300' }
      },
      {
         id: 'customer_service', label: 'Customer Service', desc: 'Returns & Inquiries', level: 4,
         styles: { text: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20', badge: 'bg-sky-400/20 text-sky-400' }
      },
      {
         id: 'auditor', label: 'Auditor', desc: 'Compliance & Audit', level: 4,
         styles: { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', badge: 'bg-rose-400/20 text-rose-400' }
      },
      {
         id: 'it_support', label: 'IT Support', desc: 'Technical Assistance', level: 4,
         styles: { text: 'text-purple-300', bg: 'bg-purple-300/10', border: 'border-purple-300/20', badge: 'bg-purple-300/20 text-purple-300' }
      },

      // ═══ LEGACY ROLES (backwards compatibility) ═══
      {
         id: 'admin', label: 'Admin (Legacy)', desc: 'System Admin', level: 2,
         styles: { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', badge: 'bg-purple-400/20 text-purple-400' }
      },
      {
         id: 'manager', label: 'Manager (Legacy)', desc: 'Department Manager', level: 3,
         styles: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', badge: 'bg-blue-400/20 text-blue-400' }
      },
      {
         id: 'hr', label: 'HR (Legacy)', desc: 'Human Resources', level: 2,
         styles: { text: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20', badge: 'bg-pink-400/20 text-pink-400' }
      },
      {
         id: 'pos', label: 'POS Staff (Legacy)', desc: 'Point of Sale', level: 4,
         styles: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', badge: 'bg-green-400/20 text-green-400' }
      }
   ];

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
      workerPoints, getWorkerPoints, storePoints, getStorePoints, settings, calculateWorkerBonusShare,
      tasks, setTasks
   } = useData();

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

   // Role hierarchy for termination checks - 4-level structure
   const getRoleHierarchy = (role: UserRole): number => {
      const hierarchy: Record<string, number> = {
         // Level 1 - Executive (100)
         'super_admin': 100,
         // Level 2 - Regional/Directors (80-95)
         'regional_manager': 95,
         'operations_manager': 90,
         'finance_manager': 85,
         'hr_manager': 85,
         'procurement_manager': 82,
         'supply_chain_manager': 80,
         // Level 3 - Site Managers (50-70)
         'store_manager': 70,
         'warehouse_manager': 68,
         'dispatch_manager': 65,
         'assistant_manager': 60,
         'shift_lead': 55,
         // Level 4 - Staff (10-40)
         'cashier': 30,
         'sales_associate': 28,
         'stock_clerk': 25,
         'picker': 22,
         'packer': 22,
         'receiver': 22,
         'driver': 20,
         'forklift_operator': 20,
         'inventory_specialist': 25,
         'customer_service': 25,
         'auditor': 40,
         'it_support': 35,
         // Legacy roles
         'admin': 90,
         'manager': 65,
         'hr': 85,
         'pos': 28,
         'dispatcher': 35,
         'cs_manager': 60,
         'store_supervisor': 55,
         'returns_clerk': 22,
         'merchandiser': 25,
         'loss_prevention': 30,
         'accountant': 35,
         'data_analyst': 35,
         'training_coordinator': 35
      };
      return hierarchy[role] || 0;
   };

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
      console.log('📷 handleRequestPhotoChange called, triggering file input');
      console.log('📷 profilePhotoInputRef.current:', profilePhotoInputRef.current);
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
      console.log('📷 handleProfilePhotoSelect called');
      const file = event.target.files?.[0];

      // Clear input immediately so same file can be selected again
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';

      if (!file) {
         console.log('📷 No file selected');
         return;
      }

      console.log('📷 File selected:', file.name, file.type, file.size);

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
            console.log('📷 HEIC file detected, attempting conversion...');
            setProcessingStatus('Converting iPhone photo...');

            try {
               const result = await processImageFile(file, setProcessingStatus);
               if (result.success && result.dataUrl) {
                  console.log('📷 HEIC conversion successful');
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
            console.log('📷 Standard image format, reading directly...');
            const reader = new FileReader();

            reader.onload = () => {
               const result = reader.result as string;
               console.log('📷 FileReader success, data length:', result?.length);
               if (result) {
                  setTempImageSrc(result);
                  setCropperOpen(true);
                  console.log('📷 Cropper should now be open');
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
      console.log('✅ handleCropComplete matched. Image length:', croppedImage.length);
      setIsSubmitting(true);

      try {
         // CASE 1: Adding New Employee (no old photo to delete yet)
         if (isAddModalOpen) {
            console.log('✅ Handling for New Employee');
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

         console.log('✅ Updating Existing Employee:', selectedEmployee.name);

         const isPrivileged = ['super_admin', 'admin', 'hr'].includes(user?.role || '');

         if (isPrivileged) {
            // DIRECT UPDATE - Upload new photo and delete old one
            console.log('✅ User is privileged, doing direct update');

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
                  console.log('📷 Successfully uploaded to storage');
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
               console.log('✅ Updating current user avatar in CentralStore');
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
            console.log('✅ User is NOT privileged, requesting approval');
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
               console.log('📷 Successfully uploaded to storage');
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
      console.log('🔴 TERMINATION: Opening confirmation modal');

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

      console.log('🔴 TERMINATION: Confirmed, updating employee...');
      const updatedEmp = { ...selectedEmployee, status: 'Terminated' as const };

      try {
         await updateEmployee(updatedEmp, user?.name || 'System');
         setSelectedEmployee(updatedEmp);
         addNotification('success', `Employee ${selectedEmployee.name} has been terminated.`);
         setIsTerminateModalOpen(false);
         setTerminateInput('');
         console.log('🔴 TERMINATION: Complete!');
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
         console.log('Deleting profile photos for employee:', employeeToDelete.id);
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
      console.log('🔵 handleFinalSubmit called!');
      setIsSubmitting(true);
      console.log('📋 newEmpData:', newEmpData);
      console.log('👤 user:', user);
      console.log('🏢 sites:', sites);

      // Validate role-site assignment
      const selectedSite = sites.find(s => s.id === newEmpData.siteId);
      console.log('🏢 selectedSite:', selectedSite);

      if (selectedSite) {
         const validationError = validateRoleSiteAssignment(newEmpData.role, selectedSite.type);
         console.log('⚠️ validationError:', validationError);

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
      console.log('✅ Validation passed, proceeding with creation. Status:', initialStatus);

      try {
         console.log('Creating employee with data:', newEmpData);

         // Generate a valid UUID for the employee ID
         let employeeId = crypto.randomUUID();

         // Generate sequential employee code
         const nextCode = (employees.length + 1).toString().padStart(4, '0');
         const employeeCode = `EMP-${nextCode}`;

         let createdWithAuth = false;

         // If email and password provided, create auth account
         if (newEmpData.email && newEmpData.password) {
            if (user?.role === 'super_admin') {
               try {
                  console.log('Attempting to create auth user via admin service...');
                  const { createEmployeeWithAuth } = await import('../services/admin.service');

                  const result = await createEmployeeWithAuth({
                     email: newEmpData.email,
                     password: newEmpData.password,
                     name: `${newEmpData.firstName} ${newEmpData.lastName}`,
                     role: newEmpData.role,
                     siteId: newEmpData.siteId || activeSite?.id || '',
                     phone: newEmpData.phone,
                     department: newEmpData.department,
                     salary: parseFloat(newEmpData.salary) || 0
                  });

                  employeeId = result.id as any; // Cast to avoid type error
                  createdWithAuth = true;
                  console.log('Employee created with auth:', result);

               } catch (authError: any) {
                  console.error('Auth creation failed:', authError);

                  // Check if it's a missing service key error
                  if (authError.message?.includes('Service role key not configured')) {
                     addNotification('alert', '⚠️ Admin Access Required\n\nTo create employees with full login access, please use the admin dashboard or contact your system administrator.\n\nFor now, creating employee profile only...');
                  } else if (authError.message?.includes('already been registered')) {
                     // Email already exists - try to find the existing user and link
                     addNotification('info', `Email ${newEmpData.email} already exists. Linking to existing account...`);

                     // Try to get the existing user ID from auth
                     try {
                        const { createEmployeeWithAuth } = await import('../services/admin.service');
                        // This will now handle existing users
                        const result = await createEmployeeWithAuth({
                           email: newEmpData.email,
                           password: newEmpData.password,
                           name: `${newEmpData.firstName} ${newEmpData.lastName}`,
                           role: newEmpData.role,
                           siteId: newEmpData.siteId || activeSite?.id || '',
                           phone: newEmpData.phone,
                           department: newEmpData.department,
                           salary: parseFloat(newEmpData.salary) || 0
                        });
                        employeeId = result.id as any;
                        createdWithAuth = true;
                        addNotification('success', `✅ Employee linked to existing account: ${newEmpData.email}`);
                     } catch (linkError: any) {
                        addNotification('alert', `Failed to link to existing account:\n\n${linkError.message}\n\nCreating employee profile only...`);
                     }
                  } else {
                     addNotification('alert', `Failed to create login account:\n\n${authError.message}\n\nCreating employee profile only...`);
                  }
               }
            } else {
               console.log('Skipping auth creation: User is not super_admin', user?.role);
               addNotification('info', 'Note: Only CEOs can create login accounts. Creating employee profile only.');
            }
         } else {
            console.log('Skipping auth creation: Email or password missing');
         }

         // If auth creation failed or wasn't attempted, create employee profile only
         if (!createdWithAuth) {
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

            console.log('Calling addEmployee...');
            await addEmployee(newEmp);
            console.log('Employee added successfully!');

            // Success - close modal and reset
            setFilterRole('All');
            setIsAddModalOpen(false);
            resetWizard();

            if (newEmpData.email && newEmpData.password) {
               addNotification('success', `✅ Employee Profile Created!\n\nNext Steps:\n1. The employee should go to the login page\n2. Click "Sign Up"\n3. Use Email: ${newEmpData.email}\n4. Use Password: ${newEmpData.password}\n\nThis will link their profile to a login account.`);
            } else {
               addNotification('success', `✅ Employee Profile Created!\n\nTo enable login:\n1. Have them visit the login page\n2. Click "Sign Up"\n3. Use their email: ${newEmpData.email || 'their email'}\n4. Set a password`);
            }
         } else {
            // Employee was created with auth - show success and reload
            console.log('Employee created with auth, showing success message...');

            // Close modal first
            setFilterRole('All');
            setIsAddModalOpen(false);
            resetWizard();

            addNotification('success', `✅ SUCCESS!\n\nEmployee created with login account!\n\n📧 Email: ${newEmpData.email}\n🔑 Password: ${newEmpData.password}\n\nThey can login immediately.`);

            // Reload to show the new employee
            setTimeout(() => {
               window.location.reload();
            }, 2000);
         }
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
                              <div className="col-span-full py-16 text-center text-gray-500">
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

                              {displayedEmployees.map((employee) => {
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
                              })}

                              {displayedEmployees.length === 0 && !isLoadingEmployees && (
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
            <Modal isOpen={isAddModalOpen} onClose={resetWizard} title="Onboard Talent" size="lg">
               <div className="flex flex-col h-[500px]">
                  {/* Stepper */}
                  <div className="flex justify-between items-center mb-8 px-4">
                     {[1, 2, 3, 4].map(step => (
                        <div key={step} className="flex flex-col items-center relative z-10">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === addStep ? 'bg-cyber-primary text-black scale-110 shadow-[0_0_15px_rgba(0,255,157,0.5)]' :
                              step < addStep ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-500'
                              }`}>
                              {step < addStep ? <CheckCircle size={16} /> : step}
                           </div>
                           <span className={`text-[10px] mt-2 uppercase font-bold ${step === addStep ? 'text-cyber-primary' : 'text-gray-500'}`}>
                              {['Identity', 'Role', 'Details', 'Review'][step - 1]}
                           </span>
                        </div>
                     ))}
                     <div className="absolute top-[88px] left-12 right-12 h-0.5 bg-white/10 -z-0">
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <div className="h-full bg-cyber-primary transition-all duration-500" style={{ width: `${((addStep - 1) / 3) * 100}%` }}></div>
                     </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto px-4 py-2">

                     {/* STEP 1: IDENTITY */}
                     {addStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                           <div className="flex gap-6">
                              <div
                                 onClick={handlePhotoClick}
                                 className="w-32 h-32 bg-black/30 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-cyber-primary cursor-pointer transition-all group overflow-hidden relative"
                              >
                                 {newEmpData.avatar ? (
                                    <img src={newEmpData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                 ) : (
                                    <>
                                       <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                       <span className="text-xs text-center px-2">Upload Photo</span>
                                    </>
                                 )}
                              </div>
                              {/* Hidden Input Moved Outside Container */}
                              <input
                                 type="file"
                                 ref={fileInputRef}
                                 onChange={handleFileChange}
                                 accept="image/*,.heic,.heif"
                                 className="hidden"
                                 aria-label="Upload Profile Photo"
                                 title="Upload Profile Photo"
                              />
                              <div className="flex-1 space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">First Name <span className="text-red-500">*</span></label>
                                       <input
                                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                          value={newEmpData.firstName}
                                          onChange={e => setNewEmpData({ ...newEmpData, firstName: e.target.value })}
                                          aria-label="First Name"
                                          title="First Name"
                                       />
                                    </div>
                                    <div>
                                       <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Last Name</label>
                                       <input
                                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                          value={newEmpData.lastName}
                                          onChange={e => setNewEmpData({ ...newEmpData, lastName: e.target.value })}
                                          aria-label="Last Name"
                                          title="Last Name"
                                       />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Email Address (Optional)</label>
                                    <input
                                       className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                       value={newEmpData.email}
                                       placeholder="e.g. user@company.com"
                                       onChange={e => setNewEmpData({ ...newEmpData, email: e.target.value })}
                                       aria-label="Email Address"
                                       title="Email Address"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Password (For Login)</label>
                                    <input
                                       type="password"
                                       className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                       value={newEmpData.password}
                                       onChange={e => setNewEmpData({ ...newEmpData, password: e.target.value })}
                                       placeholder="••••••••"
                                       aria-label="Password"
                                       title="Password"
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* NEW: SITE SELECTION (Admin/HR Only) */}
                           {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'hr') && (
                              <div>
                                 <label className="text-xs text-cyber-primary uppercase font-bold mb-2 block flex items-center gap-2"><MapPin size={14} /> Assign Workplace</label>
                                 <select
                                    className="w-full bg-cyber-primary/10 border border-cyber-primary/30 text-white rounded-lg px-3 py-3 outline-none"
                                    value={newEmpData.siteId}
                                    onChange={e => setNewEmpData({ ...newEmpData, siteId: e.target.value })}
                                    aria-label="Assign Workplace"
                                    title="Assign Workplace"
                                 >
                                    {sites.map(s => (
                                       <option key={s.id} value={s.id} className="text-black">{s.name} ({s.type})</option>
                                    ))}
                                 </select>
                                 <p className="text-[10px] text-gray-500 mt-1">Employee will only see data for this location.</p>
                              </div>
                           )}

                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Phone Number</label>
                                 <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                    value={newEmpData.phone}
                                    placeholder="e.g. +251 911..."
                                    onChange={e => setNewEmpData({ ...newEmpData, phone: e.target.value })}
                                    aria-label="Phone Number"
                                    title="Phone Number"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Address</label>
                                 <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                    value={newEmpData.address}
                                    onChange={e => setNewEmpData({ ...newEmpData, address: e.target.value })}
                                    aria-label="Address"
                                    title="Address"
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {/* STEP 2: ROLE (FILTERED BY AUTHORITY) */}
                     {addStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                           <p className="text-sm text-gray-400 mb-2">Select System Access Level (Filtered by your permissions)</p>
                           <div className="grid grid-cols-2 gap-3">
                              {availableRoles.map(roleObj => {
                                 const violations = authService.validateSeparationOfDuties(roleObj.id);
                                 const hasViolations = violations.length > 0;

                                 return (
                                    <div
                                       key={roleObj.id}
                                       onClick={() => handleRoleChange(roleObj.id)}
                                       className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative ${newEmpData.role === roleObj.id
                                          ? `bg-white/10 ${roleObj.styles.text} ${roleObj.styles.border} shadow-[0_0_15px_rgba(255,255,255,0.1)]`
                                          : 'bg-black/20 border-white/5 hover:border-white/20'
                                          }`}
                                    >
                                       <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newEmpData.role === roleObj.id ? 'border-white' : 'border-gray-500'
                                          }`}>
                                          {newEmpData.role === roleObj.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                       </div>
                                       <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                             <p className="text-white font-bold uppercase text-sm">{roleObj.label}</p>
                                             {hasViolations && (
                                                <div className="group/sod relative">
                                                   <AlertTriangle size={14} className="text-yellow-500" />
                                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-yellow-500/50 rounded text-[10px] text-yellow-200 opacity-0 group-hover/sod:opacity-100 pointer-events-none transition-opacity z-50">
                                                      Warning: This role has inherent Separation of Duties conflicts: {violations.join(', ')}
                                                   </div>
                                                </div>
                                             )}
                                          </div>
                                          <p className="text-[10px] text-gray-400">{roleObj.desc}</p>
                                       </div>
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     )}

                     {/* STEP 3: DETAILS */}
                     {addStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                           <div>
                              <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Department (Filtered)</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {availableDepartments.map(dept => (
                                    <button
                                       key={dept}
                                       onClick={() => setNewEmpData({ ...newEmpData, department: dept })}
                                       className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors ${newEmpData.department === dept ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                          }`}
                                    >
                                       {dept}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Monthly Salary ({CURRENCY_SYMBOL})</label>
                                 <input
                                    type="number"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none font-mono"
                                    value={newEmpData.salary}
                                    onChange={e => setNewEmpData({ ...newEmpData, salary: e.target.value })}
                                    aria-label="Monthly Salary"
                                    title="Monthly Salary"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Specialization</label>
                                 <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                    placeholder="e.g. Cold Storage"
                                    value={newEmpData.specialization}
                                    onChange={e => setNewEmpData({ ...newEmpData, specialization: e.target.value })}
                                    aria-label="Specialization"
                                    title="Specialization"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Start Date</label>
                              <input
                                 type="date"
                                 className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                 value={newEmpData.joinDate}
                                 onChange={e => setNewEmpData({ ...newEmpData, joinDate: e.target.value })}
                                 aria-label="Start Date"
                                 title="Start Date"
                              />
                           </div>
                        </div>
                     )}

                     {/* STEP 4: REVIEW */}
                     {addStep === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                           <p className="text-sm text-gray-400 mb-4">Review and confirm all details before creating the employee profile.</p>

                           <div className="grid grid-cols-2 gap-4">
                              {/* Personal Information */}
                              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                 <h4 className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                    <User size={14} /> Personal Information
                                 </h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Full Name:</span>
                                       <span className="text-white font-medium">{newEmpData.firstName} {newEmpData.lastName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Email:</span>
                                       <span className="text-white font-mono text-xs">{newEmpData.email || 'Not provided'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Phone:</span>
                                       <span className="text-white">{newEmpData.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Join Date:</span>
                                       <span className="text-white">{newEmpData.joinDate || new Date().toISOString().split('T')[0]}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Role & Location */}
                              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                 <h4 className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                    <Briefcase size={14} /> Role & Location
                                 </h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Role:</span>
                                       <span className="text-cyber-primary font-bold uppercase text-xs">{newEmpData.role.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Department:</span>
                                       <span className="text-white">{newEmpData.department}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Location:</span>
                                       <span className="text-white font-medium">{sites.find(s => s.id === newEmpData.siteId)?.name || 'Central Operations'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Site Type:</span>
                                       <span className="text-white">{sites.find(s => s.id === newEmpData.siteId)?.type || 'Administration'}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Compensation */}
                              {newEmpData.salary && (
                                 <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                       <DollarSign size={14} /> Compensation
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                       <div className="flex justify-between">
                                          <span className="text-gray-400">Base Salary:</span>
                                          <span className="text-green-400 font-bold">${parseFloat(newEmpData.salary).toLocaleString()}/mo</span>
                                       </div>
                                       <div className="flex justify-between">
                                          <span className="text-gray-400">Specialization:</span>
                                          <span className="text-white">{newEmpData.specialization || 'Generalist'}</span>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Login Credentials */}
                              {newEmpData.email && newEmpData.password && (
                                 <div className="bg-cyber-primary/10 rounded-xl p-4 border border-cyber-primary/30">
                                    <h4 className="text-xs text-cyber-primary uppercase font-bold mb-3 flex items-center gap-2">
                                       <Key size={14} /> Login Credentials
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                       <div className="flex justify-between">
                                          <span className="text-gray-400">Email:</span>
                                          <span className="text-white font-mono text-xs">{newEmpData.email}</span>
                                       </div>
                                       <div className="flex justify-between items-center">
                                          <span className="text-gray-400">Password:</span>
                                          <span className="text-white font-mono text-xs">
                                             {['super_admin', 'hr'].includes(user?.role || '')
                                                ? newEmpData.password
                                                : '•'.repeat(newEmpData.password.length)}
                                          </span>
                                       </div>
                                       <p className="text-xs text-cyan-400 mt-2">✓ Login account will be created</p>
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* Preview Card */}
                           <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 border border-white/20">
                              <div className="flex items-center gap-4">
                                 <img
                                    src={newEmpData.avatar || `https://ui-avatars.com/api/?name=${newEmpData.firstName}+${newEmpData.lastName}&background=random`}
                                    alt=""
                                    className="w-16 h-16 rounded-xl object-cover border-2 border-cyber-primary"
                                 />
                                 <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">{newEmpData.firstName} {newEmpData.lastName}</h3>
                                    <p className="text-cyber-primary text-sm font-bold uppercase">{newEmpData.role.replace('_', ' ')}</p>
                                    <p className="text-gray-400 text-xs">{newEmpData.department} • {sites.find(s => s.id === newEmpData.siteId)?.name || 'Central Operations'}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs text-gray-400">Employee ID</p>
                                    <p className="text-cyan-400 font-mono font-bold">Will be assigned</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                  </div>

                  {/* Navigation Footer */}
                  <div className="pt-4 border-t border-white/10 flex justify-between mt-auto">
                     <button
                        onClick={handleWizardBack}
                        disabled={addStep === 1}
                        className="px-6 py-3 rounded-xl text-gray-400 font-bold hover:text-white disabled:opacity-30 transition-colors flex items-center gap-2"
                     >
                        <ArrowLeft size={16} /> Back
                     </button>

                     {addStep < 4 ? (
                        <button
                           onClick={handleWizardNext}
                           className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                           Next Step <ArrowRight size={16} />
                        </button>
                     ) : (
                        <button
                           onClick={handleFinalSubmit}
                           disabled={isSubmitting}
                           className={`px-8 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                           {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                           {isSubmitting ? 'Creating...' : 'Confirm & Create'}
                        </button>
                     )}
                  </div>
               </div>
            </Modal>

            {/* --- MODAL: EMPLOYEE PROFILE --- */}
            <Modal
               isOpen={!!selectedEmployee
               }
               onClose={() => setSelectedEmployee(null)}
               title="Staff Profile"
               size="lg"
            >
               {selectedEmployee && (
                  <StaffProfileView
                     employee={selectedEmployee}
                     onClose={() => setSelectedEmployee(null)}
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
            <Modal isOpen={isTerminateModalOpen} onClose={() => setIsTerminateModalOpen(false)} title="Confirm Termination" size="md">
               <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                     <AlertTriangle className="text-red-400" size={24} />
                     <div>
                        <h4 className="font-bold text-red-400">Critical Action</h4>
                        <p className="text-xs text-gray-400">You are about to terminate {selectedEmployee?.name}. This will revoke access and update their status to "Terminated".</p>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Type "TERMINATE" to confirm</label>
                     <input
                        type="text"
                        value={terminateInput}
                        onChange={(e) => setTerminateInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-colors"
                        placeholder="TERMINATE"
                     />
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button
                        onClick={() => setIsTerminateModalOpen(false)}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleConfirmTermination}
                        disabled={terminateInput !== 'TERMINATE'}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${terminateInput === 'TERMINATE' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                     >
                        Confirm Termination
                     </button>
                  </div>
               </div>
            </Modal>

            {/* --- MODAL: DELETE RECORD --- */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Employee Record" size="md">
               <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                     <Trash2 className="text-red-400" size={24} />
                     <div>
                        <h4 className="font-bold text-red-400">Irreversible Action</h4>
                        <p className="text-xs text-gray-400">This will permanently delete {employeeToDelete?.name}'s record from the database. This cannot be undone.</p>
                     </div>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400">
                     <p className="font-bold text-gray-300 mb-1">Requirements for deletion:</p>
                     <ul className="list-disc list-inside space-y-1">
                        <li>Employee must be <strong>Terminated</strong> first</li>
                        <li>You must be a <strong>CEO</strong></li>
                        <li>Record cannot be restored after deletion</li>
                     </ul>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Type "DELETE" to confirm permanent removal</label>
                     <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-colors"
                        placeholder="DELETE"
                     />
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleConfirmDelete}
                        disabled={deleteInput !== 'DELETE'}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${deleteInput === 'DELETE' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                     >
                        Permanently Delete
                     </button>
                  </div>
               </div>
            </Modal>

            {/* --- MODAL: APPROVE EMPLOYEE --- */}
            <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Employee" size="md">
               <div className="p-6 space-y-6">
                  <div className="text-center space-y-3">
                     <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 animate-pulse">
                        <UserCheck className="text-green-400" size={40} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white">Activate Talent</h3>
                        <p className="text-sm text-gray-400">Approving {employeeToApprove?.name} will grant them system access based on the assigned role: <span className="text-cyber-primary font-bold">{employeeToApprove?.role}</span></p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Department</p>
                        <p className="text-sm text-white font-medium">{employeeToApprove?.department || 'Unassigned'}</p>
                     </div>
                     <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Location</p>
                        <p className="text-sm text-white font-medium">{sites.find(s => s.id === employeeToApprove?.siteId)?.name || 'Unassigned'}</p>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <button
                        onClick={() => setIsApproveModalOpen(false)}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
                     >
                        Decline
                     </button>
                     <button
                        onClick={handleConfirmApprove}
                        className="flex-1 py-4 px-4 bg-cyber-primary text-black hover:bg-cyber-primary/90 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyber-primary/20"
                     >
                        <CheckCircle size={18} />
                        Approve & Activate
                     </button>
                  </div>
               </div>
            </Modal>

            {/* --- MODAL: VALIDATION WARNING --- */}
            <Modal isOpen={isValidationModalOpen} onClose={() => setIsValidationModalOpen(false)} title="Validation Warning" size="md">
               <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                     <AlertTriangle className="text-amber-400" size={24} />
                     <div>
                        <h4 className="font-bold text-amber-400">Configuration Mismatch</h4>
                        <p className="text-xs text-gray-400">A potential issue was identified with the role and location assignment.</p>
                     </div>
                  </div>

                  <div className="p-5 bg-black/40 border border-white/5 rounded-xl text-amber-200/90 text-sm leading-relaxed italic">
                     "{validationMessage}"
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button
                        onClick={() => setIsValidationModalOpen(false)}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
                     >
                        Cancel & Edit
                     </button>
                     <button
                        onClick={handleConfirmValidation}
                        className="flex-1 py-3 px-4 bg-amber-500 text-black hover:bg-amber-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                     >
                        Proceed Anyway
                     </button>
                  </div>
               </div>
            </Modal>
         </div >
      </>
   );
}

