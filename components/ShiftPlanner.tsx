import React, { useState, useMemo } from 'react';
import { Employee, UserRole } from '../types';
import { Sun, Moon, Sunset, XCircle, Save, ChevronLeft, ChevronRight, Shield, Briefcase, Package, User, ShoppingBag, Truck } from 'lucide-react';
import { formatDateTime, formatRole } from '../utils/formatting';

interface ShiftPlannerProps {
    employees: Employee[];
    canEdit?: boolean;
    onSave?: (schedule: Record<string, string[]>) => void;
}

interface OrgNode {
    role: UserRole;
    label: string;
    employees: Employee[];
    children: OrgNode[];
    icon: React.ElementType;
    color: string;
}

const SHIFT_TYPES = {
    'M': { label: 'Morning', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    'E': { label: 'Evening', icon: Sunset, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    'N': { label: 'Night', icon: Moon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'O': { label: 'Off', icon: XCircle, color: 'text-gray-500', bg: 'bg-white/5' }
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ShiftPlanner: React.FC<ShiftPlannerProps> = ({ employees, canEdit = false, onSave }) => {
    // Load from localStorage or use default
    const [schedule, setSchedule] = useState<Record<string, string[]>>(() => {
        const saved = localStorage.getItem('siifmart_shift_schedule');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved schedule', e);
            }
        }

        const initial: Record<string, string[]> = {};
        employees.forEach(e => {
            initial[e.id] = ['M', 'M', 'M', 'M', 'M', 'O', 'O'];
        });
        return initial;
    });

    const [currentWeek, setCurrentWeek] = useState(new Date());

    // --- HIERARCHY LOGIC (Copied & Adapted from OrgChart) ---
    const hierarchyRows = useMemo(() => {
        const getByRole = (role: UserRole) => employees.filter(e => e.role === role);
        const getByRoleAndDept = (role: UserRole, dept: string) =>
            employees.filter(e => e.role === role && e.department === dept);

        // Track which employees are already included in the hierarchy
        const includedEmployeeIds = new Set<string>();
        const markIncluded = (emps: Employee[]) => {
            emps.forEach(emp => includedEmployeeIds.add(emp.id));
        };

        // Helper to recursively mark all employees in a node tree
        const markAllIncluded = (node: OrgNode) => {
            markIncluded(node.employees);
            node.children.forEach(markAllIncluded);
        };

        // Define the comprehensive hierarchy structure
        const structure: OrgNode = {
            role: 'super_admin',
            label: 'CEO & Executive',
            employees: getByRole('super_admin'),
            icon: Shield,
            color: 'text-yellow-400',
            children: [
                {
                    role: 'admin',
                    label: 'System Admin',
                    employees: getByRole('admin'),
                    icon: Shield,
                    color: 'text-red-400',
                    children: [
                        {
                            role: 'it_support' as UserRole,
                            label: 'IT Support',
                            employees: getByRole('it_support' as UserRole),
                            icon: User,
                            color: 'text-cyan-400',
                            children: []
                        }
                    ]
                },
                {
                    role: 'finance_manager' as UserRole,
                    label: 'Finance',
                    employees: getByRole('finance_manager' as UserRole),
                    icon: Briefcase,
                    color: 'text-emerald-400',
                    children: [
                        {
                            role: 'auditor',
                            label: 'Auditors',
                            employees: getByRole('auditor'),
                            icon: User,
                            color: 'text-gray-400',
                            children: []
                        }
                    ]
                },
                {
                    role: 'hr',
                    label: 'HR',
                    employees: getByRole('hr'),
                    icon: User,
                    color: 'text-pink-400',
                    children: []
                },
                {
                    role: 'procurement_manager' as UserRole,
                    label: 'Procurement',
                    employees: getByRole('procurement_manager' as UserRole),
                    icon: Package,
                    color: 'text-indigo-400',
                    children: []
                },
                {
                    role: 'manager',
                    label: 'Retail Operations',
                    employees: getByRoleAndDept('manager', 'Retail Operations'),
                    icon: Briefcase,
                    color: 'text-blue-400',
                    children: [
                        {
                            role: 'cs_manager' as UserRole,
                            label: 'Customer Service',
                            employees: getByRole('cs_manager' as UserRole),
                            icon: User,
                            color: 'text-sky-400',
                            children: []
                        },
                        {
                            role: 'store_supervisor' as UserRole,
                            label: 'Store Supervisors',
                            employees: getByRole('store_supervisor' as UserRole),
                            icon: User,
                            color: 'text-blue-300',
                            children: [
                                {
                                    role: 'pos',
                                    label: 'Cashiers',
                                    employees: getByRole('pos'),
                                    icon: ShoppingBag,
                                    color: 'text-green-400',
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    role: 'warehouse_manager' as UserRole,
                    label: 'Warehouse Operations',
                    employees: getByRole('warehouse_manager' as UserRole),
                    icon: Package,
                    color: 'text-violet-400',
                    children: [
                        {
                            role: 'dispatcher' as UserRole,
                            label: 'Dispatch',
                            employees: getByRole('dispatcher' as UserRole),
                            icon: Package,
                            color: 'text-fuchsia-400',
                            children: [
                                {
                                    role: 'picker',
                                    label: 'Pickers',
                                    employees: getByRole('picker'),
                                    icon: Package,
                                    color: 'text-teal-400',
                                    children: []
                                },
                                {
                                    role: 'driver',
                                    label: 'Drivers',
                                    employees: getByRole('driver'),
                                    icon: Truck,
                                    color: 'text-purple-400',
                                    children: []
                                }
                            ]
                        },
                        {
                            role: 'inventory_specialist' as UserRole,
                            label: 'Inventory',
                            employees: getByRole('inventory_specialist' as UserRole),
                            icon: Package,
                            color: 'text-amber-400',
                            children: []
                        }
                    ]
                }
            ]
        };

        // Mark all employees in the hierarchy as included
        markAllIncluded(structure);

        // Find all employees NOT in the hierarchy
        const allIncludedIds = Array.from(includedEmployeeIds);
        const missingEmployees = employees.filter(emp => !allIncludedIds.includes(emp.id));

        // Add missing employees to a "Other Employees" node under CEO
        if (missingEmployees.length > 0) {
            structure.children.push({
                role: 'pos' as UserRole, // Use a generic role for the container
                label: 'Other Employees',
                employees: missingEmployees,
                icon: User,
                color: 'text-gray-400',
                children: []
            });
        }

        // Flatten the tree for table rendering
        const rows: { type: 'header' | 'employee', data: any, level: number }[] = [];

        const processNode = (node: OrgNode, level: number) => {
            // Add Header Row (if it has label and (employees or children))
            if (node.label) {
                rows.push({ type: 'header', data: node, level });
            }

            // Add Employees
            node.employees.forEach(emp => {
                rows.push({ type: 'employee', data: emp, level: level + 1 });
            });

            // Process Children
            node.children.forEach(child => processNode(child, level + 1));
        };

        processNode(structure, 0);
        return rows;
    }, [employees]);

    const handleToggleShift = (empId: string, dayIndex: number) => {
        if (!canEdit) return; // Prevent editing if not allowed

        setSchedule(prev => {
            const currentShifts = prev[empId] || ['M', 'M', 'M', 'M', 'M', 'O', 'O'];
            const current = currentShifts[dayIndex];
            const types = Object.keys(SHIFT_TYPES);
            const next = types[(types.indexOf(current) + 1) % types.length];

            const newShifts = [...currentShifts];
            newShifts[dayIndex] = next;
            return { ...prev, [empId]: newShifts };
        });
    };

    const handleSave = () => {
        localStorage.setItem('siifmart_shift_schedule', JSON.stringify(schedule));
        if (onSave) {
            onSave(schedule);
        } else {
            // Default feedback if no handler provided
            const event = new CustomEvent('show-notification', {
                detail: { type: 'success', message: 'Shift schedule saved successfully!' }
            });
            window.dispatchEvent(event);
        }
    };

    const changeWeek = (weeks: number) => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + (weeks * 7));
        setCurrentWeek(newDate);
    };

    const getWeekRange = () => {
        const start = new Date(currentWeek);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return `${formatDateTime(start)} - ${formatDateTime(end)}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-cyber-gray p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => changeWeek(-1)}
                        className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    >
                        <ChevronLeft />
                    </button>
                    <span className="text-white font-bold font-mono min-w-[150px] text-center">{getWeekRange()}</span>
                    <button
                        onClick={() => changeWeek(1)}
                        className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                    >
                        <ChevronRight />
                    </button>
                </div>
                <div className="flex gap-4">
                    {Object.entries(SHIFT_TYPES).map(([key, data]) => (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`p-1 rounded ${data.bg} ${data.color}`}>
                                <data.icon size={14} />
                            </div>
                            <span className="text-xs text-gray-400">{data.label}</span>
                        </div>
                    ))}
                </div>
                {canEdit && (
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-accent transition-colors shadow-[0_0_10px_rgba(0,255,157,0.2)]"
                    >
                        <Save size={18} />
                        Save Schedule
                    </button>
                )}
            </div>

            <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-gray-400 font-bold text-sm w-64 sticky left-0 bg-cyber-gray z-10">Employee</th>
                                {DAYS.map(day => (
                                    <th key={day} className="p-4 text-center text-gray-400 font-bold text-sm min-w-[100px]">{day}</th>
                                ))}
                                <th className="p-4 text-center text-gray-400 font-bold text-sm">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {hierarchyRows.map((row, index) => {
                                if (row.type === 'header') {
                                    const node = row.data as OrgNode;
                                    const Icon = node.icon;
                                    // Don't show header if it has no employees and no children with employees (simplification: just check employees length for now, or always show)
                                    // Better to always show to indicate structure, or maybe hide if completely empty?
                                    // For now, let's show it.
                                    return (
                                        <tr key={`header-${index}`} className="bg-white/5">
                                            <td colSpan={9} className="p-2 sticky left-0 bg-[#151923] border-b border-white/5">
                                                <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 20}px` }}>
                                                    <div className={`p-1 rounded ${node.color.replace('text-', 'bg-').replace('400', '500/20')} ${node.color}`}>
                                                        <Icon size={14} />
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase ${node.color}`}>{node.label}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    const emp = row.data as Employee;
                                    const shifts = schedule[emp.id] || ['M', 'M', 'M', 'M', 'M', 'O', 'O'];
                                    const totalHours = shifts.reduce((acc, s) => acc + (s === 'O' ? 0 : 8), 0);

                                    return (
                                        <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 sticky left-0 bg-cyber-gray group-hover:bg-[#1a1f2e] transition-colors border-r border-white/5">
                                                <div className="flex items-center gap-3" style={{ paddingLeft: `${row.level * 20}px` }}>
                                                    <img src={emp.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{emp.name}</p>
                                                        <p className="text-[10px] text-gray-500">{formatRole(emp.role)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {shifts.map((shift, idx) => {
                                                const type = SHIFT_TYPES[shift as keyof typeof SHIFT_TYPES];
                                                const Icon = type.icon;
                                                return (
                                                    <td key={idx} className="p-2 text-center">
                                                        <button
                                                            onClick={() => handleToggleShift(emp.id, idx)}
                                                            disabled={!canEdit}
                                                            className={`w-full h-10 rounded-lg flex items-center justify-center transition-all border border-transparent 
                                                                ${canEdit ? 'hover:border-white/20 cursor-pointer' : 'cursor-default opacity-80'} 
                                                                ${type.bg}`}
                                                            title={canEdit ? `Click to change shift` : `Read-only view`}
                                                        >
                                                            <Icon size={16} className={type.color} />
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            <td className="p-4 text-center">
                                                <span className={`font-mono font-bold text-sm ${totalHours > 40 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {totalHours}h
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShiftPlanner;
