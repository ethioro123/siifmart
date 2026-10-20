import { supabase } from '../lib/supabase';
import { isRegionalWorkforceRole, resolveEmployeeScopeLevel } from '../utils/roleSegregation';
import type { Employee } from '../types';
import type { Country } from '../utils/localization';
import { getEmployeeJobTitle, getJobTitleForRole, getRoleHierarchy, MANAGERIAL_ROLES } from '../utils/roles';
import { formatEmployeeCode, parseEmployeeCode, normalizeCountryCode } from '../utils/employeeIdGenerator';

export interface EmployeeFilters {
    role?: string;
    status?: string;
    department?: string;
    country?: Country;
    countrySiteIds?: string[];
    onlyManagers?: boolean;
    regionCode?: string;
    strictSiteList?: boolean;
}

interface RawDbEmployee {
    id: string;
    site_id?: string;
    name: string;
    role: string;
    job_title?: string;
    email: string;
    phone: string;
    status: string;
    join_date?: string;
    department?: string;
    avatar?: string;
    performance_score?: number;
    attendance_rate?: number;
    specialization?: string;
    salary?: number;
    badges?: string[];
    code?: string;
    created_at?: string;
    updated_at?: string;
    last_login_gps?: string;
    last_login_at?: string;
    last_login_device?: string;
    login_history?: unknown[];
    address?: string;
    emergency_contact?: string;
    age?: number;
    date_of_birth?: string;
    national_id_number?: string;
    [key: string]: unknown;
}

interface LightweightEmployee {
    id: string;
    role: string;
    name: string;
    created_at?: string;
}

function mapDbEmployeeToEmployee(e: RawDbEmployee): Employee {
    return {
        ...e,
        siteId: e.site_id || '',
        site_id: e.site_id,
        role: e.role as Employee['role'],
        jobTitle: e.job_title || getJobTitleForRole(e.role),
        job_title: e.job_title || getJobTitleForRole(e.role),
        status: e.status as Employee['status'],
        joinDate: e.join_date || (e.created_at ? e.created_at.split('T')[0] : e.created_at) || 'N/A',
        performanceScore: e.performance_score ?? 0,
        attendanceRate: e.attendance_rate ?? 0,
        age: e.age !== undefined && e.age !== null ? Number(e.age) : undefined,
        dateOfBirth: (e.date_of_birth || e.dateOfBirth) as string,
        nationalIdNumber: (e.national_id_number || e.nationalIdNumber) as string,
        lastLoginGps: e.last_login_gps,
        last_login_gps: e.last_login_gps,
        lastLoginAt: e.last_login_at,
        last_login_at: e.last_login_at,
        lastLoginDevice: e.last_login_device,
        last_login_device: e.last_login_device,
        loginHistory: e.login_history,
        login_history: e.login_history,
        regionCode: (e.region_code || e.regionCode) as string,
        region_code: (e.region_code || e.regionCode) as string,
        scopeLevel: ((e.scope_level || e.scopeLevel) === 'REGIONAL' ? 'REGIONAL' : 'HQ') as 'HQ' | 'REGIONAL',
        country: (e.country || e.country_code || e.countryCode) as string,
        country_code: (e.country_code || e.countryCode || e.country) as string,
        quotaApprovedBy: (e as any).quota_approved_by || (e as any).quotaApprovedBy,
        quota_approved_by: (e as any).quota_approved_by || (e as any).quotaApprovedBy,
        onboardingTier: (e as any).onboarding_tier || (e as any).onboardingTier,
        onboarding_tier: (e as any).onboarding_tier || (e as any).onboardingTier,
        quotaStatus: (e as any).quota_status || (e as any).quotaStatus,
        quota_status: (e as any).quota_status || (e as any).quotaStatus,
        credentialsHandedOverAt: (e as any).credentials_handed_over_at || (e as any).credentialsHandedOverAt,
        credentials_handed_over_at: (e as any).credentials_handed_over_at || (e as any).credentialsHandedOverAt,
        credentialsHandedOverBy: (e as any).credentials_handed_over_by || (e as any).credentialsHandedOverBy,
        credentials_handed_over_by: (e as any).credentials_handed_over_by || (e as any).credentialsHandedOverBy
    } as Employee;
}

