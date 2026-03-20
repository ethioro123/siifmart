import { supabase } from '../lib/supabase';
import type { Employee } from '../types';

export const employeesService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((e: any) => ({
            ...e,
            siteId: e.site_id,
            joinDate: e.join_date,
            performanceScore: e.performance_score,
            attendanceRate: e.attendance_rate
        }));
    },

    async getPaginated(siteId?: string, page: number = 1, limit: number = 20, searchTerm: string = '', filters?: any) {
        // Step 1: Fetch ALL matching lightweight data (ID, Role, Name) to sort globally
        let query = supabase
            .from('employees')
            .select('id, role, name, created_at', { count: 'exact' });

        // Filters
        if (siteId && siteId !== 'All') query = query.eq('site_id', siteId);
        if (filters?.role && filters.role !== 'All') query = query.eq('role', filters.role);
        if (filters?.status && filters.status !== 'All') query = query.eq('status', filters.status);
        if (filters?.department && filters.department !== 'All') query = query.eq('department', filters.department);

        // Search
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        }

        const { data: allIds, error: idError, count } = await query;
        if (idError) throw idError;

        // Step 2: Sort globally by Hierarchy in Memory
        const ROLE_HIERARCHY: Record<string, number> = {
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
            'logistics_manager': 65,
            'inventory_manager': 65,
            'assistant_manager': 60,
            'shift_lead': 55,
            'cs_manager': 60,
            // Level 4 - Staff (10-40)
            'supervisor': 50,
            'auditor': 40,
            'staff': 40,
            'associate': 40,
            'it_support': 35,
            'dispatcher': 35,
            'accountant': 35,
            'data_analyst': 35,
            'training_coordinator': 35,
            'cashier': 30,
            'loss_prevention': 30,
            'driver': 30, // Elevated slightly from 20 to grouping
            'sales_associate': 28,
            'pos': 28,
            'stock_clerk': 25,
            'inventory_specialist': 25,
            'customer_service': 25,
            'merchandiser': 25,
            'picker': 22,
            'packer': 22,
            'receiver': 22,
            'returns_clerk': 22,
            'forklift_operator': 20,
            'security': 20,
            'maintenance': 20,
            'cleaner': 10,
            'admin': 90, // Legacy
            'manager': 65, // Legacy
            'hr': 85 // Legacy
        };

        const sortedData = (allIds || []).sort((a: any, b: any) => {
            const rankA = ROLE_HIERARCHY[a.role] || 0;
            const rankB = ROLE_HIERARCHY[b.role] || 0;

            if (rankA !== rankB) return rankB - rankA; // Highest rank first
            return a.name.localeCompare(b.name); // Then alphabetical
        });

        // Step 3: Slice for current page
        const from = (page - 1) * limit;
        const to = from + limit;
        const pageIds = sortedData.slice(from, to).map((e: any) => e.id);

        if (pageIds.length === 0) {
            return { data: [], count: count || 0 };
        }

        // Step 4: Fetch full details for the sliced IDs
        // We order by field to maintain the sort order (requires manual re-sort or fetch and map)
        const { data: details, error: detailsError } = await supabase
            .from('employees')
            .select('*')
            .in('id', pageIds);

        if (detailsError) throw detailsError;

        // Step 5: Re-sort details to match the pageIds order (since .in() doesn't guarantee order)
        const sortedDetails = pageIds.map(id => details.find((d: any) => d.id === id)).filter(Boolean);

        return {
            data: sortedDetails.map((e: any) => ({
                ...e,
                siteId: e.site_id,
                joinDate: e.join_date,
                performanceScore: e.performance_score,
                attendanceRate: e.attendance_rate
            })),
            count: count || 0
        };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async create(employee: Omit<Employee, 'created_at' | 'updated_at'>) {
        const dbEmployee = {
            id: employee.id,
            code: employee.code,
            site_id: employee.siteId,
            name: employee.name,
            role: employee.role,
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
            join_date: employee.joinDate,
            department: employee.department,
            avatar: employee.avatar,
            performance_score: employee.performanceScore,
            specialization: employee.specialization,
            salary: employee.salary,
            badges: employee.badges,
            attendance_rate: employee.attendanceRate
        };
        const { data, error } = await supabase
            .from('employees')
            .insert(dbEmployee)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async update(id: string, updates: Partial<Employee>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.joinDate !== undefined) { dbUpdates.join_date = updates.joinDate; delete dbUpdates.joinDate; }
        if (updates.performanceScore !== undefined) { dbUpdates.performance_score = updates.performanceScore; delete dbUpdates.performanceScore; }
        if (updates.attendanceRate !== undefined) { dbUpdates.attendance_rate = updates.attendanceRate; delete dbUpdates.attendanceRate; }

        const { data, error } = await supabase
            .from('employees')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
