import React, { useState, useRef, useEffect } from 'react';
import {
    Briefcase, Mail, Phone, Shield, Star, Calendar, Award, CheckCircle, Clock,
    AlertTriangle, DollarSign, ClipboardList, TrendingUp, User, Plus, Trash2,
    ArrowRight, MapPin, Upload, CreditCard, MessageSquare, Download, XCircle,
    Key, Camera, Trophy, Zap, Target, Gift, Crown, Building, LayoutDashboard, FileText, Settings,
    Store, UserCheck, Package
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, Tooltip
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber } from '../utils/formatting';
import { authService } from '../services/auth.service';
import {
    Employee,
    EmployeeTask,
    UserRole,
    DEFAULT_POS_BONUS_TIERS,
    DEFAULT_POS_ROLE_DISTRIBUTION,
    DEFAULT_BONUS_TIERS
} from '../types';
import { calculateBonus } from './WorkerPointsDisplay';
import { calculateStoreBonus } from './StoreBonusDisplay';
import { hasPermission } from '../utils/permissions';
import Modal from './Modal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import EmployeeIDCard from './EmployeeIDCard';

// --- CONSTANTS ---
const ATTENDANCE_DATA = [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 8.0 },
    { day: 'Wed', hours: 7.5 },
    { day: 'Thu', hours: 9.0 },
    { day: 'Fri', hours: 8.0 },
];

export const SYSTEM_ROLES: {
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
        },
        {
            id: 'packer', label: 'Warehouse Packer', desc: 'Packing & Quality Control',
            styles: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', badge: 'bg-orange-500/20 text-orange-500' }
        }
    ];

export const getRoleHierarchy = (role: UserRole): number => {
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
        'pos': 10,
        'packer': 20
    };
    return hierarchy[role] || 0;
};

type ProfileTab = 'overview' | 'tasks' | 'timeoff' | 'payroll' | 'docs' | 'gamification' | 'settings';

interface StaffProfileViewProps {
    employee: Employee;
    isOwnProfile?: boolean;
    onClose?: () => void;
}

