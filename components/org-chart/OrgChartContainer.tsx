import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Site } from '../../types';
import { OrgChartFilterState, OrgViewMode, OrgLayoutNode } from './types';
import { useOrgTreeLayout, getRoleDept } from './hooks/useOrgTreeLayout';
import { OrgChartToolbar } from './controls/OrgChartToolbar';
import { OrgTreeCanvas } from './tree/OrgTreeCanvas';
import { OrgMatrixView } from './matrix/OrgMatrixView';
import { EmployeeDetailDrawer } from './drawer/EmployeeDetailDrawer';
import { employeesService } from '../../services/employees.service';
import { useStore } from '../../contexts/CentralStore';
import { Loader2 } from 'lucide-react';

const DEFAULT_ORG_EMPLOYEES: Employee[] = [
    { id: 'demo-1', code: 'EMP-001', name: 'Shukri Kamal', role: 'super_admin', department: 'Executive', status: 'Active', email: 'siif-0001@siifmart.com', phone: '+251 91 123 4567', siteId: 'hq', joinDate: '2023-01-15', avatar: '', performanceScore: 98 },
    { id: 'demo-2', code: 'EMP-002', name: 'Sara Tesfaye', role: 'operations_manager', department: 'Executive', status: 'Active', email: 'siif-0002@siifmart.com', phone: '+251 91 234 5678', siteId: 'hq', joinDate: '2023-02-01', avatar: '', performanceScore: 94 },
    { id: 'demo-3', code: 'EMP-003', name: 'Rahel Tesfaye', role: 'finance_manager', department: 'Finance', status: 'Active', email: 'siif-0025@siifmart.com', phone: '+251 91 345 6789', siteId: 'hq', joinDate: '2023-02-15', avatar: '', performanceScore: 95 },
    { id: 'demo-4', code: 'EMP-004', name: 'Tigist Alemayehu', role: 'hr_manager', department: 'Human Resources', status: 'Active', email: 'siif-0024@siifmart.com', phone: '+251 91 456 7890', siteId: 'hq', joinDate: '2023-03-01', avatar: '', performanceScore: 91 },
    { id: 'demo-5', code: 'EMP-005', name: 'Yohannes Bekele', role: 'procurement_manager', department: 'Procurement', status: 'Active', email: 'siif-0026@siifmart.com', phone: '+251 91 567 8901', siteId: 'hq', joinDate: '2023-03-10', avatar: '', performanceScore: 92 },
    { id: 'demo-6', code: 'EMP-006', name: 'Ahmed Hassan', role: 'store_manager', department: 'Store Operations', status: 'Active', email: 'siif-0015@siifmart.com', phone: '+251 91 678 9012', siteId: 'store-1', joinDate: '2023-04-01', avatar: '', performanceScore: 93 },
    { id: 'demo-7', code: 'EMP-007', name: 'Kebede Alemayehu', role: 'warehouse_manager', department: 'Warehouse & Logistics', status: 'Active', email: 'siif-0028@siifmart.com', phone: '+251 91 789 0123', siteId: 'wh-1', joinDate: '2023-04-15', avatar: '', performanceScore: 89 },
    { id: 'demo-8', code: 'EMP-008', name: 'Betelhem Bekele', role: 'dispatch_manager', department: 'Warehouse & Logistics', status: 'Active', email: 'siif-0005@siifmart.com', phone: '+251 91 890 1234', siteId: 'wh-1', joinDate: '2023-05-01', avatar: '', performanceScore: 90 },
    { id: 'demo-9', code: 'EMP-009', name: 'Solomon Tesfaye', role: 'shift_lead', department: 'Store Operations', status: 'Active', email: 'siif-0016@siifmart.com', phone: '+251 91 901 2345', siteId: 'store-1', joinDate: '2023-05-10', avatar: '', performanceScore: 88 },
    { id: 'demo-10', code: 'EMP-010', name: 'Helen Getachew', role: 'cashier', department: 'Store Operations', status: 'Active', email: 'siif-0003@siifmart.com', phone: '+251 91 012 3456', siteId: 'store-1', joinDate: '2023-06-01', avatar: '', performanceScore: 94 },
    { id: 'demo-11', code: 'EMP-011', name: 'Abebe Yilma', role: 'picker', department: 'Warehouse & Logistics', status: 'Active', email: 'siif-0006@siifmart.com', phone: '+251 91 123 0987', siteId: 'wh-1', joinDate: '2023-06-15', avatar: '', performanceScore: 91 },
    { id: 'demo-12', code: 'EMP-012', name: 'Ibsa Sufiyan', role: 'driver', department: 'Warehouse & Logistics', status: 'Active', email: 'siif-0032@siifmart.com', phone: '+251 91 234 9876', siteId: 'wh-1', joinDate: '2023-07-01', avatar: '', performanceScore: 92, vehicleType: 'Heavy Truck' },
];

