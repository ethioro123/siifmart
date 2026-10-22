import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Site } from '../../types';
import { OrgChartFilterState } from './types';
import { getRoleDept } from './hooks/useOrgTreeLayout';
import { OrgChartToolbar } from './controls/OrgChartToolbar';
import { OrgMatrixView } from './matrix/OrgMatrixView';
import { EmployeeDetailDrawer } from './drawer/EmployeeDetailDrawer';
import { employeesService } from '../../services/employees.service';
import { useStore } from '../../contexts/CentralStore';
import { Loader2 } from 'lucide-react';

const DEFAULT_ORG_EMPLOYEES: Employee[] = [
    { id: 'demo-1', code: 'ET-SIIF0001', name: 'Shukri Kamal', role: 'super_admin', department: 'Executive', status: 'Active', email: 'et-siif0001@siifmart.com', phone: '+251 91 123 4567', siteId: 'hq', joinDate: '2023-01-15', avatar: '', performanceScore: 98 },
    { id: 'demo-2', code: 'ET-SIIF0002', name: 'Sara Tesfaye', role: 'head_of_operations', department: 'Executive', status: 'Active', email: 'et-siif0002@siifmart.com', phone: '+251 91 234 5678', siteId: 'hq', joinDate: '2023-02-01', avatar: '', performanceScore: 94 },
    { id: 'demo-3', code: 'ET-SIIF0025', name: 'Rahel Tesfaye', role: 'head_of_finance', department: 'Finance', status: 'Active', email: 'et-siif0025@siifmart.com', phone: '+251 91 345 6789', siteId: 'hq', joinDate: '2023-02-15', avatar: '', performanceScore: 95 },
    { id: 'demo-4', code: 'ET-SIIF0024', name: 'Tigist Alemayehu', role: 'head_of_hr', department: 'Human Resources', status: 'Active', email: 'et-siif0024@siifmart.com', phone: '+251 91 456 7890', siteId: 'hq', joinDate: '2023-03-01', avatar: '', performanceScore: 91 },
    { id: 'demo-5', code: 'ET-SIIF0026', name: 'Yohannes Bekele', role: 'head_of_procurement', department: 'Procurement', status: 'Active', email: 'et-siif0026@siifmart.com', phone: '+251 91 567 8901', siteId: 'hq', joinDate: '2023-03-10', avatar: '', performanceScore: 92 },
    { id: 'demo-6', code: 'ET-SIIF0015', name: 'Ahmed Hassan', role: 'store_manager', department: 'Store Operations', status: 'Active', email: 'et-siif0015@siifmart.com', phone: '+251 91 678 9012', siteId: 'store-1', joinDate: '2023-04-01', avatar: '', performanceScore: 93 },
    { id: 'demo-7', code: 'ET-SIIF0028', name: 'Kebede Alemayehu', role: 'warehouse_manager', department: 'Warehouse & Logistics', status: 'Active', email: 'et-siif0028@siifmart.com', phone: '+251 91 789 0123', siteId: 'wh-1', joinDate: '2023-04-15', avatar: '', performanceScore: 89 },
    { id: 'demo-8', code: 'ET-SIIF0005', name: 'Betelhem Bekele', role: 'dispatch_manager', department: 'Warehouse & Logistics', status: 'Active', email: 'et-siif0005@siifmart.com', phone: '+251 91 890 1234', siteId: 'wh-1', joinDate: '2023-05-01', avatar: '', performanceScore: 90 },
    { id: 'demo-9', code: 'ET-SIIF0016', name: 'Solomon Tesfaye', role: 'shift_lead', department: 'Store Operations', status: 'Active', email: 'et-siif0016@siifmart.com', phone: '+251 91 901 2345', siteId: 'store-1', joinDate: '2023-05-10', avatar: '', performanceScore: 88 },
    { id: 'demo-10', code: 'ET-SIIF0003', name: 'Helen Getachew', role: 'cashier', department: 'Store Operations', status: 'Active', email: 'et-siif0003@siifmart.com', phone: '+251 91 012 3456', siteId: 'store-1', joinDate: '2023-06-01', avatar: '', performanceScore: 94 },
    { id: 'demo-11', code: 'ET-SIIF0006', name: 'Abebe Yilma', role: 'picker', department: 'Warehouse & Logistics', status: 'Active', email: 'et-siif0006@siifmart.com', phone: '+251 91 123 0987', siteId: 'wh-1', joinDate: '2023-06-15', avatar: '', performanceScore: 91 },
    { id: 'demo-12', code: 'ET-SIIF0032', name: 'Ibsa Sufiyan', role: 'driver', department: 'Warehouse & Logistics', status: 'Active', email: 'et-siif0032@siifmart.com', phone: '+251 91 234 9876', siteId: 'wh-1', joinDate: '2023-07-01', avatar: '', performanceScore: 92, vehicleType: 'Heavy Truck' },
    { id: 'demo-13', code: 'ET-SIIF0040', name: 'Bethlehem Tadesse', role: 'payroll_specialist', department: 'Human Resources', status: 'Active', email: 'et-siif0040@siifmart.com', phone: '+251 91 555 1234', siteId: 'hq', joinDate: '2023-04-10', avatar: '', performanceScore: 93 },
    { id: 'demo-14', code: 'ET-SIIF0041', name: 'Kalkidan Girma', role: 'talent_recruiter', department: 'Human Resources', status: 'Active', email: 'et-siif0041@siifmart.com', phone: '+251 91 555 5678', siteId: 'hq', joinDate: '2023-05-15', avatar: '', performanceScore: 90 },
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
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [fetchedEmployees, setFetchedEmployees] = useState<Employee[]>([]);

    const [filters, setFilters] = useState<OrgChartFilterState>({
        searchTerm: '',
        siteId: '',
        department: '',
        status: '',
        hierarchyLevel: null
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

    const [siteEmployees, setSiteEmployees] = useState<Map<string, Employee[]>>(new Map());

    // On-demand facility roster loading:
    // When a specific store/warehouse is filtered, fetch all personnel at that facility (including frontline staff)
    useEffect(() => {
        if (filters.siteId && filters.siteId !== 'All' && !siteEmployees.has(filters.siteId)) {
            employeesService.getAll(filters.siteId)
                .then(data => {
                    if (data && data.length > 0) {
                        setSiteEmployees(prev => new Map(prev).set(filters.siteId, data));
                    }
                })
                .catch(() => {});
        }
    }, [filters.siteId, siteEmployees]);

    // Initial fallback: Only fetch managers & leadership when employees prop is empty
    useEffect(() => {
        if ((!employees || employees.length === 0) && fetchedEmployees.length === 0) {
            employeesService.getAll(undefined, true)
                .then(data => {
                    if (data && data.length > 0) {
                        setFetchedEmployees(data);
                    }
                })
                .catch(() => {});
        }
    }, [employees, fetchedEmployees.length]);

    // Determine active employee dataset (prop -> site-specific on-demand -> fetched -> demo default)
    const activeEmployees = useMemo(() => {
        if (filters.siteId && siteEmployees.has(filters.siteId)) {
            const specificStaff = siteEmployees.get(filters.siteId) || [];
            const base = (employees && employees.length > 0) ? employees : (fetchedEmployees.length > 0 ? fetchedEmployees : DEFAULT_ORG_EMPLOYEES);
            const otherStaff = base.filter(e => (e.siteId || e.site_id) !== filters.siteId);
            return [...otherStaff, ...specificStaff];
        }
        if (employees && employees.length > 0) return employees;
        if (fetchedEmployees && fetchedEmployees.length > 0) return fetchedEmployees;
        return DEFAULT_ORG_EMPLOYEES;
    }, [filters.siteId, siteEmployees, employees, fetchedEmployees]);

    // Active personnel count
    const activeCount = useMemo(() => {
        return activeEmployees.filter(e => e.status === 'Active').length;
    }, [activeEmployees]);

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

    const handleResetFilters = () => {
        setFilters({
            searchTerm: '',
            siteId: '',
            department: '',
            status: '',
            hierarchyLevel: null
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
            {/* Dedicated Matrix Command Bar */}
            <OrgChartToolbar
                filters={filters}
                setFilters={setFilters}
                sites={sites}
                customDepartments={dynamicDepartments}
                totalCount={activeEmployees.length}
                activeCount={activeCount}
                isDark={isDark}
                onPrint={handlePrint}
                onResetFilters={handleResetFilters}
            />

            {/* Authoritative Matrix View (Tree Canvas completely removed) */}
            <div className="w-full relative">
                <OrgMatrixView
                    employees={activeEmployees}
                    sites={sites}
                    filters={filters}
                    setFilters={setFilters}
                    isDark={isDark}
                    onlineIds={activeOnlineIds}
                    onSelectEmployee={setSelectedEmployee}
                    onOpenProfile={onSelectEmployee}
                    onOpenIdCard={onOpenIdCard}
                    onOpenAddEmployee={onOpenAddEmployee}
                    onResetFilters={handleResetFilters}
                />
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
