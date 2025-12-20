import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { hasPermission } from '../services/permissions.service';
import {
    Zap, ShoppingCart, Package, Truck, ClipboardList, Users,
    FileText, Home, X, ChevronRight, User, Briefcase, DollarSign,
    Shield, Headphones, Settings, Tags, Search, Command, ArrowRight
} from 'lucide-react';

/**
 * Employee Quick Access Component (Command Palette)
 * Professional shortcuts directory and quick navigation tool
 */
export default function EmployeeQuickAccess() {
    const { user } = useStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Show for all authenticated users
    if (!user) {
        return null;
    }

    // Define quick actions based on role
    const getQuickActions = () => {
        const role = user.role;

        // Common actions for everyone
        const commonActions = [
            {
                label: 'Dashboard',
                description: 'Overview',
                icon: Home,
                path: '/',
                color: 'text-cyber-primary',
                bg: 'bg-cyber-primary/10',
                shortcut: 'D',
                category: 'General'
            }
        ];

        // Add Employees link if user has permission
        if (hasPermission(role, 'employees.view')) {
            commonActions.push({
                label: 'Staff Directory',
                description: 'Team & Roles',
                icon: Users,
                path: '/employees',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
                shortcut: 'E',
                category: 'HR'
            });
        }

        // Role-specific actions
        let roleActions: any[] = [];

        switch (role) {
            case 'super_admin':
            case 'admin':
                roleActions = [
                    { label: 'Central Command', description: 'Executive View', icon: Shield, path: '/admin', color: 'text-red-400', bg: 'bg-red-400/10', shortcut: 'H', category: 'Admin' },
                    { label: 'Financials', description: 'P&L, Expenses', icon: DollarSign, path: '/finance', color: 'text-green-400', bg: 'bg-green-400/10', shortcut: 'F', category: 'Finance' },
                    { label: 'Global Settings', description: 'System Config', icon: Settings, path: '/settings', color: 'text-gray-400', bg: 'bg-gray-400/10', shortcut: 'S', category: 'System' }
                ];
                break;

            case 'warehouse_manager':
            case 'dispatcher':
                roleActions = [
                    { label: 'Fulfillment Ops', description: 'Pick, Pack, Ship', icon: ClipboardList, path: '/wms-ops', color: 'text-orange-400', bg: 'bg-orange-400/10', shortcut: 'F', category: 'Operations' },
                    { label: 'Inventory', description: 'Stock Control', icon: Package, path: '/inventory', color: 'text-purple-400', bg: 'bg-purple-400/10', shortcut: 'I', category: 'Inventory' },
                    { label: 'Procurement', description: 'Inbound Orders', icon: Truck, path: '/procurement', color: 'text-green-400', bg: 'bg-green-400/10', shortcut: 'P', category: 'Procurement' }
                ];
                break;

            case 'picker':
            case 'driver':
                roleActions = [
                    { label: 'My Tasks', description: 'Active Jobs', icon: ClipboardList, path: '/wms-ops', color: 'text-orange-400', bg: 'bg-orange-400/10', shortcut: 'T', category: 'Work' },
                    { label: 'Stock Lookup', description: 'Check Availability', icon: Package, path: '/network-inventory', color: 'text-purple-400', bg: 'bg-purple-400/10', shortcut: 'L', category: 'Inventory' }
                ];
                break;

            case 'manager':
            case 'store_supervisor':
                roleActions = [
                    { label: 'POS Terminal', description: 'Checkout', icon: ShoppingCart, path: '/pos', color: 'text-green-400', bg: 'bg-green-400/10', shortcut: 'P', category: 'Sales' },
                    { label: 'Sales History', description: 'Transactions', icon: FileText, path: '/sales', color: 'text-blue-400', bg: 'bg-blue-400/10', shortcut: 'S', category: 'Sales' },
                    { label: 'Store Inventory', description: 'Local Stock', icon: Package, path: '/inventory', color: 'text-purple-400', bg: 'bg-purple-400/10', shortcut: 'I', category: 'Inventory' }
                ];
                break;

            case 'pos':
                roleActions = [
                    { label: 'Open Register', description: 'Checkout', icon: ShoppingCart, path: '/pos', color: 'text-green-400', bg: 'bg-green-400/10', shortcut: 'P', category: 'Sales' },
                    { label: 'Customers', description: 'CRM', icon: Users, path: '/customers', color: 'text-cyan-400', bg: 'bg-cyan-400/10', shortcut: 'C', category: 'Sales' }
                ];
                break;

            case 'hr':
                roleActions = [
                    { label: 'Staff Management', description: 'All Employees', icon: Briefcase, path: '/employees', color: 'text-pink-400', bg: 'bg-pink-400/10', shortcut: 'S', category: 'HR' },
                    { label: 'HR Dashboard', description: 'Overview', icon: Home, path: '/admin', color: 'text-purple-400', bg: 'bg-purple-400/10', shortcut: 'H', category: 'HR' }
                ];
                break;

            case 'finance_manager':
                roleActions = [
                    { label: 'Financial Reports', description: 'Ledger', icon: DollarSign, path: '/finance', color: 'text-emerald-400', bg: 'bg-emerald-400/10', shortcut: 'F', category: 'Finance' },
                    { label: 'Procurement', description: 'Approvals', icon: Truck, path: '/procurement', color: 'text-green-400', bg: 'bg-green-400/10', shortcut: 'P', category: 'Procurement' },
                    { label: 'Pricing Strategy', description: 'Price Lists', icon: Tags, path: '/pricing', color: 'text-yellow-400', bg: 'bg-yellow-400/10', shortcut: 'R', category: 'Merchandising' }
                ];
                break;

            case 'procurement_manager':
                roleActions = [
                    { label: 'Purchase Orders', description: 'Management', icon: Truck, path: '/procurement', color: 'text-indigo-400', bg: 'bg-indigo-400/10', shortcut: 'P', category: 'Procurement' },
                    { label: 'Global Inventory', description: 'Stock Levels', icon: Package, path: '/inventory', color: 'text-purple-400', bg: 'bg-purple-400/10', shortcut: 'I', category: 'Inventory' },
                    { label: 'Supplier DB', description: 'Partners', icon: Home, path: '/admin', color: 'text-blue-400', bg: 'bg-blue-400/10', shortcut: 'H', category: 'Procurement' }
                ];
                break;

            case 'cs_manager':
                roleActions = [
                    { label: 'Customer DB', description: 'Profiles', icon: Headphones, path: '/customers', color: 'text-sky-400', bg: 'bg-sky-400/10', shortcut: 'C', category: 'CS' },
                    { label: 'Order History', description: 'Lookup', icon: FileText, path: '/sales', color: 'text-blue-400', bg: 'bg-blue-400/10', shortcut: 'S', category: 'CS' }
                ];
                break;

            case 'auditor':
                roleActions = [
                    { label: 'Audit Logs', description: 'Review', icon: Shield, path: '/finance', color: 'text-gray-400', bg: 'bg-gray-400/10', shortcut: 'A', category: 'Audit' },
                    { label: 'Inventory Audit', description: 'Stock Check', icon: Package, path: '/inventory', color: 'text-purple-400', bg: 'bg-purple-400/10', shortcut: 'I', category: 'Audit' }
                ];
                break;

            case 'it_support':
                roleActions = [
                    { label: 'System Config', description: 'Settings', icon: Settings, path: '/settings', color: 'text-teal-400', bg: 'bg-teal-400/10', shortcut: 'S', category: 'IT' },
                    { label: 'User Roles', description: 'Access Control', icon: Users, path: '/employees', color: 'text-blue-400', bg: 'bg-blue-400/10', shortcut: 'U', category: 'IT' }
                ];
                break;

            case 'inventory_specialist':
                roleActions = [
                    { label: 'Stock Management', description: 'Adjustments', icon: Package, path: '/inventory', color: 'text-lime-400', bg: 'bg-lime-400/10', shortcut: 'I', category: 'Inventory' },
                    { label: 'Network View', description: 'All Sites', icon: Truck, path: '/network-inventory', color: 'text-green-400', bg: 'bg-green-400/10', shortcut: 'N', category: 'Inventory' }
                ];
                break;

            default:
                roleActions = [];
        }

        return [...roleActions, ...commonActions];
    };

    const allActions = getQuickActions();

    // Filter actions based on search
    const filteredActions = allActions.filter(action =>
        action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAction = (path: string) => {
        setIsOpen(false);
        navigate(path);
        setSearchQuery('');
        setSelectedIndex(0);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Toggle panel with Ctrl+K or Ctrl+Space
            if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === 'k')) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            if (!isOpen) return;

            // Navigation within open panel
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredActions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredActions[selectedIndex]) {
                    handleAction(filteredActions[selectedIndex].path);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, filteredActions, selectedIndex]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Get role display name
    const getRoleTitle = () => {
        const roleNames: Record<string, string> = {
            warehouse_manager: 'Warehouse Manager',
            dispatcher: 'Logistics Dispatcher',
            picker: 'Warehouse Associate',
            driver: 'Delivery Agent',
            manager: 'Store Manager',
            pos: 'Retail Associate',
            store_supervisor: 'Supervisor',
            super_admin: 'Chief Executive',
            admin: 'Administrator',
            hr: 'HP Director',
            finance_manager: 'Finance Director',
            procurement_manager: 'Procurement Lead',
            inventory_specialist: 'Inventory Controller',
            cs_manager: 'CS Lead',
            auditor: 'Compliance Auditor',
            it_support: 'Systems Engineer'
        };
        return roleNames[user.role] || user.role;
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl shadow-2xl transition-all duration-300 group ${isOpen
                    ? 'bg-red-500 rotate-90 scale-90'
                    : 'bg-cyber-dark border border-cyber-primary/30 shadow-[0_0_30px_rgba(0,255,157,0.2)] hover:scale-105 hover:border-cyber-primary'
                    }`}
                title="Quick Actions (Ctrl+K)"
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Command size={24} className="text-cyber-primary group-hover:text-white transition-colors" />
                )}
            </button>

            {/* Command Palette Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="fixed inset-x-0 top-[20%] mx-auto z-50 max-w-lg w-full p-4 animate-in fade-in slide-in-from-bottom-8 duration-200">
                        <div className="bg-cyber-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">

                            {/* Header / Search */}
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyber-primary/50 transition-colors">
                                    <Search className="text-gray-400" size={18} />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Search tools, reports, or commands..."
                                        className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-full text-sm"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setSelectedIndex(0);
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">ESC</span>
                                    </div>
                                </div>
                            </div>

                            {/* User Context */}
                            <div className="px-4 py-2 bg-gradient-to-r from-cyber-primary/5 to-transparent flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-cyber-primary/20 flex items-center justify-center">
                                        <User size={12} className="text-cyber-primary" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-300">
                                        {user.name} <span className="text-gray-500">•</span> {getRoleTitle()}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    {filteredActions.length} Actions Available
                                </span>
                            </div>

                            {/* Actions List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 scroll-smooth">
                                {filteredActions.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <p>No matching tools found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredActions.map((action, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleAction(action.path)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-150 group ${index === selectedIndex
                                                    ? 'bg-white/10 shadow-lg translate-x-1'
                                                    : 'hover:bg-white/5 text-gray-400'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${action.bg} ${action.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                                        <action.icon size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-sm font-bold ${index === selectedIndex ? 'text-white' : 'text-gray-300'}`}>
                                                            {action.label}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 group-hover:text-gray-400">
                                                            {action.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {action.category && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-black/20 px-2 py-1 rounded">
                                                            {action.category}
                                                        </span>
                                                    )}
                                                    {index === selectedIndex && (
                                                        <ArrowRight size={14} className="text-cyber-primary animate-pulse" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-2 border-t border-white/5 bg-black/20 flex justify-between items-center text-[10px] text-gray-500 px-4">
                                <div className="flex gap-3">
                                    <span><kbd className="font-sans font-bold text-gray-400">↑↓</kbd> Navigate</span>
                                    <span><kbd className="font-sans font-bold text-gray-400">↵</kbd> Select</span>
                                </div>
                                <span>Command Palette v2.0</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
