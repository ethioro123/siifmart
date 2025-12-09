import React, { useMemo } from 'react';
import { Employee, UserRole, Site } from '../types';
import { User, Shield, Briefcase, Truck, ShoppingBag, Package, MapPin } from 'lucide-react';

interface OrgChartProps {
    employees: Employee[];
    sites?: Site[];
}

interface OrgNode {
    role: UserRole;
    label: string;
    employees: Employee[];
    children: OrgNode[];
    icon: React.ElementType;
    color: string;
}

const OrgChart: React.FC<OrgChartProps> = ({ employees, sites = [] }) => {
    // Helper to get site name for an employee
    const getEmployeeSite = (emp: Employee): string => {
        const site = sites.find(s => s.id === emp.siteId || s.id === emp.site_id);
        return site?.name || 'Central Operations';
    };

    const tree = useMemo(() => {
        const getByRole = (role: UserRole) => employees.filter(e => e.role === role);
        const getByRoleAndDept = (role: UserRole, dept: string) =>
            employees.filter(e => e.role === role && e.department === dept);

        // Define the hierarchy structure with explicit roles only
        const structure: OrgNode = {
            role: 'super_admin',
            label: 'CEO',
            employees: getByRole('super_admin'),
            icon: Shield,
            color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
            children: [
                {
                    role: 'admin',
                    label: 'System Admin',
                    employees: getByRole('admin'),
                    icon: Shield,
                    color: 'text-red-400 border-red-500/50 bg-red-500/10',
                    children: [
                        {
                            role: 'it_support' as UserRole,
                            label: 'IT Support',
                            employees: getByRole('it_support' as UserRole),
                            icon: User,
                            color: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10',
                            children: []
                        }
                    ]
                },
                {
                    role: 'finance_manager' as UserRole,
                    label: 'Finance Manager',
                    employees: getByRole('finance_manager' as UserRole),
                    icon: Briefcase,
                    color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10',
                    children: [
                        {
                            role: 'auditor',
                            label: 'Auditors',
                            employees: getByRole('auditor'),
                            icon: User,
                            color: 'text-gray-400 border-gray-500/50 bg-gray-500/10',
                            children: []
                        }
                    ]
                },
                {
                    role: 'hr',
                    label: 'HR Manager',
                    employees: getByRole('hr'),
                    icon: User,
                    color: 'text-pink-400 border-pink-500/50 bg-pink-500/10',
                    children: []
                },
                {
                    role: 'procurement_manager' as UserRole,
                    label: 'Procurement Mgr',
                    employees: getByRole('procurement_manager' as UserRole),
                    icon: Package,
                    color: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10',
                    children: []
                },
                {
                    role: 'manager',
                    label: 'Retail Manager',
                    employees: getByRoleAndDept('manager', 'Retail Operations'),
                    icon: Briefcase,
                    color: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
                    children: [
                        {
                            role: 'cs_manager' as UserRole,
                            label: 'Customer Service Mgr',
                            employees: getByRole('cs_manager' as UserRole),
                            icon: User,
                            color: 'text-sky-400 border-sky-500/50 bg-sky-500/10',
                            children: []
                        },
                        {
                            role: 'store_supervisor' as UserRole,
                            label: 'Store Supervisors',
                            employees: getByRole('store_supervisor' as UserRole),
                            icon: User,
                            color: 'text-blue-300 border-blue-400/50 bg-blue-400/10',
                            children: [
                                {
                                    role: 'pos',
                                    label: 'Cashiers',
                                    employees: getByRole('pos'),
                                    icon: ShoppingBag,
                                    color: 'text-green-400 border-green-500/50 bg-green-500/10',
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    role: 'warehouse_manager' as UserRole,
                    label: 'Warehouse Manager',
                    employees: getByRole('warehouse_manager' as UserRole),
                    icon: Package,
                    color: 'text-violet-400 border-violet-500/50 bg-violet-500/10',
                    children: [
                        {
                            role: 'dispatcher' as UserRole,
                            label: 'Warehouse Dispatcher',
                            employees: getByRole('dispatcher' as UserRole),
                            icon: Package,
                            color: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10',
                            children: [
                                {
                                    role: 'picker',
                                    label: 'Pickers',
                                    employees: getByRole('picker'),
                                    icon: Package,
                                    color: 'text-teal-400 border-teal-500/50 bg-teal-500/10',
                                    children: []
                                },
                                {
                                    role: 'driver',
                                    label: 'Drivers',
                                    employees: getByRole('driver'),
                                    icon: Truck,
                                    color: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
                                    children: []
                                }
                            ]
                        },
                        {
                            role: 'inventory_specialist' as UserRole,
                            label: 'Inventory Specialist',
                            employees: getByRole('inventory_specialist' as UserRole),
                            icon: Package,
                            color: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
                            children: []
                        }
                    ]
                }
            ]
        };

        return structure;
    }, [employees, sites]);

    const renderNode = (node: OrgNode, level: number = 0) => {
        // Use original cyber-themed colors from node prop
        const cardStyle = `${node.color} bg-cyber-gray shadow-lg`;
        const lineColor = "bg-cyber-primary"; // Solid neon connector lines

        return (
            <div className="flex flex-col items-center">
                {/* Node Card */}
                <div className={`p-3 rounded-lg border ${cardStyle} ${node.label.includes('Manager') ? 'min-w-[200px] max-w-[260px]' : 'min-w-[180px] max-w-[220px]'} text-center relative group transition-all hover:scale-105 z-20`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <node.icon size={16} />
                        <span className="font-bold uppercase text-xs">{node.label}</span>
                    </div>

                    {node.employees.length > 0 ? (
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                            {/* Show all managers (when small), limit others to 5 for readability */}
                            {node.employees.slice(
                                0,
                                (node.label.includes('Manager') && node.employees.length <= 10)
                                    ? node.employees.length
                                    : 5
                            ).map(emp => {
                                const siteName = getEmployeeSite(emp);
                                return (
                                    <div key={emp.id} className="flex items-center gap-2 bg-black/20 p-1.5 rounded hover:bg-black/30 transition-colors">
                                        <img src={emp.avatar} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                                        <div className="text-left overflow-hidden flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                                            </div>
                                            <p className="text-[9px] text-gray-400 truncate">{emp.email}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MapPin size={8} className="text-cyber-primary flex-shrink-0" />
                                                <p className="text-[8px] text-cyber-primary truncate font-semibold">{siteName}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {node.employees.length > (
                                (node.label.includes('Manager') && node.employees.length <= 10)
                                    ? node.employees.length
                                    : 5
                            ) && (
                                    <p className="text-[10px] text-gray-500 italic">
                                        +{node.employees.length - (
                                            (node.label.includes('Manager') && node.employees.length <= 10)
                                                ? node.employees.length
                                                : 5
                                        )} more
                                    </p>
                                )}
                        </div>
                    ) : (
                        <p className="text-[10px] text-gray-500 italic">Vacant</p>
                    )}
                </div>

                {/* Children with Perfect Connectors */}
                {node.children.length > 0 && (
                    <div className="flex flex-col items-center relative w-full">
                        {/* Vertical line down from parent */}
                        <div className={`w-0.5 h-8 ${lineColor} z-10`}></div>

                        {/* Children Container - using padding instead of gap for perfect line connections */}
                        <div className="flex justify-center w-full">
                            {node.children.map((child, index) => (
                                <div key={`${child.role}-${index}`} className="flex flex-col items-center relative px-6">
                                    {/* Horizontal Connector Line Segment */}
                                    {node.children.length > 1 && (
                                        <div className={`absolute top-0 h-0.5 ${lineColor} z-10 ${index === 0 ? 'left-1/2 right-0' :
                                            index === node.children.length - 1 ? 'left-0 right-1/2' :
                                                'left-0 right-0'
                                            }`}></div>
                                    )}

                                    {/* Vertical line from horizontal segment down to child */}
                                    <div className={`w-0.5 h-8 ${lineColor} z-10`}></div>

                                    {renderNode(child, level + 1)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        // Use a large container with auto overflow to ensure everything is reachable
        <div className="w-full h-[800px] overflow-auto bg-gradient-to-b from-black/20 to-transparent rounded-xl border border-white/5 p-8">
            <div className="min-w-max min-h-max flex justify-center p-10">
                {renderNode(tree)}
            </div>
        </div>
    );
};

export default OrgChart;