export default function StaffProfileView({ employee, isOwnProfile = false, onClose }: StaffProfileViewProps) {
    const { user, updateUserAvatar } = useStore();
    const {
        tasks: allTasks,
        setTasks,
        sites,
        getWorkerPoints,
        getStorePoints,
        settings,
        addNotification,
        updateEmployee
    } = useData();

    const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

    // Modal states
    const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [salaryInput, setSalaryInput] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [currentPasswordInput, setCurrentPasswordInput] = useState('');
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ docIndex: number, docName: string } | null>(null);
    const [idCardOpen, setIdCardOpen] = useState(false);

    // Refs
    const profilePhotoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Filtered tasks for this employee
    const employeeTasks = allTasks.filter(t => t.assignedTo === employee.id);

    // Permissions
    const canManageEmployees = hasPermission(user?.role, 'EDIT_EMPLOYEE');
    const canViewPayroll = hasPermission(user?.role, 'VIEW_PAYROLL') || isOwnProfile;
    const userRoleLevel = user ? getRoleHierarchy(user.role) : 0;
    const targetRoleLevel = getRoleHierarchy(employee.role);
    const isSuperAdmin = user?.role === 'super_admin';
    const canResetPassword = isSuperAdmin || (userRoleLevel > targetRoleLevel);

    // --- ACTIONS ---

    const handleAddTask = () => {
        if (!newTaskTitle) return;
        const newTask: EmployeeTask = {
            id: `T-${Date.now()}`,
            title: newTaskTitle,
            description: 'Manual Assignment',
            assignedTo: employee.id,
            status: 'Pending',
            priority: newTaskPriority,
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
        };
        setTasks([...allTasks, newTask]);
        setNewTaskTitle('');
        addNotification('success', `Task assigned to ${employee.name}`);
    };

    const handleCompleteTask = (taskId: string) => {
        setTasks(allTasks.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
    };

    const handleRequestPhotoChange = () => {
        profilePhotoInputRef.current?.click();
    };

    const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, we would upload to storage. 
        // For now, we'll use a local URL or mock upload
        const reader = new FileReader();
        reader.onloadend = async () => {
            const result = reader.result as string;
            // Update employee record
            const updatedEmp = { ...employee, avatar: result };
            await updateEmployee(updatedEmp, user?.name || 'Admin');

            // If it's the current user, update global state
            if (isOwnProfile || user?.id === employee.id) {
                updateUserAvatar(result);
            }

            addNotification('success', 'Profile photo updated successfully!');
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = () => {
        setIsMessageModalOpen(true);
    };

    const handleConfirmSendMessage = () => {
        if (!messageInput.trim()) return;
        addNotification('success', `Message sent to ${employee.name}`);
        setMessageInput('');
        setIsMessageModalOpen(false);
    };

    const handleResetPassword = () => {
        setIsPasswordModalOpen(true);
    };

    const handleConfirmResetPassword = async () => {
        if (passwordInput.length < 6) {
            addNotification('alert', 'Password must be at least 6 characters');
            return;
        }
        setIsResetting(true);
        // Mock API call
        setTimeout(() => {
            setIsResetting(false);
            setPasswordInput('');
            setIsPasswordModalOpen(false);
            addNotification('success', `Password reset for ${employee.name}`);
        }, 1000);
    };

    const handleUpdatePassword = async () => {
        if (!newPasswordInput || newPasswordInput !== confirmPasswordInput) {
            addNotification('alert', 'Passwords do not match');
            return;
        }
        if (newPasswordInput.length < 6) {
            addNotification('alert', 'Password must be at least 6 characters');
            return;
        }

        setIsChangingPassword(true);
        try {
            if (isOwnProfile) {
                // Update own password
                await authService.updatePassword(newPasswordInput);
                addNotification('success', 'Your password has been updated successfully!');
            } else {
                // Trigger password reset email for another user
                await authService.resetPassword(employee.email);
                addNotification('success', `Password reset email sent to ${employee.email}`);
            }

            setNewPasswordInput('');
            setConfirmPasswordInput('');
            setCurrentPasswordInput('');
        } catch (error: any) {
            addNotification('alert', error.message || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleEditSalary = () => {
        setSalaryInput(employee.salary?.toString() || '');
        setIsSalaryModalOpen(true);
    };

    const handleConfirmSalary = async () => {
        const val = parseFloat(salaryInput);
        if (isNaN(val)) return;
        await updateEmployee({ ...employee, salary: val }, user?.name || 'Admin');
        setIsSalaryModalOpen(false);
        addNotification('success', `Salary updated for ${employee.name}`);
    };

    const handleDownloadPayslip = (id: number) => {
        addNotification('info', `Downloading payslip #${id}...`);
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        addNotification('success', `Document "${file.name}" uploaded successfully!`);
    };

    const handleDocumentDownload = (doc: any) => {
        addNotification('info', `Downloading ${doc.name}...`);
    };

    const handleDocumentDelete = (index: number, name: string) => {
        setDocumentToDelete({ docIndex: index, docName: name });
        setIsDeleteDocumentModalOpen(true);
    };

    const handleConfirmDocumentDelete = () => {
        setIsDeleteDocumentModalOpen(false);
        setDocumentToDelete(null);
        addNotification('success', 'Document deleted.');
    };

    // --- RENDER HELPERS ---

    const renderGamification = () => {
        const empPoints = getWorkerPoints(employee.id);
        const empSite = sites.find(s => s.id === employee.siteId || s.id === employee.site_id);
        const isWarehouse = empSite?.type === 'Warehouse' || empSite?.type === 'Distribution Center';

        let empBonus = 0;
        let empTierName = '';
        let tierColor = 'gray';
        let storePointsData = null;

        if (isWarehouse && empPoints) {
            const bonusTiers = settings.bonusTiers || DEFAULT_BONUS_TIERS;
            const bonusInfo = calculateBonus(empPoints.monthlyPoints, bonusTiers);
            empBonus = bonusInfo.bonus;
            empTierName = bonusInfo.tier.tierName;
            tierColor = bonusInfo.tier.tierColor;
        } else if (!isWarehouse && empSite) {
            storePointsData = getStorePoints(empSite.id);
            if (storePointsData) {
                const bonusTiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
                const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;
                const storeBonus = calculateStoreBonus(storePointsData.monthlyPoints, bonusTiers);
                const roleConfig = roleDistribution.find(r =>
                    r.role.toLowerCase() === employee.role.toLowerCase()
                );
                if (roleConfig) {
                    empBonus = (storeBonus.bonus * roleConfig.percentage) / 100;
                    empTierName = storeBonus.tier.tierName;
                    tierColor = storeBonus.tier.tierColor;
                }
            }
        }

        const getTierColorClass = (color: string) => {
            const colors: Record<string, string> = {
                gray: 'from-gray-400 to-gray-500',
                amber: 'from-amber-500 to-amber-600',
                yellow: 'from-yellow-400 to-yellow-500',
                cyan: 'from-cyan-400 to-cyan-500',
                purple: 'from-purple-400 to-purple-600',
            };
            return colors[color] || 'from-gray-400 to-gray-500';
        };

        return (
            <div className="space-y-6 animate-in fade-in">
                {/* Header Stats Card */}
                <div className={`p-6 rounded-3xl border relative overflow-hidden ${isWarehouse
                    ? 'bg-gradient-to-r from-cyber-primary/20 to-green-500/10 border-cyber-primary/20'
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-blue-500/20'
                    }`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTierColorClass(tierColor)} flex items-center justify-center shadow-lg shadow-black/20`}>
                                <Trophy size={32} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white">
                                    {isWarehouse ? 'Warehouse Pro' : 'Store Elite'}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${getTierColorClass(tierColor)} text-white uppercase tracking-widest`}>
                                        {empTierName || 'Standard'}
                                    </span>
                                    <span className="text-gray-400 text-xs font-bold">
                                        {isWarehouse ? 'Individual Level' : `Team Share: ${empSite?.name}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {empBonus > 0 && (
                            <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center md:text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Estimated Bonus</p>
                                <p className="text-3xl font-black text-green-400">
                                    {formatCompactNumber(empBonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <Trophy size={150} className="text-white rotate-12" />
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isWarehouse && empPoints ? (
                        <>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-cyber-primary/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-cyber-primary/10 flex items-center justify-center mx-auto mb-3">
                                    <Trophy className="text-cyber-primary" size={20} />
                                </div>
                                <p className="text-2xl font-black text-white">{empPoints.totalPoints.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Lifetime</p>
                            </div>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-blue-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-3">
                                    <Target className="text-blue-400" size={20} />
                                </div>
                                <p className="text-2xl font-black text-white">{empPoints.monthlyPoints.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">This Month</p>
                            </div>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-purple-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center mx-auto mb-3">
                                    <Zap className="text-purple-400" size={20} />
                                </div>
                                <p className="text-2xl font-black text-white">Lv. {empPoints.level}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{empPoints.levelTitle}</p>
                            </div>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-yellow-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                                    <Award className="text-yellow-400" size={20} />
                                </div>
                                <p className="text-2xl font-black text-white">#{empPoints.rank || '12'}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Leaderboard</p>
                            </div>
                        </>
                    ) : storePointsData ? (
                        <>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-blue-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center mx-auto mb-3">
                                    <Store className="text-blue-400" size={20} />
                                </div>
                                <p className="text-lg font-black text-white truncate">{empSite?.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Origin Site</p>
                            </div>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-yellow-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-3">
                                    <Trophy className="text-yellow-400" size={20} />
                                </div>
                                <p className="text-2xl font-black text-white">{storePointsData.monthlyPoints.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Store Total</p>
                            </div>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-purple-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center mx-auto mb-3">
                                    <UserCheck size={20} className="text-purple-400" />
                                </div>
                                <p className="text-lg font-black text-white capitalize">{employee.role}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Role Type</p>
                            </div>
                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 text-center group hover:border-cyan-400/30 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mx-auto mb-3">
                                    <Target className="text-cyan-400" size={20} />
                                </div>
                                <p className="text-2xl font-black text-white">{storePointsData.totalTransactions}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Volume</p>
                            </div>
                        </>
                    ) : (
                        <div className="col-span-4 text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                            <Trophy size={48} className="mx-auto mb-4 text-white/5" />
                            <p className="text-gray-500 font-bold">No gamification data recorded yet.</p>
                            <p className="text-xs text-gray-600 mt-2">Start processing orders to earn points and climb the ranks!</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Badges & Achievements */}
                    <div className="bg-black/30 p-6 rounded-3xl border border-white/5">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Star size={18} className="text-yellow-400" /> Badges & Achievements
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                            {(employee.badges || ['Early Bird', 'Fast Picker', 'No Errors']).map((badge, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                        <Award size={24} className="text-white" />
                                    </div>
                                    <span className="text-[8px] text-gray-400 font-black uppercase text-center tracking-tighter leading-tight">{badge}</span>
                                </div>
                            ))}
                            {/* Empty Slots */}
                            {Array.from({ length: Math.max(0, 10 - (employee.badges?.length || 3)) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center border-dashed">
                                        <Plus size={16} className="text-white/10" />
                                    </div>
                                    <span className="text-[8px] text-gray-600 font-black uppercase text-center tracking-tighter leading-tight">Locked</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Point History Log (Simulation) */}
                    <div className="bg-black/30 p-6 rounded-3xl border border-white/5">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-cyber-primary" /> Recent Activity
                        </h4>
                        <div className="space-y-3">
                            {[
                                { action: 'PICK completed', points: '+15', time: '2 hours ago', icon: Package, color: 'text-blue-400' },
                                { action: '100% Accuracy Bonus', points: '+50', time: 'Yesterday', icon: CheckCircle, color: 'text-green-400' },
                                { action: 'Shift Finished', points: '+10', time: '2 days ago', icon: Clock, color: 'text-purple-400' },
                                { action: 'Team Multiplier', points: 'x2', time: 'Active', icon: Zap, color: 'text-yellow-400' },
                            ].map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${log.color}`}>
                                            <log.icon size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{log.action}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{log.time}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-black ${log.points.startsWith('+') ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {log.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );

    };

    const renderSettings = () => {
        return (
            <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Security Section */}
                    <div className="bg-black/30 p-8 rounded-2xl border border-white/5">
                        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400">
                                <Key size={18} />
                            </div>
                            Security & Access
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPasswordInput}
                                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPasswordInput}
                                    onChange={(e) => setNewPasswordInput(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPasswordInput}
                                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                    placeholder="Confirm your new password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleUpdatePassword}
                                disabled={isChangingPassword || !newPasswordInput || newPasswordInput !== confirmPasswordInput}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-30"
                            >
                                {isChangingPassword ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>Update Password</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Account Info Section */}
                    <div className="bg-black/30 p-8 rounded-2xl border border-white/5">
                        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-cyber-primary/20 rounded-lg text-cyber-primary">
                                <User size={18} />
                            </div>
                            Account Information
                        </h4>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Employee ID</p>
                                    <p className="text-white font-mono text-sm">{employee.code || 'EMP-' + employee.id.substring(0, 5).toUpperCase()}</p>
                                </div>
                                <div className="px-3 py-1 bg-white/10 rounded text-xs text-gray-400 font-bold uppercase tracking-tighter">Personnel Code</div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Access Role</p>
                                    <p className="text-white font-bold">{employee.role}</p>
                                </div>
                                <Shield size={16} className="text-cyber-primary" />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Primary Site</p>
                                    <p className="text-white font-bold">{sites.find(s => s.id === employee.siteId || s.id === employee.site_id)?.name || 'HQ'}</p>
                                </div>
                                <MapPin size={16} className="text-cyber-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-500">
            {/* Header Profile */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyber-primary/10 transition-all"></div>

                <div className="relative">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-cyber-primary/30 shadow-2xl relative">
                        <img src={employee.avatar} className="w-full h-full object-cover" alt={employee.name} />
                        {(isOwnProfile || canManageEmployees) && (
                            <button
                                onClick={handleRequestPhotoChange}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                title="Change Photo"
                            >
                                <Camera size={28} className="text-white" />
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={profilePhotoInputRef}
                        onChange={handleProfilePhotoSelect}
                        className="hidden"
                        accept="image/*"
                        title="Upload Profile Photo"
                    />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-1">{employee.name}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
                                <span className="px-3 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {employee.role.replace('_', ' ')}
                                </span>
                                <span className="text-gray-400 text-sm font-medium flex items-center gap-1.5">
                                    <Building size={14} /> {employee.department}
                                </span>
                                <span className="text-cyan-400 font-mono text-xs font-bold bg-cyan-400/10 px-2 py-0.5 rounded">
                                    ID: {employee.code || 'EMP-' + employee.id.substring(0, 5).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-center gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-widest uppercase ${employee.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                employee.status === 'Pending Approval' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {employee.status}
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    {!isOwnProfile && (
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-6">
                            <button onClick={() => setIdCardOpen(true)} className="flex items-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all">
                                <CreditCard size={14} /> Generate ID
                            </button>
                            <button onClick={handleSendMessage} className="flex items-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all">
                                <MessageSquare size={14} /> Send Message
                            </button>
                            {canResetPassword && (
                                <button onClick={handleResetPassword} className="flex items-center gap-2 text-xs font-bold bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-500 px-4 py-2 rounded-xl border border-yellow-400/20 transition-all">
                                    <Key size={14} /> Reset Password
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'gamification', label: 'Gamification', icon: Trophy },
                    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
                    { id: 'timeoff', label: 'Leave', icon: Calendar },
                    { id: 'docs', label: 'Documents', icon: FileText },
                    { id: 'payroll', label: 'Payroll', icon: DollarSign },
                    { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveProfileTab(tab.id as ProfileTab)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeProfileTab === tab.id
                            ? 'text-cyber-primary border-cyber-primary bg-cyber-primary/5'
                            : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                            } ${tab.id === 'payroll' && !canViewPayroll ? 'hidden' : ''}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeProfileTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 text-center group hover:border-cyber-primary/30 transition-all">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Performance Score</p>
                                <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform">{employee.performanceScore}</p>
                            </div>
                            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 text-center group hover:border-green-500/30 transition-all">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Attendance Rate</p>
                                <p className="text-4xl font-black text-green-400 group-hover:scale-110 transition-transform">{employee.attendanceRate}%</p>
                            </div>
                            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 text-center group hover:border-blue-500/30 transition-all">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Tasks Done</p>
                                <p className="text-4xl font-black text-blue-400 group-hover:scale-110 transition-transform">
                                    {employeeTasks.filter(t => t.status === 'Completed').length}
                                </p>
                            </div>
                        </div>

                        {/* Info Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-black/30 p-8 rounded-2xl border border-white/5">
                                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-cyber-primary/20 rounded-lg text-cyber-primary">
                                        <User size={18} />
                                    </div>
                                    Personal Information
                                </h4>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">Email Address</p>
                                            <p className="text-white font-medium">{employee.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">Phone Number</p>
                                            <p className="text-white font-medium">{employee.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">Residence</p>
                                            <p className="text-white font-medium">{employee.address || 'No address provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/30 p-8 rounded-2xl border border-white/5">
                                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Briefcase size={18} />
                                    </div>
                                    Employment Details
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Joined Date', value: employee.joinDate, icon: Calendar },
                                        { label: 'Specialization', value: employee.specialization || 'Generalist', icon: Star },
                                        { label: 'Workplace', value: sites.find(s => s.id === employee.siteId)?.name || 'Headquarters', icon: Building, color: 'text-cyber-primary' }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                            <span className="text-gray-400 text-sm flex items-center gap-2">
                                                <row.icon size={14} /> {row.label}
                                            </span>
                                            <span className={`text-sm font-bold ${row.color || 'text-white'}`}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                                {employee.emergencyContact && (
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <p className="text-xs text-gray-500 uppercase font-black mb-2">Emergency Contact</p>
                                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                            <p className="text-sm text-red-200 font-medium">{employee.emergencyContact}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Activity */}
                        <div className="bg-black/30 p-8 rounded-2xl border border-white/5">
                            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                <TrendingUp size={18} className="text-green-400" />
                                Weekly Activity Log (Simulation)
                            </h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ATTENDANCE_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="day" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#00ff9d' }}
                                        />
                                        <Bar dataKey="hours" fill="#00ff9d" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeProfileTab === 'gamification' && renderGamification()}

                {activeProfileTab === 'tasks' && (
                    <div className="space-y-6 animate-in fade-in">
                        {(canManageEmployees || isOwnProfile) && (
                            <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex-1 relative">
                                    <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Assign or note a new task..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyber-primary transition-all"
                                    />
                                </div>
                                <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary"
                                    title="Select Task Priority"
                                >
                                    <option value="Low">Low Priority</option>
                                    <option value="Medium">Medium Priority</option>
                                    <option value="High">High Priority</option>
                                </select>
                                <button
                                    onClick={handleAddTask}
                                    className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-black hover:bg-cyber-accent transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} /> Add Task
                                </button>
                            </div>
                        )}

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {employeeTasks.length > 0 ? (
                                employeeTasks.map(task => (
                                    <div key={task.id} className="group flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full shadow-lg ${task.priority === 'High' ? 'bg-red-500' :
                                                task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`}></div>
                                            <div>
                                                <p className={`text-base font-bold transition-all ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                                                        Due: {task.dueDate}
                                                    </span>
                                                    {task.status === 'Completed' && (
                                                        <span className="text-[10px] text-green-500 font-black uppercase flex items-center gap-1">
                                                            <CheckCircle size={10} /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {task.status !== 'Completed' && (
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="p-3 bg-white/5 hover:bg-green-500/20 text-gray-500 hover:text-green-500 rounded-xl transition-all border border-transparent hover:border-green-500/20"
                                                title="Complete Task"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <ClipboardList size={48} className="mx-auto mb-4 text-white/10" />
                                    <p className="text-gray-500 font-bold">No tasks assigned yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeProfileTab === 'timeoff' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-white font-black uppercase tracking-widest">Annual Leave</span>
                                    <span className="text-xs text-gray-400 font-mono">12 / 20 Days Remaining</span>
                                </div>
                                <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-cyber-primary to-green-500 w-[60%] shadow-[0_0_10px_rgba(0,255,157,0.3)]"></div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-white font-black uppercase tracking-widest">Sick Leave</span>
                                    <span className="text-xs text-gray-400 font-mono">2 / 10 Days Remaining</span>
                                </div>
                                <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 w-[20%] shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Star size={16} className="text-yellow-400" /> Recent Leave Requests
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-bold">Annual Vacation</p>
                                            <p className="text-xs text-gray-500 font-mono">Aug 12 - Aug 15 (4 Days)</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full">Approved</span>
                                </div>
                                <p className="text-center text-xs text-gray-600 py-4">Higher management view would show more history</p>
                            </div>
                        </div>

                        {isOwnProfile && (
                            <button
                                onClick={() => setIsTimeOffModalOpen(true)}
                                className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                            >
                                Request Time Off
                            </button>
                        )}
                    </div>
                )}

                {activeProfileTab === 'docs' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div
                            onClick={() => documentInputRef.current?.click()}
                            className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center hover:border-cyber-primary/50 transition-all cursor-pointer bg-white/5 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Upload className="mx-auto text-gray-400 group-hover:text-cyber-primary group-hover:scale-110 transition-all mb-4" size={40} />
                            <p className="text-lg text-white font-black uppercase tracking-widest">Upload New Document</p>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Drag & drop files here or click to browse</p>
                        </div>
                        <input
                            type="file"
                            ref={documentInputRef}
                            onChange={handleDocumentUpload}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            title="Upload Document"
                        />

                        <div className="space-y-3">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Official Documents</h4>
                            <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                <FileText size={48} className="mx-auto mb-4 text-white/10" />
                                <p className="text-gray-500 font-bold">No documents uploaded yet.</p>
                                <p className="text-xs text-gray-600 mt-1">Contracts, IDs, and certifications will appear here.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeProfileTab === 'payroll' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Summary Card */}
                        <div className="bg-gradient-to-r from-black/40 to-cyber-gray/40 p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-400 uppercase font-black tracking-[0.2em] mb-3">Base Monthly Salary</p>
                                    <p className="text-5xl font-black text-white font-mono tracking-tighter">
                                        {CURRENCY_SYMBOL} {employee.salary?.toLocaleString() || '0'}
                                    </p>
                                </div>
                                {canManageEmployees && (
                                    <button
                                        onClick={handleEditSalary}
                                        className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl"
                                    >
                                        Adjust Compensation
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Recent Payslips */}
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Download size={16} className="text-cyber-primary" /> Recent Payslips
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        onClick={() => handleDownloadPayslip(202400 + i)}
                                        className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-cyber-primary/30 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500/20 transition-all">
                                                <DollarSign size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white font-bold group-hover:text-cyber-primary transition-colors">Payslip #{202400 + i}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Released: Mar {30 - i * 7}, 2024</p>
                                            </div>
                                        </div>
                                        <Download size={18} className="text-gray-600 group-hover:text-white transition-all transform group-hover:translate-y-0.5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeProfileTab === 'settings' && renderSettings()}
            </div>

            {/* ACTION MODALS */}

            {/* Time Off Modal */}
            <Modal isOpen={isTimeOffModalOpen} onClose={() => setIsTimeOffModalOpen(false)} title="Request Time Off" size="md">
                <TimeOffRequestForm
                    employee={employee}
                    onSubmit={(data) => {
                        addNotification('success', `Time off request for ${data.days} days submitted.`);
                        setIsTimeOffModalOpen(false);
                    }}
                />
            </Modal>

            {/* Message Modal */}
            <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} title="Send Secure Message" size="md">
                <div className="p-6">
                    <p className="text-gray-300 mb-4">
                        Sending secure message to <span className="text-white font-bold">{employee.name}</span>:
                    </p>
                    <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white mb-6 focus:border-cyber-primary transition-all min-h-[150px] outline-none"
                        placeholder="Type your communication here..."
                    />
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setIsMessageModalOpen(false)} className="px-6 py-3 text-gray-400 font-bold hover:text-white transition-colors uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={handleConfirmSendMessage} className="px-8 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-black rounded-xl uppercase text-xs tracking-[0.2em] shadow-lg">Send Message</button>
                    </div>
                </div>
            </Modal>

            {/* Reset Password Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Reset Security Credentials" size="sm">
                <div className="p-6">
                    <p className="text-gray-300 mb-4 text-sm">
                        Set a new secure password for <span className="text-white font-bold">{employee.name}</span>. The user will be notified.
                    </p>
                    <div className="relative mb-6">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-cyber-primary outline-none font-mono"
                            placeholder="New Password"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-gray-400 font-bold text-xs uppercase">Cancel</button>
                        <button
                            onClick={handleConfirmResetPassword}
                            disabled={isResetting}
                            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-lg text-xs uppercase tracking-widest transition-all"
                        >
                            {isResetting ? 'Processing...' : 'Reset Password'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Salary Modal */}
            <Modal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)} title="Adjust Compensation" size="sm">
                <div className="p-6">
                    <label className="block text-xs text-gray-500 font-black uppercase tracking-widest mb-3">Base Monthly Salary ({CURRENCY_SYMBOL})</label>
                    <div className="relative mb-8">
                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-primary" />
                        <input
                            type="number"
                            value={salaryInput}
                            onChange={(e) => setSalaryInput(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white text-xl font-mono focus:border-cyber-primary outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsSalaryModalOpen(false)} className="px-4 py-2 text-gray-400 font-bold text-xs uppercase">Cancel</button>
                        <button onClick={handleConfirmSalary} className="px-8 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-black rounded-lg text-xs uppercase tracking-widest">Update Scale</button>
                    </div>
                </div>
            </Modal>

            {/* Delete Document Confirmation */}
            <Modal isOpen={isDeleteDocumentModalOpen} onClose={() => setIsDeleteDocumentModalOpen(false)} title="Security Confirmation" size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <Trash2 className="text-red-500" size={32} />
                        <div>
                            <h4 className="text-white font-bold">Delete Document?</h4>
                            <p className="text-xs text-red-200">Permanently remove "{documentToDelete?.docName}"?</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsDeleteDocumentModalOpen(false)} className="px-4 py-2 text-gray-400 font-bold text-xs uppercase">Keep</button>
                        <button onClick={handleConfirmDocumentDelete} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-black rounded-lg text-xs uppercase">Delete Securely</button>
                    </div>
                </div>
            </Modal>

            {/* ID Card Modal */}
            {idCardOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="max-w-lg w-full">
                        <EmployeeIDCard
                            employee={employee}
                            siteCode={sites.find(s => s.id === employee.siteId)?.code || sites.find(s => s.id === employee.siteId)?.name || 'HQ'}
                            onClose={() => setIdCardOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for Time Off Request
function TimeOffRequestForm({ employee, onSubmit }: { employee: Employee; onSubmit: (data: any) => void }) {
    const [type, setType] = useState('Annual Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [days, setDays] = useState(0);

    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            setDays(diff > 0 ? diff : 0);
        }
    }, [startDate, endDate]);

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Leave Category</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary"
                        title="Leave Category"
                    >
                        <option value="Annual Leave">Annual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Personal Leave">Personal Leave</option>
                        <option value="Emergency">Emergency</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary font-mono"
                        title="Start Date"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary font-mono"
                        title="End Date"
                    />
                </div>
            </div>

            <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Reason / Justification</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Specify reason for absence..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyber-primary min-h-[100px]"
                />
            </div>

            <div className="flex items-center justify-between p-4 bg-cyber-primary/5 rounded-xl border border-cyber-primary/20">
                <span className="text-gray-400 text-xs font-bold font-mono">Total Duration:</span>
                <span className="text-cyber-primary font-black">{days} Days</span>
            </div>

            <button
                onClick={() => onSubmit({ type, startDate, endDate, reason, days })}
                disabled={!startDate || !endDate || days <= 0}
                className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-widest rounded-xl disabled:opacity-30 transition-all"
            >
                Confirm Request
            </button>
        </div>
    );
}