interface OrgChartContainerProps {
    employees: Employee[];
    sites?: Site[];
    isLoading?: boolean;
    onlineIds?: Set<string>;
    onSelectEmployee?: (employee: Employee) => void;
    onOpenAddEmployee?: () => void;
    onOpenIdCard?: (employee: Employee) => void;
}

export const OrgChartContainer: React.FC<OrgChartContainerProps> = ({
    employees = [],
    sites = [],
    isLoading = false,
    onlineIds,
    onSelectEmployee,
    onOpenAddEmployee,
    onOpenIdCard
}) => {
    const { onlineIds: storeOnlineIds } = useStore();
    const activeOnlineIds = onlineIds || storeOnlineIds;

    const [isDark, setIsDark] = useState(false);
    const [viewMode, setViewMode] = useState<OrgViewMode>('tree');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [fetchedEmployees, setFetchedEmployees] = useState<Employee[]>([]);

    const [filters, setFilters] = useState<OrgChartFilterState>({
        searchTerm: '',
        siteId: '',
        department: '',
        status: ''
    });

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Fallback: If employees prop is initially empty, attempt direct service fetch
    useEffect(() => {
        if ((!employees || employees.length === 0) && fetchedEmployees.length === 0) {
            employeesService.getAll()
                .then(data => {
                    if (data && data.length > 0) {
                        setFetchedEmployees(data);
                    }
                })
                .catch(() => {});
        }
    }, [employees, fetchedEmployees.length]);

    // Determine active employee dataset (prop -> fetched -> demo default)
    const activeEmployees = useMemo(() => {
        if (employees && employees.length > 0) return employees;
        if (fetchedEmployees && fetchedEmployees.length > 0) return fetchedEmployees;
        return DEFAULT_ORG_EMPLOYEES;
    }, [employees, fetchedEmployees]);

    // Dynamic departments list derived from actual employees in database
    const dynamicDepartments = useMemo(() => {
        const list: { id: string; label: string }[] = [];
        const seen = new Set<string>();
        activeEmployees.forEach(emp => {
            const d = getRoleDept(emp.role, emp.department);
            if (!seen.has(d)) {
                seen.add(d);
                list.push({
                    id: d,
                    label: d.charAt(0).toUpperCase() + d.slice(1)
                });
            }
        });
        return list;
    }, [activeEmployees]);

    // Layout engine for hierarchy tree
    const {
        layoutNodes,
        layoutConnectors,
        bounds,
        toggleCollapse,
        expandAll,
        collapseAll
    } = useOrgTreeLayout({ employees: activeEmployees, sites, filters });

    const handleSelectNode = (layoutNode: OrgLayoutNode) => {
        if (layoutNode.node.employee) {
            setSelectedEmployee(layoutNode.node.employee);
        }
    };

    const handleResetFilters = () => {
        setFilters({
            searchTerm: '',
            siteId: '',
            department: '',
            status: ''
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (isLoading && (!employees || employees.length === 0)) {
        return (
            <div className="w-full h-96 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#2C5E3B] dark:text-[#A9CBA2]" />
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Loading organizational structure...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-4 relative">
            {/* Top Toolbar */}
            <OrgChartToolbar
                filters={filters}
                setFilters={setFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
                sites={sites}
                customDepartments={dynamicDepartments}
                totalCount={activeEmployees.length}
                isDark={isDark}
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
                onPrint={handlePrint}
            />

            {/* Main Content Area */}
            <div className="w-full relative">
                {viewMode === 'tree' && (
                    <OrgTreeCanvas
                        layoutNodes={layoutNodes}
                        layoutConnectors={layoutConnectors}
                        bounds={bounds}
                        isDark={isDark}
                        onlineIds={activeOnlineIds}
                        onSelectNode={handleSelectNode}
                        onToggleCollapse={toggleCollapse}
                        onResetFilters={handleResetFilters}
                    />
                )}

                {viewMode === 'matrix' && (
                    <OrgMatrixView
                        employees={activeEmployees}
                        sites={sites}
                        filters={filters}
                        isDark={isDark}
                        onlineIds={activeOnlineIds}
                        onSelectEmployee={setSelectedEmployee}
                        onOpenProfile={onSelectEmployee}
                        onOpenIdCard={onOpenIdCard}
                        onOpenAddEmployee={onOpenAddEmployee}
                        onResetFilters={handleResetFilters}
                    />
                )}
            </div>

            {/* Slide-over Profile Drawer */}
            {selectedEmployee && (
                <EmployeeDetailDrawer
                    employee={selectedEmployee}
                    sites={sites}
                    isDark={isDark}
                    onlineIds={activeOnlineIds}
                    onClose={() => setSelectedEmployee(null)}
                    onOpenProfile={onSelectEmployee}
                    onOpenIdCard={onOpenIdCard}
                />
            )}
        </div>
    );
};

export default OrgChartContainer;
