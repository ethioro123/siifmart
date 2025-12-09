import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
   Briefcase, Search, Filter, UserPlus, MoreVertical, Mail, Phone, Shield, Star,
   Calendar, Award, CheckCircle, Clock, AlertTriangle, DollarSign, ClipboardList,
   TrendingUp, User, Plus, Trash2, ArrowRight, ArrowLeft, MapPin, Upload, CreditCard,
   MessageSquare, Download, XCircle, Lock, UserCheck, Network, Layers, FileText,
   Sun, Moon, Sunset, Building, Key
} from 'lucide-react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { MOCK_TASKS, CURRENCY_SYMBOL } from '../constants';
import { Employee, EmployeeTask, UserRole } from '../types';
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

// --- TYPES & MOCKS ---
type ViewMode = 'directory' | 'org' | 'shifts';
type ProfileTab = 'overview' | 'tasks' | 'timeoff' | 'payroll' | 'docs';

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
   styles: { text: string, bg: string, border: string, badge: string }
}[] = [
      {
         id: 'super_admin', label: 'Super Admin', desc: 'Unrestricted Access (Owner)',
         styles: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', badge: 'bg-yellow-400/20 text-yellow-400' }
      },
      {
         id: 'admin', label: 'System Admin', desc: 'Full System Control',
         styles: { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', badge: 'bg-purple-400/20 text-purple-400' }
      },
      {
         id: 'hr', label: 'HR Manager', desc: 'Staff & Payroll Management',
         styles: { text: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20', badge: 'bg-pink-400/20 text-pink-400' }
      },
      {
         id: 'finance_manager', label: 'Finance Manager', desc: 'Financial Oversight',
         styles: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', badge: 'bg-emerald-400/20 text-emerald-400' }
      },
      {
         id: 'procurement_manager', label: 'Procurement Mgr', desc: 'Supply Chain & Purchasing',
         styles: { text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', badge: 'bg-indigo-400/20 text-indigo-400' }
      },
      {
         id: 'manager', label: 'Department Manager', desc: 'Departmental Operations',
         styles: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', badge: 'bg-blue-400/20 text-blue-400' }
      },
      {
         id: 'it_support', label: 'IT Support', desc: 'Technical Assistance',
         styles: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', badge: 'bg-cyan-400/20 text-cyan-400' }
      },
      {
         id: 'cs_manager', label: 'CS Manager', desc: 'Customer Service Lead',
         styles: { text: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20', badge: 'bg-sky-400/20 text-sky-400' }
      },
      {
         id: 'store_supervisor', label: 'Store Supervisor', desc: 'Floor Management',
         styles: { text: 'text-blue-300', bg: 'bg-blue-300/10', border: 'border-blue-300/20', badge: 'bg-blue-300/20 text-blue-300' }
      },
      {
         id: 'inventory_specialist', label: 'Inventory Specialist', desc: 'Stock Control',
         styles: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', badge: 'bg-amber-400/20 text-amber-400' }
      },
      {
         id: 'pos', label: 'Cashier (POS)', desc: 'Point of Sale Access',
         styles: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', badge: 'bg-green-400/20 text-green-400' }
      },
      {
         id: 'picker', label: 'Warehouse Picker', desc: 'Order Fulfillment',
         styles: { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', badge: 'bg-orange-400/20 text-orange-400' }
      },
      {
         id: 'driver', label: 'Delivery Driver', desc: 'Logistics & Delivery',
         styles: { text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20', badge: 'bg-teal-400/20 text-teal-400' }
      },
      {
         id: 'warehouse_manager', label: 'Warehouse Manager', desc: 'Warehouse Operations Lead',
         styles: { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', badge: 'bg-violet-400/20 text-violet-400' }
      },
      {
         id: 'dispatcher', label: 'Dispatcher', desc: 'Logistics Coordination',
         styles: { text: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/20', badge: 'bg-fuchsia-400/20 text-fuchsia-400' }
      },
      {
         id: 'auditor', label: 'Auditor', desc: 'Compliance & Audit',
         styles: { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', badge: 'bg-rose-400/20 text-rose-400' }
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
   const { user } = useStore();
   const { employees, addEmployee, updateEmployee, deleteEmployee, activeSite, sites, addNotification } = useData();

   const [viewMode, setViewMode] = useState<ViewMode>('directory');
   const [tasks, setTasks] = useState<EmployeeTask[]>(MOCK_TASKS);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterRole, setFilterRole] = useState<string>('All');
   const [filterStatus, setFilterStatus] = useState<string>('All');
   const [filterDepartment, setFilterDepartment] = useState<string>('All');
   const [filterSite, setFilterSite] = useState<string>('All');
   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview');
   const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
   const [timeOffRequests, setTimeOffRequests] = useState<Array<{
      id: string;
      employeeId: string;
      type: 'Annual Leave' | 'Sick Leave' | 'Personal Leave' | 'Emergency';
      startDate: string;
      endDate: string;
      days: number;
      reason: string;
      status: 'Pending' | 'Approved' | 'Rejected';
      submittedAt: string;
   }>>([]);
   const [idCardEmployee, setIdCardEmployee] = useState<Employee | null>(null);
   const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
   const [terminateInput, setTerminateInput] = useState('');

   // Delete Confirmation State
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [deleteInput, setDeleteInput] = useState('');
   const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

   // Message Modal State
   const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
   const [messageInput, setMessageInput] = useState('');
   const [messageRecipient, setMessageRecipient] = useState<Employee | null>(null);

   // Approve Modal State
   const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
   const [employeeToApprove, setEmployeeToApprove] = useState<Employee | null>(null);

   // Salary Modal State
   const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
   const [salaryInput, setSalaryInput] = useState('');

   // Password Modal State
   const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
   const [passwordInput, setPasswordInput] = useState('');
   const [passwordEmployee, setPasswordEmployee] = useState<Employee | null>(null);

   // Document Delete Modal State
   const [isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen] = useState(false);
   const [documentToDelete, setDocumentToDelete] = useState<{ empId: string, docIndex: number, docName: string } | null>(null);

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

   // --- AUTHORITY LOGIC ---
   const getCreatableRoles = (): UserRole[] => {
      if (!user) return [];
      switch (user.role) {
         case 'super_admin':
            return ['super_admin', 'admin', 'manager', 'hr', 'warehouse_manager', 'dispatcher', 'pos', 'picker', 'driver', 'auditor', 'finance_manager', 'procurement_manager', 'cs_manager', 'it_support', 'store_supervisor', 'inventory_specialist'];
         case 'admin':
            return ['manager', 'hr', 'warehouse_manager', 'dispatcher', 'pos', 'picker', 'driver', 'auditor', 'store_supervisor', 'inventory_specialist'];
         case 'hr':
            return ['manager', 'warehouse_manager', 'dispatcher', 'pos', 'picker', 'driver', 'auditor', 'store_supervisor', 'inventory_specialist'];
         case 'manager':
            return ['pos', 'picker', 'driver', 'store_supervisor'];
         case 'warehouse_manager':
            return ['picker', 'driver', 'dispatcher'];
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

   // Role hierarchy for termination checks
   const getRoleHierarchy = (role: UserRole): number => {
      const hierarchy: Record<UserRole, number> = {
         'super_admin': 100,
         'admin': 90,
         'finance_manager': 80,
         'hr': 75,
         'procurement_manager': 70,
         'auditor': 65,
         'it_support': 60,
         'cs_manager': 55,
         'warehouse_manager': 50,
         'manager': 45,
         'store_supervisor': 40,
         'dispatcher': 35,
         'inventory_specialist': 30,
         'picker': 20,
         'driver': 20,
         'pos': 10
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

      // Super Admin can only be terminated by themselves (which is blocked above) or not at all
      if (targetEmployee.role === 'super_admin') {
         return false; // Super Admin cannot be terminated by anyone
      }

      // Admin can only be terminated by Super Admin
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

   const filteredEmployees = useMemo(() => {
      return visibleEmployees.filter(emp => {
         // Enhanced search - search across multiple fields
         const searchLower = searchTerm.toLowerCase();
         const matchesSearch = !searchTerm ||
            emp.name.toLowerCase().includes(searchLower) ||
            emp.email.toLowerCase().includes(searchLower) ||
            (emp.phone && emp.phone.toLowerCase().includes(searchLower)) ||
            (emp.department && emp.department.toLowerCase().includes(searchLower)) ||
            (sites.find(s => s.id === emp.siteId || s.id === emp.site_id)?.name || '').toLowerCase().includes(searchLower);

         // Role filter
         const matchesRole = filterRole === 'All' || emp.role === filterRole;

         // Status filter
         const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;

         // Department filter
         const matchesDepartment = filterDepartment === 'All' || emp.department === filterDepartment;

         // Site filter
         const matchesSite = filterSite === 'All' || emp.siteId === filterSite || emp.site_id === filterSite;

         return matchesSearch && matchesRole && matchesStatus && matchesDepartment && matchesSite;
      });
   }, [visibleEmployees, searchTerm, filterRole, filterStatus, filterDepartment, filterSite, sites]);

   const getEmployeeTasks = (id: string) => tasks.filter(t => t.assignedTo === id);

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

   // New Task State
   const [newTaskTitle, setNewTaskTitle] = useState('');
   const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

   // --- ACTIONS ---

   const handleCycleFilter = () => {
      const roles = ['All', ...SYSTEM_ROLES.map(r => r.id)];
      const currentIndex = roles.indexOf(filterRole);
      const nextIndex = (currentIndex + 1) % roles.length;
      setFilterRole(roles[nextIndex]);
   };

   const handleSendMessage = (emp: Employee) => {
      setMessageRecipient(emp);
      setMessageInput('');
      setIsMessageModalOpen(true);
   };

   const handleConfirmSendMessage = () => {
      if (!messageRecipient || !messageInput.trim()) return;

      addNotification('success', `Message sent to ${messageRecipient.name} via secure channel.`);
      setIsMessageModalOpen(false);
      setMessageRecipient(null);
      setMessageInput('');
   };

   const handleApproveEmployee = (empId: string, empName: string, empRole: UserRole) => {
      // RBAC: Only Super Admin can approve Admin/Super Admin roles
      const isHighLevelRole = ['admin', 'super_admin'].includes(empRole);

      if (isHighLevelRole && user?.role !== 'super_admin') {
         addNotification('alert', `Access Denied: Only Super Admin can approve ${empRole.replace('_', ' ')} roles.`);
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

      updateEmployee({ ...employeeToApprove, status: 'Active' });
      addNotification('success', `${employeeToApprove.name} is now Active.`);
      setIsApproveModalOpen(false);
      setEmployeeToApprove(null);
   };

   const handleEditSalary = () => {
      if (!selectedEmployee) return;
      if (!canManageEmployees) {
         addNotification('alert', "Access Denied: Only HR or Admins can modify compensation data.");
         return;
      }

      setSalaryInput(selectedEmployee.salary?.toString() || '');
      setIsSalaryModalOpen(true);
   };

   const handleConfirmSalary = () => {
      if (!selectedEmployee) return;

      const newSalary = parseFloat(salaryInput);
      if (isNaN(newSalary)) {
         addNotification('alert', 'Please enter a valid number for salary.');
         return;
      }

      const updatedEmp = { ...selectedEmployee, salary: newSalary };
      updateEmployee(updatedEmp);
      setSelectedEmployee(updatedEmp);
      setIsSalaryModalOpen(false);
      setSalaryInput('');
      addNotification('success', `Salary updated for ${selectedEmployee.name}`);
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
            addNotification('alert', "Access Denied: Super Admin cannot be terminated through the system.");
         } else if (selectedEmployee.role === 'admin' && user?.role !== 'super_admin') {
            addNotification('alert', "Access Denied: Only Super Admin can terminate Admin roles.");
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

   const handleResetPassword = (employee: Employee) => {
      if (user?.role !== 'super_admin' && user?.role !== 'admin') {
         addNotification('alert', "Access Denied: Only Super Admin or Admin can reset passwords.");
         return;
      }

      setPasswordEmployee(employee);
      setPasswordInput('');
      setIsPasswordModalOpen(true);
   };

   const [isResetting, setIsResetting] = useState(false);

   const handleConfirmResetPassword = async () => {
      console.log('🔄 Attempting password reset...');
      if (!passwordEmployee) {
         console.error('❌ No employee selected for password reset');
         return;
      }

      console.log('👤 Selected employee:', passwordEmployee.name, passwordEmployee.id);

      if (passwordInput.length < 6) {
         addNotification('alert', 'Password must be at least 6 characters long.');
         return;
      }

      setIsResetting(true);

      try {
         console.log('📦 Importing admin service...');
         const { resetEmployeePassword } = await import('../services/admin.service');

         console.log('🔐 Calling resetEmployeePassword...');
         await resetEmployeePassword(passwordEmployee.id, passwordInput);
         console.log('✅ Password reset success!');

         addNotification('success', `✅ Password Reset!\n\nNew password for ${passwordEmployee.name}:\n${passwordInput}\n\nThey can now login with:\nEmail: ${passwordEmployee.email}\nPassword: ${passwordInput}`);
         setIsPasswordModalOpen(false);
         setPasswordEmployee(null);
         setPasswordInput('');
      } catch (error: any) {
         console.error("❌ Password reset error details:", error);

         // specific handling for "User not found" which is common with seed data
         if (error.message && (error.message.includes('User not found') || error.status === 404)) {
            addNotification('alert', `Failed: User account not found in Auth system.\n\nThis usually happens with seed data employees who don't have real login accounts.\n\nYou may need to delete and recreate this employee to generate a valid login.`);
         } else if (error.message && error.message.includes('Service role key')) {
            addNotification('alert', `Configuration Error: Admin capabilities not set up.\n\n${error.message}`);
         } else {
            addNotification('alert', `Failed to reset password:\n\n${error.message || 'Unknown error occurred'}`);
         }
      } finally {
         setIsResetting(false);
      }
   };

   const handleDeleteEmployee = (id: string) => {
      if (user?.role !== 'super_admin') {
         addNotification('alert', "Access Denied: Record deletion is restricted to Super Admin. Please use 'Terminate' instead.");
         return;
      }

      const employee = employees.find(e => e.id === id);
      if (!employee) {
         addNotification('alert', "Employee not found.");
         return;
      }

      // Prevent deleting super_admin
      if (employee.role === 'super_admin') {
         addNotification('alert', "Access Denied: Super Admin records cannot be deleted. Please use 'Terminate' instead.");
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
         await deleteEmployee(employeeToDelete.id, user?.name || 'System');
         addNotification('success', `Employee ${employeeToDelete.name} has been permanently deleted.`);
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

   // Handle File Change - Robust Logic (for avatar)
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         // Validate file type
         if (!file.type.startsWith('image/')) {
            addNotification('alert', 'Please select an image file (JPG, PNG, etc.)');
            return;
         }
         // Validate file size (max 5MB)
         if (file.size > 5 * 1024 * 1024) {
            addNotification('alert', 'File size too large. Maximum size is 5MB.');
            return; // Exit if file is too large
         }
         const reader = new FileReader();
         reader.onloadend = () => {
            const result = reader.result as string;
            setNewEmpData(prev => ({ ...prev, avatar: result }));
            addNotification('success', 'Photo uploaded successfully!');
         };
         reader.onerror = () => {
            addNotification('alert', 'Failed to read file. Please try again.');
         };
         reader.readAsDataURL(file);
      }
      // Reset input value so the same file can be selected again if needed
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
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
   const handleDocumentDelete = (index: number) => {
      if (!selectedEmployee) return;
      const currentDocs = employeeDocuments[selectedEmployee.id] || [];
      const doc = currentDocs[index];

      setDocumentToDelete({ empId: selectedEmployee.id, docIndex: index, docName: doc.name });
      setIsDeleteDocumentModalOpen(true);
   };

   const handleConfirmDocumentDelete = () => {
      if (!documentToDelete) return;

      setEmployeeDocuments(prev => ({
         ...prev,
         [documentToDelete.empId]: (prev[documentToDelete.empId] || []).filter((_, i) => i !== documentToDelete.docIndex)
      }));
      addNotification('success', `Document "${documentToDelete.docName}" deleted.`);
      setIsDeleteDocumentModalOpen(false);
      setDocumentToDelete(null);
   };

   // Get documents for current employee
   const getCurrentEmployeeDocuments = () => {
      if (!selectedEmployee) return [];
      return employeeDocuments[selectedEmployee.id] || [];
   };

   const handleConfirmValidation = async () => {
      setIsValidationModalOpen(false);
      await submitEmployeeData();
   };

   const handleFinalSubmit = async () => {
      console.log('🔵 handleFinalSubmit called!');
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
               addNotification('info', 'Note: Only Super Admins can create login accounts. Creating employee profile only.');
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
      }
   };

   // --- TASK ACTIONS ---

   const handleAddTask = () => {
      if (!selectedEmployee || !newTaskTitle) return;
      const newTask: EmployeeTask = {
         id: `T-${Date.now()}`,
         title: newTaskTitle,
         description: 'Manual Assignment',
         assignedTo: selectedEmployee.id,
         status: 'Pending',
         priority: newTaskPriority,
         dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
   };

   const handleUpdateTask = (taskId: string, status: EmployeeTask['status']) => {
      if (!canManageEmployees && !isDepartmentManager) return;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
   };

   const handleCompleteTask = (taskId: string) => {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
   };

   // --- RENDERERS ---

   const StatCard = ({ title, value, icon: Icon, color }: any) => (
      <div className="bg-cyber-gray border border-white/5 rounded-xl p-4 flex items-center gap-4">
         <div className={`p-3 rounded-lg bg-white/5 ${color}`}>
            <Icon size={24} />
         </div>
         <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
         </div>
      </div>
   );

   return (
      <div className="space-y-6">
         {/* Header & Stats */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="text-cyber-primary" />
                  Human Capital Management
               </h2>
               <p className="text-gray-400 text-sm">Strategic workforce planning, payroll, and talent ops.</p>
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

         {/* KPI Metrics */}
         {canViewAll && viewMode === 'directory' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <StatCard title="Total Workforce" value={employees.length} icon={User} color="text-blue-400" />
               <StatCard title="Active Shift" value={Math.floor(employees.length * 0.7)} icon={Clock} color="text-green-400" />
               <StatCard title="Pending Tasks" value={tasks.filter(t => t.status !== 'Completed').length} icon={ClipboardList} color="text-yellow-400" />
               <StatCard title="Avg Performance" value="88%" icon={TrendingUp} color="text-cyber-primary" />
            </div>
         )}



         {/* ... (Directory & Org views same as before) ... */}

         {/* --- DIRECTORY MODE --- */}
         {viewMode === 'directory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 space-y-4">
                     {/* Search Bar */}
                     <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 focus-within:border-cyber-primary/50 transition-colors">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                           type="text"
                           placeholder={canViewAll ? "Search by name, email, phone, department, or location..." : "Search profile..."}
                           className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none placeholder-gray-500"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           aria-label="Search Employees"
                           title="Search Employees"
                        />
                        {searchTerm && (
                           <button
                              onClick={() => setSearchTerm('')}
                              className="ml-2 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                              title="Clear search"
                           >
                              <XCircle size={16} />
                           </button>
                        )}
                     </div>

                     {/* Filters Row */}
                     {canViewAll && (
                        <div className="flex flex-wrap gap-3">
                           {/* Role Filter */}
                           <div className="flex items-center gap-2">
                              <Filter size={14} className="text-gray-400" />
                              <select
                                 value={filterRole}
                                 onChange={(e) => setFilterRole(e.target.value)}
                                 className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyber-primary focus:outline-none min-w-[140px]"
                                 aria-label="Filter by Role"
                                 title="Filter by Role"
                              >
                                 <option value="All">All Roles</option>
                                 {SYSTEM_ROLES.map(role => (
                                    <option key={role.id} value={role.id} className="text-black">
                                       {role.id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </option>
                                 ))}
                              </select>
                           </div>

                           {/* Status Filter */}
                           <select
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyber-primary focus:outline-none min-w-[120px]"
                              aria-label="Filter by Status"
                              title="Filter by Status"
                           >
                              <option value="All">All Status</option>
                              <option value="Active" className="text-black">Active</option>
                              <option value="Pending Approval" className="text-black">Pending</option>
                              <option value="Inactive" className="text-black">Inactive</option>
                           </select>

                           {/* Department Filter */}
                           <select
                              value={filterDepartment}
                              onChange={(e) => setFilterDepartment(e.target.value)}
                              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyber-primary focus:outline-none min-w-[160px]"
                              aria-label="Filter by Department"
                              title="Filter by Department"
                           >
                              <option value="All">All Departments</option>
                              {Array.from(new Set(visibleEmployees.map(e => e.department).filter(Boolean))).map(dept => (
                                 <option key={dept} value={dept} className="text-black">{dept}</option>
                              ))}
                           </select>

                           {/* Site Filter */}
                           <select
                              value={filterSite}
                              onChange={(e) => setFilterSite(e.target.value)}
                              className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyber-primary focus:outline-none min-w-[160px]"
                              aria-label="Filter by Site"
                              title="Filter by Site"
                           >
                              <option value="All">All Locations</option>
                              {sites.map(site => (
                                 <option key={site.id} value={site.id} className="text-black">{site.name}</option>
                              ))}
                           </select>

                           {/* Clear Filters Button */}
                           {(filterRole !== 'All' || filterStatus !== 'All' || filterDepartment !== 'All' || filterSite !== 'All') && (
                              <button
                                 onClick={() => {
                                    setFilterRole('All');
                                    setFilterStatus('All');
                                    setFilterDepartment('All');
                                    setFilterSite('All');
                                    setSearchTerm('');
                                 }}
                                 className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold transition-colors flex items-center gap-2"
                              >
                                 <XCircle size={14} />
                                 Clear Filters
                              </button>
                           )}

                           {/* Results Count */}
                           <div className="ml-auto flex items-center text-xs text-gray-400">
                              <span className="font-bold text-white">{filteredEmployees.length}</span>
                              <span className="ml-1">of {visibleEmployees.length} employees</span>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Employee Table - Modern Row Design */}
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                     {/* Table Header */}
                     <div className="bg-black/30 border-b border-white/5 px-6 py-3 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</span>
                        </div>
                        <div className="col-span-2">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role & Status</span>
                        </div>
                        <div className="col-span-2">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</span>
                        </div>
                        <div className="col-span-2">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance</span>
                        </div>
                        <div className="col-span-2 text-right">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</span>
                        </div>
                     </div>

                     {/* Employee Rows */}
                     <div className="divide-y divide-white/5">
                        {filteredEmployees.map((employee) => {
                           const empTasks = getEmployeeTasks(employee.id);
                           const pendingTasks = empTasks.filter(t => t.status !== 'Completed').length;
                           const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || SYSTEM_ROLES[8];

                           return (
                              <EmployeeRow
                                 key={employee.id}
                                 employee={employee}
                                 sites={sites}
                                 roleConfig={roleConfig}
                                 pendingTasks={pendingTasks}
                                 onSelect={() => setSelectedEmployee(employee)}
                                 onMessage={() => handleSendMessage(employee)}
                                 onResetPassword={() => handleResetPassword(employee)}
                                 onDelete={() => handleDeleteEmployee(employee.id)}
                                 onApprove={() => handleApproveEmployee(employee.id, employee.name, employee.role)}
                                 canResetPassword={user?.role === 'super_admin' || user?.role === 'admin'}
                                 canDelete={user?.role === 'super_admin'}
                                 canApprove={canApproveEmployees}
                                 isSuperAdmin={user?.role === 'super_admin'}
                              />
                           );
                        })}

                        {/* Empty State */}
                        {filteredEmployees.length === 0 && (
                           <div className="px-6 py-16 text-center text-gray-500">
                              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                 <User size={32} className="opacity-50" />
                              </div>
                              <p className="text-lg font-medium">
                                 {canViewAll
                                    ? "No employees found matching your criteria."
                                    : "Your employee profile was not found in the linked database."}
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Global Task Queue - Enhanced */}
               {canViewAll && (
                  <div className="bg-gradient-to-br from-cyber-gray to-black/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-4 shadow-2xl">
                     {/* Header with Stats */}
                     <div className="p-4 border-b border-white/5 bg-gradient-to-r from-black/40 to-cyber-gray/40">
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="font-bold text-white flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-cyber-primary/20 to-blue-500/20 rounded-lg">
                                 <ClipboardList className="text-cyber-primary" size={18} />
                              </div>
                              Global Task Queue
                           </h3>
                           <div className="flex items-center gap-2">
                              <div className="px-2 py-1 bg-cyber-primary/10 border border-cyber-primary/20 rounded-lg">
                                 <span className="text-xs font-bold text-cyber-primary">
                                    {tasks.filter(t => t.status !== 'Completed').length} Active
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Priority Summary */}
                        <div className="grid grid-cols-3 gap-2">
                           <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">High</div>
                              <div className="text-lg font-bold text-red-400">
                                 {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length}
                              </div>
                           </div>
                           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Medium</div>
                              <div className="text-lg font-bold text-yellow-400">
                                 {tasks.filter(t => t.priority === 'Medium' && t.status !== 'Completed').length}
                              </div>
                           </div>
                           <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Low</div>
                              <div className="text-lg font-bold text-blue-400">
                                 {tasks.filter(t => t.priority === 'Low' && t.status !== 'Completed').length}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Task List */}
                     <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {tasks
                           .filter(t => t.status !== 'Completed')
                           .sort((a, b) => {
                              const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
                              return priorityOrder[a.priority] - priorityOrder[b.priority];
                           })
                           .map(task => {
                              const assignee = employees.find(e => e.id === task.assignedTo);
                              const priorityStyles = {
                                 'High': {
                                    bg: 'from-red-500/10 to-black/40',
                                    border: 'border-red-500/30',
                                    hoverBorder: 'hover:border-red-500/60',
                                    badge: 'text-red-400 border-red-500/30 bg-red-500/10',
                                    shadow: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                 },
                                 'Medium': {
                                    bg: 'from-yellow-500/10 to-black/40',
                                    border: 'border-yellow-500/30',
                                    hoverBorder: 'hover:border-yellow-500/60',
                                    badge: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
                                    shadow: 'hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                 },
                                 'Low': {
                                    bg: 'from-blue-500/10 to-black/40',
                                    border: 'border-blue-500/30',
                                    hoverBorder: 'hover:border-blue-500/60',
                                    badge: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
                                    shadow: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                 }
                              };
                              const style = priorityStyles[task.priority];

                              return (
                                 <div
                                    key={task.id}
                                    onClick={() => {
                                       if (assignee) {
                                          setSelectedEmployee(assignee);
                                       }
                                    }}
                                    className={`p-3 bg-gradient-to-br ${style.bg} border ${style.border} ${style.hoverBorder} ${style.shadow} rounded-xl transition-all cursor-pointer group relative overflow-hidden`}
                                 >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>

                                    <div className="relative">
                                       {/* Task Header */}
                                       <div className="flex justify-between items-start mb-2">
                                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${style.badge}`}>
                                             {task.priority}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                             <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'In Progress' ? 'bg-yellow-400 animate-pulse' :
                                                task.status === 'Not Started' ? 'bg-gray-400' : 'bg-green-400'
                                                }`}></div>
                                             <span className="text-[10px] text-gray-400">{task.status}</span>
                                          </div>
                                       </div>

                                       {/* Task Title */}
                                       <p className="text-sm text-white font-medium line-clamp-2 mb-3">{task.title}</p>

                                       {/* Assignee */}
                                       {assignee && (
                                          <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5">
                                             <img
                                                src={assignee.avatar}
                                                className="w-6 h-6 rounded-lg border border-white/10"
                                                alt={assignee.name}
                                             />
                                             <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{assignee.name}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{assignee.role.replace('_', ' ')}</p>
                                             </div>
                                             <ArrowRight size={12} className="text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              );
                           })}

                        {/* Empty State */}
                        {tasks.filter(t => t.status !== 'Completed').length === 0 && (
                           <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-primary/10 to-green-500/10 flex items-center justify-center mb-4 border border-white/5">
                                 <CheckCircle size={40} className="text-green-500 opacity-50" />
                              </div>
                              <p className="text-lg font-bold text-white">All Clear!</p>
                              <p className="text-sm text-gray-500 mt-1">No pending tasks at the moment</p>
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
         )
         }

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
                              className="hidden"
                              accept="image/*"
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
                                    placeholder="Set initial password"
                                    onChange={e => setNewEmpData({ ...newEmpData, password: e.target.value })}
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
                                    <div className="flex justify-between">
                                       <span className="text-gray-400">Password:</span>
                                       <span className="text-white font-mono text-xs">{'•'.repeat(newEmpData.password.length)}</span>
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
                        className="px-8 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center gap-2"
                     >
                        <CheckCircle size={16} /> Confirm & Create
                     </button>
                  )}
               </div>
            </div>
         </Modal>

         {/* --- MODAL: EMPLOYEE PROFILE --- */}
         <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Staff Profile" size="lg">

            {selectedEmployee && (
               <div>
                  {/* Header Profile */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                     <img src={selectedEmployee.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-cyber-primary" alt="" />
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <div>
                              <h3 className="text-2xl font-bold text-white">{selectedEmployee.name}</h3>
                              <p className="text-cyan-400 font-mono text-sm font-bold">ID: {selectedEmployee.code || 'Not Assigned'}</p>
                              <p className="text-gray-400">{selectedEmployee.role.toUpperCase().replace('_', ' ')} • {selectedEmployee.department}</p>
                           </div>
                           <div className="text-right flex flex-col items-end gap-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${selectedEmployee.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                 selectedEmployee.status === 'Pending Approval' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                 }`}>
                                 {selectedEmployee.status}
                              </span>
                              <div className="flex gap-2">
                                 <button
                                    onClick={() => setIdCardEmployee(selectedEmployee)}
                                    className="flex items-center gap-2 text-xs text-cyber-primary hover:text-white transition-colors bg-cyber-primary/10 px-2 py-1 rounded border border-cyber-primary/20"
                                 >
                                    <CreditCard size={12} /> Generate ID
                                 </button>
                                 <button
                                    onClick={() => handleSendMessage(selectedEmployee)}
                                    className="flex items-center gap-2 text-xs text-cyber-primary hover:text-white transition-colors bg-cyber-primary/10 px-2 py-1 rounded border border-cyber-primary/20"
                                 >
                                    <MessageSquare size={12} /> Message
                                 </button>
                              </div>
                           </div>
                        </div>
                        {/* Badges */}
                        <div className="flex gap-2 mt-3">
                           {selectedEmployee.badges?.map(badge => (
                              <span key={badge} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[10px] uppercase font-bold flex items-center gap-1">
                                 <Award size={10} /> {badge}
                              </span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
                     {['overview', 'tasks', 'timeoff', 'docs', 'payroll'].map((tab) => (
                        <button
                           key={tab}
                           onClick={() => setActiveProfileTab(tab as ProfileTab)}
                           // Hide payroll for standard employees viewing others
                           className={`px-6 py-3 text-sm font-bold capitalize transition-colors border-b-2 whitespace-nowrap ${activeProfileTab === tab ? 'text-cyber-primary border-cyber-primary' : 'text-gray-400 border-transparent hover:text-white'} ${(tab === 'payroll' && !canViewAll && selectedEmployee.name !== user?.name) ? 'hidden' : ''}`}
                        >
                           {tab === 'timeoff' ? 'Leave' : tab}
                        </button>
                     ))}
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[300px]">
                     {activeProfileTab === 'overview' && (
                        <div className="space-y-6">
                           {/* Stats Grid */}
                           <div className="grid grid-cols-3 gap-4">
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                 <p className="text-xs text-gray-400 uppercase">Performance Score</p>
                                 <p className="text-3xl font-bold text-white mt-1">{selectedEmployee.performanceScore}</p>
                              </div>
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                 <p className="text-xs text-gray-400 uppercase">Attendance Rate</p>
                                 <p className="text-3xl font-bold text-green-400 mt-1">{selectedEmployee.attendanceRate}%</p>
                              </div>
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                 <p className="text-xs text-gray-400 uppercase">Tasks Done</p>
                                 <p className="text-3xl font-bold text-blue-400 mt-1">{getEmployeeTasks(selectedEmployee.id).filter(t => t.status === 'Completed').length}</p>
                              </div>
                           </div>

                           {/* Personal Information */}
                           <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                 <User size={16} className="text-cyber-primary" /> Personal Information
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contact Details</p>
                                    <div className="space-y-3">
                                       <div className="flex items-center gap-3 text-sm">
                                          <Mail size={14} className="text-gray-400" />
                                          <span className="text-white">{selectedEmployee.email}</span>
                                       </div>
                                       <div className="flex items-center gap-3 text-sm">
                                          <Phone size={14} className="text-gray-400" />
                                          <span className="text-white">{selectedEmployee.phone || 'N/A'}</span>
                                       </div>
                                       <div className="flex items-center gap-3 text-sm">
                                          <MapPin size={14} className="text-gray-400" />
                                          <span className="text-white">{selectedEmployee.address || 'No address provided'}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Employment Details</p>
                                    <div className="space-y-3">
                                       <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                          <span className="text-gray-400">Joined Date</span>
                                          <span className="text-white font-mono">{selectedEmployee.joinDate}</span>
                                       </div>
                                       <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                          <span className="text-gray-400">Specialization</span>
                                          <span className="text-white">{selectedEmployee.specialization || 'Generalist'}</span>
                                       </div>
                                       <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                          <span className="text-gray-400">Workplace</span>
                                          <span className="text-cyber-primary">{sites.find(s => s.id === selectedEmployee.siteId)?.name || 'Headquarters'}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              {selectedEmployee.emergencyContact && (
                                 <div className="mt-6 pt-4 border-t border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Emergency Contact</p>
                                    <p className="text-sm text-white">{selectedEmployee.emergencyContact}</p>
                                 </div>
                              )}
                           </div>

                           <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                              <h4 className="text-sm font-bold text-white mb-4">Weekly Hours Log</h4>
                              <div className="h-40 w-full">
                                 <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                    <BarChart data={ATTENDANCE_DATA}>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                       <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                       <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                       <Bar dataKey="hours" fill="#00ff9d" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeProfileTab === 'tasks' && (() => {
                        const canEditTasks = canManageEmployees || isDepartmentManager;
                        return (
                           <div>
                              <div className="flex gap-2 mb-4">
                                 <input
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Assign new task..."
                                    disabled={!canEditTasks}
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyber-primary disabled:opacity-50"
                                    aria-label="Assign new task"
                                    title="Assign new task"
                                 />
                                 <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                                    disabled={!canEditTasks}
                                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none disabled:opacity-50"
                                    aria-label="Select Task Priority"
                                    title="Select Task Priority"
                                 >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                 </select>
                                 {canEditTasks && (
                                    <button onClick={handleAddTask} className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-cyber-accent"
                                       aria-label="Add Task"
                                       title="Add Task"
                                    >
                                       <Plus size={18} />
                                    </button>
                                 )}
                              </div>

                              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                 {getEmployeeTasks(selectedEmployee.id).map(task => (
                                    <div key={task.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                          <div>
                                             <p className={`text-sm font-medium ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
                                             <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                                          </div>
                                       </div>
                                       {task.status !== 'Completed' && (
                                          <button onClick={() => handleCompleteTask(task.id)} className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors" title="Mark Complete">
                                             <CheckCircle size={18} />
                                          </button>
                                       )}
                                    </div>
                                 ))}
                                 {getEmployeeTasks(selectedEmployee.id).length === 0 && (
                                    <p className="text-center text-gray-500 py-8">No active tasks assigned.</p>
                                 )}
                              </div>
                           </div>
                        );
                     })()}

                     {activeProfileTab === 'timeoff' && (
                        <div className="space-y-6 animate-in fade-in">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                 <div className="flex justify-between mb-2">
                                    <span className="text-sm text-white font-bold">Annual Leave</span>
                                    <span className="text-xs text-gray-400">12 / 20 Days</span>
                                 </div>
                                 <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyber-primary w-[60%]"></div>
                                 </div>
                              </div>
                              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                 <div className="flex justify-between mb-2">
                                    <span className="text-sm text-white font-bold">Sick Leave</span>
                                    <span className="text-xs text-gray-400">2 / 10 Days</span>
                                 </div>
                                 <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 w-[20%]"></div>
                                 </div>
                              </div>
                           </div>

                           <h4 className="text-sm font-bold text-white">Recent Requests</h4>
                           <div className="space-y-2">
                              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                 <div>
                                    <p className="text-sm text-white">Vacation</p>
                                    <p className="text-xs text-gray-500">Aug 12 - Aug 15</p>
                                 </div>
                                 <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">Approved</span>
                              </div>
                           </div>
                           <button
                              onClick={() => setIsTimeOffModalOpen(true)}
                              className="w-full py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl border border-cyber-primary transition-colors"
                           >
                              Request Time Off
                           </button>
                        </div>
                     )}

                     {activeProfileTab === 'docs' && (
                        <div className="space-y-4 animate-in fade-in">
                           {/* Document Upload Area */}
                           <div
                              onClick={() => documentInputRef.current?.click()}
                              className="p-4 border-2 border-dashed border-white/10 rounded-xl text-center hover:border-cyber-primary/50 transition-colors cursor-pointer bg-white/5 group"
                           >
                              <Upload className="mx-auto text-gray-400 mb-2 group-hover:text-cyber-primary transition-colors" size={24} />
                              <p className="text-sm text-white font-bold">Upload Document</p>
                              <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                           </div>
                           <input
                              type="file"
                              ref={documentInputRef}
                              onChange={handleDocumentUpload}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                              aria-label="Upload Document"
                              title="Upload Document"
                           />

                           {/* Uploaded Documents List */}
                           <div className="space-y-2">
                              {getCurrentEmployeeDocuments().length === 0 && (
                                 <div className="text-center py-8 text-gray-500">
                                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No documents uploaded yet</p>
                                    <p className="text-xs mt-1">Click above to upload documents</p>
                                 </div>
                              )}
                              {getCurrentEmployeeDocuments().map((doc, i) => (
                                 <div
                                    key={i}
                                    className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors group"
                                 >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                       <FileText size={16} className="text-blue-400 flex-shrink-0" />
                                       <div className="flex-1 min-w-0">
                                          <span className="text-sm text-gray-300 block truncate">{doc.name}</span>
                                          <span className="text-[10px] text-gray-500">
                                             {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                                          </span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             handleDocumentDownload(doc);
                                          }}
                                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                          title="Download"
                                       >
                                          <Download size={14} className="text-gray-500 hover:text-cyber-primary" />
                                       </button>
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             handleDocumentDelete(i);
                                          }}
                                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                          title="Delete"
                                       >
                                          <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {activeProfileTab === 'payroll' && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
                              <div>
                                 <p className="text-xs text-gray-400 uppercase">Base Monthly Salary</p>
                                 <p className="text-2xl font-mono font-bold text-white">{CURRENCY_SYMBOL} {selectedEmployee.salary?.toLocaleString()}</p>
                              </div>
                              {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'super_admin') && (
                                 <button
                                    onClick={handleEditSalary}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                                 >
                                    Edit Salary
                                 </button>
                              )}
                           </div>

                           <h4 className="text-sm font-bold text-white mt-6 mb-2">Payslip History</h4>
                           <div className="space-y-2">
                              {[1, 2, 3].map(i => (
                                 <div
                                    key={i}
                                    onClick={() => handleDownloadPayslip(202400 + i)}
                                    className="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group"
                                 >
                                    <div className="flex items-center gap-3">
                                       <DollarSign className="text-green-500" size={16} />
                                       <span className="text-sm text-gray-300 group-hover:text-white">Payslip #{202400 + i}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <span className="text-xs text-gray-500">Mar {30 - i * 7}, 2024</span>
                                       <Download size={14} className="text-gray-600 group-hover:text-cyber-primary" />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* TERMINATE ACTION - With Role Hierarchy Checks */}
                  {canTerminateEmployees && canTerminateTargetEmployee(selectedEmployee) && (
                     <div className="border-t border-white/10 mt-8 pt-6">
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                           <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                              <AlertTriangle size={16} /> Danger Zone
                           </h4>
                           <p className="text-xs text-gray-400 mb-4">
                              Terminating an employee will immediately revoke their system access. This action is logged and requires administrative confirmation.
                           </p>
                           <button
                              onClick={(e) => handleTerminateEmployee(e)}
                              type="button"
                              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                           >
                              <XCircle size={18} /> Terminate Employment
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Show message if cannot terminate */}
                  {canTerminateEmployees && selectedEmployee && !canTerminateTargetEmployee(selectedEmployee) && (
                     <div className="border-t border-white/10 mt-8 pt-6">
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                           <h4 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                              <AlertTriangle size={16} /> Termination Restricted
                           </h4>
                           <p className="text-xs text-gray-400">
                              {selectedEmployee.id === user?.id
                                 ? "You cannot terminate your own employment."
                                 : selectedEmployee.role === 'super_admin'
                                    ? "Super Admin cannot be terminated through the system."
                                    : selectedEmployee.role === 'admin' && user?.role !== 'super_admin'
                                       ? "Only Super Admin can terminate Admin roles."
                                       : `You do not have permission to terminate employees with role "${selectedEmployee.role}".`
                              }
                           </p>
                        </div>
                     </div>
                  )}
               </div>
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

         {/* Time Off Request Modal */}
         <Modal isOpen={isTimeOffModalOpen} onClose={() => setIsTimeOffModalOpen(false)} title="Request Time Off" size="md">
            <TimeOffRequestForm
               employee={selectedEmployee || (user ? employees.find(e => e.id === user.id || e.email === user.email) : null)}
               onSubmit={(request) => {
                  const newRequest = {
                     ...request,
                     id: `TO-${Date.now()}`,
                     employeeId: selectedEmployee?.id || user?.id || '',
                     status: 'Pending' as const,
                     submittedAt: new Date().toISOString()
                  };
                  setTimeOffRequests(prev => [...prev, newRequest]);
                  addNotification('success', `Time off request submitted for ${request.days} day(s). Awaiting approval.`);
                  setIsTimeOffModalOpen(false);
               }}
            />
         </Modal>

         {/* Termination Confirmation Modal */}
         <Modal isOpen={isTerminateModalOpen} onClose={() => setIsTerminateModalOpen(false)} title="Confirm Termination" size="md">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="p-3 bg-red-500/20 rounded-full">
                     <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Critical Action</h3>
                     <p className="text-red-200 text-sm">You are about to terminate this employee. This action cannot be easily undone.</p>
                  </div>
               </div>

               <p className="text-gray-300 mb-6">
                  To confirm termination for <span className="text-white font-bold">{selectedEmployee?.name}</span>, please type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">TERMINATE</span> below:
               </p>

               <input
                  type="text"
                  value={terminateInput}
                  onChange={(e) => setTerminateInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                  placeholder="Type TERMINATE to confirm"
                  aria-label="Confirm Termination Input"
                  title="Confirm Termination Input"
               />

               <div className="flex justify-end gap-3">
                  <button
                     onClick={() => setIsTerminateModalOpen(false)}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirmTermination}
                     disabled={terminateInput !== 'TERMINATE'}
                     className={`px-6 py-2 rounded-lg font-bold transition-all ${terminateInput === 'TERMINATE'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                  >
                     Terminate Employment
                  </button>
               </div>
            </div>
         </Modal>

         {/* Delete Confirmation Modal */}
         <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Permanent Deletion" size="md">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="p-3 bg-red-500/20 rounded-full">
                     <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Permanent Deletion</h3>
                     <p className="text-red-200 text-sm">This will permanently remove the employee record. This action CANNOT be undone.</p>
                  </div>
               </div>

               <p className="text-gray-300 mb-6">
                  To confirm deletion for <span className="text-white font-bold">{employeeToDelete?.name}</span>, please type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">DELETE</span> below:
               </p>

               <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                  placeholder="Type DELETE to confirm"
                  aria-label="Confirm Deletion Input"
                  title="Confirm Deletion Input"
               />

               <div className="flex justify-end gap-3">
                  <button
                     onClick={() => setIsDeleteModalOpen(false)}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirmDelete}
                     disabled={deleteInput !== 'DELETE'}
                     className={`px-6 py-2 rounded-lg font-bold transition-all ${deleteInput === 'DELETE'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                  >
                     Delete Permanently
                  </button>
               </div>
            </div>
         </Modal>

         {/* Send Message Modal */}
         <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} title="Send Secure Message" size="md">
            <div className="p-6">
               <p className="text-gray-300 mb-4">
                  Sending message to <span className="text-white font-bold">{messageRecipient?.name}</span>:
               </p>
               <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-cyber-primary transition-colors min-h-[100px]"
                  placeholder="Type your message here..."
                  aria-label="Message Content"
                  title="Message Content"
               />
               <div className="flex justify-end gap-3">
                  <button onClick={() => setIsMessageModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={handleConfirmSendMessage} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg">Send Message</button>
               </div>
            </div>
         </Modal>

         {/* Approve Employee Modal */}
         <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Employment" size="sm">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-green-500/20 rounded-full">
                     <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Approve Access?</h3>
                     <p className="text-gray-400 text-sm">Grant system access to {employeeToApprove?.name}?</p>
                  </div>
               </div>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={handleConfirmApprove} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg">Approve</button>
               </div>
            </div>
         </Modal>

         {/* Edit Salary Modal */}
         <Modal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)} title="Update Salary" size="sm">
            <div className="p-6">
               <label className="block text-sm text-gray-400 mb-2">Base Monthly Salary (ETB)</label>
               <input
                  type="number"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-cyber-primary transition-colors"
                  placeholder="0.00"
                  aria-label="Base Monthly Salary"
                  title="Base Monthly Salary"
               />
               <div className="flex justify-end gap-3">
                  <button onClick={() => setIsSalaryModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={handleConfirmSalary} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg">Update Salary</button>
               </div>
            </div>
         </Modal>

         {/* Reset Password Modal */}
         <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Reset Password" size="sm">
            <div className="p-6">
               <p className="text-gray-300 mb-4">
                  Set new password for <span className="text-white font-bold">{passwordEmployee?.name}</span>:
               </p>
               <input
                  type="text"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-2 focus:outline-none focus:border-cyber-primary transition-colors font-mono"
                  placeholder="New Password"
                  aria-label="New Password"
                  title="New Password"
                  autoFocus
               />
               <p className="text-xs text-gray-500 mb-6">Minimum 6 characters</p>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button
                     onClick={handleConfirmResetPassword}
                     disabled={isResetting}
                     className={`px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg flex items-center gap-2 ${isResetting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                     {isResetting ? (
                        <>
                           <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                           Resetting...
                        </>
                     ) : (
                        'Reset Password'
                     )}
                  </button>
               </div>
            </div>
         </Modal>

         {/* Document Delete Confirmation Modal */}
         <Modal isOpen={isDeleteDocumentModalOpen} onClose={() => setIsDeleteDocumentModalOpen(false)} title="Delete Document" size="sm">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-500/20 rounded-full">
                     <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Delete Document?</h3>
                     <p className="text-gray-400 text-sm">Are you sure you want to delete "{documentToDelete?.docName}"?</p>
                  </div>
               </div>
               <div className="flex justify-end gap-3">
                  <button onClick={() => setIsDeleteDocumentModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={handleConfirmDocumentDelete} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg">Delete</button>
               </div>
            </div>
         </Modal>

         {/* Validation Warning Modal */}
         <Modal isOpen={isValidationModalOpen} onClose={() => setIsValidationModalOpen(false)} title="Validation Warning" size="md">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                     <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Potential Issue</h3>
                     <p className="text-yellow-200 text-sm whitespace-pre-line">{validationMessage}</p>
                  </div>
               </div>

               <p className="text-gray-300 mb-6">
                  Do you want to proceed anyway?
               </p>

               <div className="flex justify-end gap-3">
                  <button onClick={() => setIsValidationModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button onClick={handleConfirmValidation} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg">Proceed Anyway</button>
               </div>
            </div>
         </Modal>
      </div >
   );
}

// Time Off Request Form Component
function TimeOffRequestForm({ employee, onSubmit }: { employee: Employee | null | undefined; onSubmit: (request: any) => void }) {
   const [type, setType] = useState<'Annual Leave' | 'Sick Leave' | 'Personal Leave' | 'Emergency'>('Annual Leave');
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');
   const [reason, setReason] = useState('');
   const [days, setDays] = useState(0);
   const { addNotification } = useData();

   React.useEffect(() => {
      if (startDate && endDate) {
         const start = new Date(startDate);
         const end = new Date(endDate);
         const diffTime = Math.abs(end.getTime() - start.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
         setDays(diffDays);
      } else {
         setDays(0);
      }
   }, [startDate, endDate]);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!startDate || !endDate) {
         addNotification('alert', 'Please select both start and end dates.');
         return;
      }
      if (days <= 0) {
         addNotification('alert', 'End date must be after start date.');
         return;
      }
      if (!reason.trim()) {
         addNotification('alert', 'Please provide a reason for your time off request.');
         return;
      }
      onSubmit({ type, startDate, endDate, days, reason });
   };

   if (!employee) {
      return <div className="text-center text-gray-400 py-8">Please select an employee first.</div>;
   }

   return (
      <form onSubmit={handleSubmit} className="space-y-6">
         <div>
            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Employee</label>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
               <p className="text-white font-bold">{employee.name}</p>
               <p className="text-xs text-gray-400">{employee.department}</p>
            </div>
         </div>

         <div>
            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Leave Type <span className="text-red-500">*</span></label>
            <select
               value={type}
               onChange={(e) => setType(e.target.value as any)}
               className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
               aria-label="Leave Type"
               title="Leave Type"
            >
               <option value="Annual Leave">Annual Leave</option>
               <option value="Sick Leave">Sick Leave</option>
               <option value="Personal Leave">Personal Leave</option>
               <option value="Emergency">Emergency</option>
            </select>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Start Date <span className="text-red-500">*</span></label>
               <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                  required
               />
            </div>
            <div>
               <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">End Date <span className="text-red-500">*</span></label>
               <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                  required
               />
            </div>
         </div>

         {days > 0 && (
            <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg">
               <p className="text-sm text-cyber-primary font-bold">Total Days: {days}</p>
            </div>
         )}

         <div>
            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Reason <span className="text-red-500">*</span></label>
            <textarea
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               placeholder="Please provide a reason for your time off request..."
               rows={4}
               className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none resize-none"
               required
            />
         </div>

         <div className="flex gap-3 pt-4">
            <button
               type="button"
               onClick={() => {
                  setType('Annual Leave');
                  setStartDate('');
                  setEndDate('');
                  setReason('');
               }}
               className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors"
            >
               Clear
            </button>
            <button
               type="submit"
               className="flex-1 px-6 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl transition-colors"
            >
               Submit Request
            </button>
         </div>
      </form>
   );
}