export const employeesService = {
    async getAll(siteId?: string | string[], onlyManagers: boolean = false) {
        let query = supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (Array.isArray(siteId)) {
            if (siteId.length === 0) return [];
            query = query.in('site_id', siteId);
        } else if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        if (onlyManagers) {
            query = query.or(`role.in.(${MANAGERIAL_ROLES.join(',')}),status.eq."Pending Approval"`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as RawDbEmployee[]).map(mapDbEmployeeToEmployee);
    },

    async getPendingApproval(country?: string, countrySiteIds?: string[], allowUnassigned: boolean = false): Promise<Employee[]> {
        let query = supabase
            .from('employees')
            .select('*')
            .eq('status', 'Pending Approval')
            .order('created_at', { ascending: false });

        if (country) {
            if (country === 'ET') {
                if (countrySiteIds && countrySiteIds.length > 0) {
                    if (allowUnassigned) {
                        query = query.or(`site_id.in.(${countrySiteIds.join(',')}),site_id.is.null`);
                    } else {
                        query = query.in('site_id', countrySiteIds);
                    }
                } else if (allowUnassigned) {
                    query = query.is('site_id', null);
                } else {
                    return [];
                }
            } else {
                if (countrySiteIds && countrySiteIds.length > 0) {
                    query = query.in('site_id', countrySiteIds);
                } else {
                    return [];
                }
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as RawDbEmployee[]).map(mapDbEmployeeToEmployee);
    },

    async markCredentialsHandedOver(employeeId: string, handedOverBy: string): Promise<void> {
        const timestamp = new Date().toISOString();
        await supabase
            .from('employees')
            .update({
                credentials_handed_over_at: timestamp,
                credentials_handed_over_by: handedOverBy
            })
            .eq('id', employeeId);
    },

    async getPaginated(
        siteId?: string,
        page: number = 1,
        limit: number = 20,
        searchTerm: string = '',
        filters?: EmployeeFilters
    ) {
        // Step 1: Fetch ALL matching lightweight data (ID, Role, Name) to sort globally
        let query = supabase
            .from('employees')
            .select('id, role, name, created_at', { count: 'exact' });

        // Specific site filter takes precedence (e.g. branch manager lock or dropdown selection)
        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        } else if (filters?.strictSiteList) {
            if (!filters.countrySiteIds || filters.countrySiteIds.length === 0) {
                return { data: [], count: 0 };
            }
            query = query.in('site_id', filters.countrySiteIds);
        } else if (filters?.country) {
            // Country tenant isolation
            if (filters.country === 'ET') {
                // Ethiopia is HQ / legacy baseline: include ET sites and unassigned/HQ corporate staff
                if (filters.countrySiteIds && filters.countrySiteIds.length > 0) {
                    query = query.or(`site_id.in.(${filters.countrySiteIds.join(',')}),site_id.is.null`);
                } else {
                    query = query.is('site_id', null);
                }
            } else {
                // Non-Ethiopian country (e.g. KE)
                // Strict isolation: only staff explicitly assigned to facilities in that country
                if (!filters.countrySiteIds || filters.countrySiteIds.length === 0) {
                    return { data: [], count: 0 };
                }
                query = query.in('site_id', filters.countrySiteIds);
            }
        }

        if (filters?.role && filters.role !== 'All') query = query.eq('role', filters.role);
        if (filters?.status && filters.status !== 'All') query = query.eq('status', filters.status);
        if (filters?.department && filters.department !== 'All') query = query.eq('department', filters.department);
        if (filters?.regionCode) query = query.eq('region_code', filters.regionCode);

        // When onlyManagers is requested (e.g. initial global directory/org view), limit to L1-L3 leadership.
        // If a status filter like 'Pending Approval' is set, bypass managerial restriction so
        // candidates awaiting sign-off (pickers, cashiers, drivers, packers) are never hidden from HR checkers.
        if (filters?.onlyManagers && filters?.status !== 'Pending Approval') {
            query = query.or(`role.in.(${MANAGERIAL_ROLES.join(',')}),status.eq."Pending Approval"`);
        }

        // Search
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
        }

        const { data: allIds, error: idError, count } = await query;
        if (idError) throw idError;

        // Step 2: Sort globally by Hierarchy in Memory using shared role definitions
        const sortedData = ((allIds || []) as LightweightEmployee[]).sort((a, b) => {
            const rankA = getRoleHierarchy(a.role);
            const rankB = getRoleHierarchy(b.role);

            if (rankA !== rankB) return rankB - rankA; // Highest rank first
            return a.name.localeCompare(b.name); // Then alphabetical
        });

        // Step 3: Slice for current page
        const from = (page - 1) * limit;
        const to = from + limit;
        const pageIds = sortedData.slice(from, to).map(e => e.id);

        if (pageIds.length === 0) {
            return { data: [], count: count || 0 };
        }

        // Step 4: Fetch full details for the sliced IDs
        const { data: details, error: detailsError } = await supabase
            .from('employees')
            .select('*')
            .in('id', pageIds);

        if (detailsError) throw detailsError;

        // Step 5: Re-sort details to match the pageIds order
        const detailsMap = new Map((details as RawDbEmployee[]).map(d => [d.id, d]));
        const sortedDetails = pageIds.map(id => detailsMap.get(id)).filter((d): d is RawDbEmployee => Boolean(d));

        return {
            data: sortedDetails.map(mapDbEmployeeToEmployee),
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
        return mapDbEmployeeToEmployee(data as RawDbEmployee);
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .ilike('email', email)
            .single();

        if (error) throw error;
        return mapDbEmployeeToEmployee(data as RawDbEmployee);
    },

    async getNextCode(countryCode?: string): Promise<string> {
        const country = normalizeCountryCode(countryCode || 'ET');
        const { data, error } = await supabase.rpc('reserve_next_employee_code', {
            p_country_code: country
        });

        if (error) throw error;
        if (typeof data !== 'string' || !parseEmployeeCode(data, country)) {
            throw new Error('Employee ID sequence returned an invalid code');
        }
        return data;
    },

    async create(employee: Omit<Employee, 'created_at' | 'updated_at'>) {
        const isCEO = employee.role === 'ceo' || employee.role === 'super_admin' || (employee.role as string) === 'CEO';
        if (!isCEO && (!employee.siteId || !employee.siteId.trim())) {
            throw new Error('Workplace location is mandatory. Every employee must be tied to an operating facility ID, except the CEO.');
        }

        // Regional roles and workers assigned to regional facilities are region-scoped.
        const isExplicitRegionalRole = isRegionalWorkforceRole(employee.role as string);

        let assignedRegionCode: string | null = (employee as any).region_code || employee.regionCode || null;
        if (!assignedRegionCode && employee.siteId && (!employee.scopeLevel || isExplicitRegionalRole)) {
            try {
                const { data: siteRow } = await supabase
                    .from('sites')
                    .select('region_code')
                    .eq('id', employee.siteId)
                    .maybeSingle();
                if (siteRow?.region_code) {
                    assignedRegionCode = siteRow.region_code;
                }
            } catch {
                // Non-blocking fallback
            }
        }
        const scopeLevel = isExplicitRegionalRole
            ? 'REGIONAL'
            : (employee.scopeLevel || resolveEmployeeScopeLevel(employee.role as string, assignedRegionCode));
        const resolvedRegionCode: string | null = scopeLevel === 'REGIONAL' ? assignedRegionCode : null;

        let currentCode = employee.code;

        for (let attempt = 0; attempt < 3; attempt++) {
            const dbEmployee = {
                id: employee.id,
                code: currentCode,
                site_id: employee.siteId,
                region_code: resolvedRegionCode,
                scope_level: scopeLevel,
                name: employee.name,
                job_title: getEmployeeJobTitle(employee),
                role: employee.role,
                email: employee.email.toLowerCase(),
                phone: employee.phone,
                status: employee.status,
                join_date: employee.joinDate,
                department: employee.department,
                avatar: employee.avatar,
                performance_score: employee.performanceScore,
                specialization: employee.specialization,
                salary: employee.salary,
                badges: employee.badges,
                attendance_rate: employee.attendanceRate,
                quota_approved_by: employee.quotaApprovedBy || (employee as any).quota_approved_by,
                onboarding_tier: employee.onboardingTier || (employee as any).onboarding_tier,
                quota_status: employee.quotaStatus || (employee as any).quota_status
            };
            const { data, error } = await supabase
                .from('employees')
                .insert(dbEmployee)
                .select()
                .single();

            if (!error) {
                return mapDbEmployeeToEmployee(data as RawDbEmployee);
            }

            // If unique constraint violation on code, generate fresh next code and retry
            if (error.code === '23505' && (error.message?.includes('code') || error.details?.includes('code'))) {
                const parsed = parseEmployeeCode(currentCode);
                const country = parsed?.country || 'ET';
                const currentNum = parsed?.seq || 0;
                const freshCode = await this.getNextCode(country);
                const freshParsed = parseEmployeeCode(freshCode);
                const freshNum = freshParsed?.seq || 0;
                const nextNum = Math.max(currentNum + 1, freshNum);
                currentCode = formatEmployeeCode(country, nextNum);
                continue;
            }

            throw error;
        }

        throw new Error('Failed to create employee after retrying unique code assignment');
    },

    async update(id: string, updates: Partial<Employee>) {
        // Explicit allowlist — only send columns that exist in the DB
        const FIELD_MAP: Record<string, string> = {
            name: 'name',
            role: 'role',
            jobTitle: 'job_title',
            job_title: 'job_title',
            email: 'email',
            phone: 'phone',
            status: 'status',
            department: 'department',
            avatar: 'avatar',
            specialization: 'specialization',
            salary: 'salary',
            badges: 'badges',
            code: 'code',
            // camelCase → snake_case mappings
            siteId: 'site_id',
            joinDate: 'join_date',
            performanceScore: 'performance_score',
            attendanceRate: 'attendance_rate',
            lastLoginGps: 'last_login_gps',
            lastLoginAt: 'last_login_at',
            lastLoginDevice: 'last_login_device',
            loginHistory: 'login_history',
            emergencyContact: 'emergency_contact',
            address: 'address',
            age: 'age',
            dateOfBirth: 'date_of_birth',
            nationalIdNumber: 'national_id_number',
            regionCode: 'region_code',
            region_code: 'region_code',
            scopeLevel: 'scope_level',
            homeSiteId: 'home_site_id',
            home_site_id: 'home_site_id',
            isLoaned: 'is_loaned',
            is_loaned: 'is_loaned',
            loanedAt: 'loaned_at',
            loaned_at: 'loaned_at',
        };

        const dbUpdates: Record<string, unknown> = {};
        for (const [tsKey, dbCol] of Object.entries(FIELD_MAP)) {
            if ((updates as Record<string, unknown>)[tsKey] !== undefined) {
                dbUpdates[dbCol] = (updates as Record<string, unknown>)[tsKey];
            }
        }
        if (updates.role !== undefined && updates.jobTitle === undefined && updates.job_title === undefined) {
            dbUpdates.job_title = getJobTitleForRole(updates.role as string);
        }

        try {
            const { data, error } = await supabase
                .from('employees')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return mapDbEmployeeToEmployee(data as RawDbEmployee);
        } catch (err: any) {
            // Resilient fallback if optional new columns do not exist yet in DB schema
            if (err?.code === 'PGRST204' || err?.message?.includes('column') || err?.message?.includes('schema')) {
                delete dbUpdates.age;
                delete dbUpdates.date_of_birth;
                delete dbUpdates.national_id_number;
                delete dbUpdates.emergency_contact;
                delete dbUpdates.address;
                delete dbUpdates.scope_level;
                delete dbUpdates.job_title;
                const { data, error: retryError } = await supabase
                    .from('employees')
                    .update(dbUpdates)
                    .eq('id', id)
                    .select()
                    .single();
                if (retryError) throw retryError;
                return mapDbEmployeeToEmployee(data as RawDbEmployee);
            }
            throw err;
        }
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
