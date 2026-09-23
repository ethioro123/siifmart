import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, StaffSchedule } from '../types';
import { schedulesService } from '../services/schedules.service';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import {
    getWeekMonday,
    formatISODate,
    getWeekDates,
    formatWeekDisplay,
    classifyShift,
    calculateShiftHours,
    calculateWeeklyHours,
    calculateDailyCoverage,
    SHIFT_PRESETS,
    ShiftCode
} from '../utils/shiftPlanner';
import { logger } from '../utils/logger';

interface UseWeeklyShiftPlannerProps {
    employees: Employee[];
    canEdit: boolean;
    initialSiteFilter?: string;
}

export function useWeeklyShiftPlanner({
    employees,
    canEdit,
    initialSiteFilter = 'All'
}: UseWeeklyShiftPlannerProps) {
    const { addNotification, sites, activeSite } = useData();
    const { user } = useStore();
    const queryClient = useQueryClient();

    // --- STATE ---
    const [currentMonday, setCurrentMonday] = useState<Date>(() => getWeekMonday(new Date()));
    const [filterSite, setFilterSite] = useState<string>(initialSiteFilter);
    const [filterDepartment, setFilterDepartment] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [localOverrides, setLocalOverrides] = useState<Record<string, StaffSchedule | null>>({});
    const [isDirty, setIsDirty] = useState<boolean>(false);

    // Detail Modal State
    const [editingCell, setEditingCell] = useState<{
        employee: Employee;
        date: string;
        schedule: StaffSchedule | null;
    } | null>(null);

    // Confirmation Modals State
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    // --- DATES ---
    const weekDays = useMemo(() => getWeekDates(currentMonday), [currentMonday]);
    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;
    const weekLabel = useMemo(() => formatWeekDisplay(currentMonday), [currentMonday]);

    // Effective site scope: if filterSite is not 'All', use it; else if user has activeSite, use activeSite
    const effectiveSiteId = useMemo(() => {
        if (filterSite && filterSite !== 'All') return filterSite;
        return undefined;
    }, [filterSite]);

    // --- QUERY ---
    const queryKey = useMemo(() => ['staff_schedules_week', startDate, endDate, effectiveSiteId || 'all'], [startDate, endDate, effectiveSiteId]);

    const { data: serverSchedules = [], isLoading, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            try {
                return await schedulesService.getByDateRange(startDate, endDate, effectiveSiteId);
            } catch (err) {
                logger.error('useWeeklyShiftPlanner', 'Failed to fetch schedules', err as Error);
                return [];
            }
        },
        staleTime: 60 * 1000
    });

    // --- MERGED SCHEDULE MAP ---
    // Key: `${employeeId}_${date}` -> StaffSchedule | null
    const scheduleMap = useMemo(() => {
        const map = new Map<string, StaffSchedule | null>();

        // Fill with server data
        serverSchedules.forEach(schedule => {
            const key = `${schedule.employeeId}_${schedule.date}`;
            map.set(key, schedule);
        });

        // Overlay local overrides
        Object.entries(localOverrides).forEach(([key, override]) => {
            map.set(key, override);
        });

        return map;
    }, [serverSchedules, localOverrides]);

    // --- FILTERED EMPLOYEES ---
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            // Site filter
            if (effectiveSiteId && emp.siteId !== effectiveSiteId && (emp as any).site_id !== effectiveSiteId) {
                return false;
            }

            // Department filter
            if (filterDepartment !== 'All' && emp.department !== filterDepartment) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesName = emp.name.toLowerCase().includes(q);
                const matchesRole = emp.role.toLowerCase().includes(q);
                const matchesDept = emp.department?.toLowerCase().includes(q);
                if (!matchesName && !matchesRole && !matchesDept) return false;
            }

            return true;
        });
    }, [employees, effectiveSiteId, filterDepartment, searchQuery]);

    // --- NAVIGATION ---
    const navigateWeek = useCallback((deltaWeeks: number) => {
        setCurrentMonday(prev => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + deltaWeeks * 7);
            return next;
        });
        setLocalOverrides({});
        setIsDirty(false);
    }, []);

    const goToCurrentWeek = useCallback(() => {
        setCurrentMonday(getWeekMonday(new Date()));
        setLocalOverrides({});
        setIsDirty(false);
    }, []);

    // --- SHIFT CYCLING & MUTATION ---
    const cycleShift = useCallback((employee: Employee, date: string) => {
        if (!canEdit) return;

        const key = `${employee.id}_${date}`;
        const currentSchedule = scheduleMap.get(key);
        const currentCode = classifyShift(currentSchedule);

        const cycleOrder: ShiftCode[] = ['O', 'M', 'E', 'N'];
        const currentIndex = cycleOrder.indexOf(currentCode);
        const nextCode = cycleOrder[(currentIndex + 1) % cycleOrder.length];

        const preset = SHIFT_PRESETS[nextCode];

        let updated: StaffSchedule | null = null;
        if (nextCode === 'O') {
            updated = {
                id: currentSchedule?.id || crypto.randomUUID(),
                siteId: employee.siteId || (employee as any).site_id || activeSite?.id || '',
                employeeId: employee.id,
                employeeName: employee.name,
                date,
                startTime: '00:00',
                endTime: '00:00',
                role: employee.role,
                notes: '',
                status: 'Cancelled'
            };
        } else {
            updated = {
                id: currentSchedule?.id || crypto.randomUUID(),
                siteId: employee.siteId || (employee as any).site_id || activeSite?.id || '',
                employeeId: employee.id,
                employeeName: employee.name,
                date,
                startTime: preset.startTime,
                endTime: preset.endTime,
                role: employee.role,
                notes: currentSchedule?.notes || '',
                status: 'Scheduled'
            };
        }

        setLocalOverrides(prev => ({ ...prev, [key]: updated }));
        setIsDirty(true);
    }, [canEdit, scheduleMap, activeSite]);

    const setCustomShift = useCallback((
        employee: Employee,
        date: string,
        details: { startTime: string; endTime: string; role: string; notes?: string; status?: 'Scheduled' | 'Confirmed' | 'Cancelled' }
    ) => {
        if (!canEdit) return;
        const key = `${employee.id}_${date}`;
        const currentSchedule = scheduleMap.get(key);

        const updated: StaffSchedule = {
            id: currentSchedule?.id || crypto.randomUUID(),
            siteId: employee.siteId || (employee as any).site_id || activeSite?.id || '',
            employeeId: employee.id,
            employeeName: employee.name,
            date,
            startTime: details.startTime,
            endTime: details.endTime,
            role: details.role || employee.role,
            notes: details.notes || '',
            status: details.status || 'Scheduled'
        };

        setLocalOverrides(prev => ({ ...prev, [key]: updated }));
        setIsDirty(true);
        setEditingCell(null);
    }, [canEdit, scheduleMap, activeSite]);

    // --- SAVE BATCH ---
    const saveMutation = useMutation({
        mutationFn: async () => {
            const schedulesToSave: StaffSchedule[] = [];
            Object.values(localOverrides).forEach(schedule => {
                if (schedule) {
                    schedulesToSave.push(schedule);
                }
            });

            if (schedulesToSave.length > 0) {
                await schedulesService.upsertBatch(schedulesToSave);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            window.dispatchEvent(new CustomEvent('roster-updated'));
            setLocalOverrides({});
            setIsDirty(false);
            addNotification('success', 'Roster saved successfully');
        },
        onError: (err) => {
            logger.error('useWeeklyShiftPlanner', 'Save failed', err as Error);
            addNotification('alert', 'Failed to save shift schedule');
        }
    });

    // --- COPY PREVIOUS WEEK ---
    const copyPreviousWeekMutation = useMutation({
        mutationFn: async () => {
            const prevMonday = new Date(currentMonday);
            prevMonday.setDate(currentMonday.getDate() - 7);
            const prevDays = getWeekDates(prevMonday);
            const prevStart = prevDays[0].date;
            const prevEnd = prevDays[6].date;

            const prevSchedules = await schedulesService.getByDateRange(prevStart, prevEnd, effectiveSiteId);
            if (!prevSchedules.length) {
                throw new Error('No shifts found in previous week to copy');
            }

            const newOverrides: Record<string, StaffSchedule | null> = {};

            prevSchedules.forEach(prevShift => {
                if (prevShift.status === 'Cancelled') return;
                const prevDate = new Date(prevShift.date);
                const dayIndex = (prevDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
                const targetDate = weekDays[dayIndex].date;
                const key = `${prevShift.employeeId}_${targetDate}`;

                newOverrides[key] = {
                    id: crypto.randomUUID(),
                    siteId: prevShift.siteId,
                    employeeId: prevShift.employeeId,
                    employeeName: prevShift.employeeName,
                    date: targetDate,
                    startTime: prevShift.startTime,
                    endTime: prevShift.endTime,
                    role: prevShift.role,
                    notes: prevShift.notes,
                    status: 'Scheduled'
                };
            });

            setLocalOverrides(prev => ({ ...prev, ...newOverrides }));
            setIsDirty(true);
        },
        onSuccess: () => {
            setIsCopyModalOpen(false);
            addNotification('success', 'Previous week copied into current view (click Save to persist)');
        },
        onError: (err: any) => {
            logger.warn('useWeeklyShiftPlanner', 'Copy week warning', err);
            addNotification('alert', err.message || 'Could not copy previous week');
            setIsCopyModalOpen(false);
        }
    });

    // --- PUBLISH ROSTER ---
    const publishRosterMutation = useMutation({
        mutationFn: async () => {
            const allActiveShifts: StaffSchedule[] = [];
            weekDays.forEach(day => {
                filteredEmployees.forEach(emp => {
                    const key = `${emp.id}_${day.date}`;
                    const schedule = scheduleMap.get(key);
                    if (schedule && schedule.status !== 'Cancelled') {
                        allActiveShifts.push({
                            ...schedule,
                            status: 'Confirmed'
                        });
                    }
                });
            });

            if (allActiveShifts.length > 0) {
                await schedulesService.upsertBatch(allActiveShifts);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            window.dispatchEvent(new CustomEvent('roster-updated'));
            setLocalOverrides({});
            setIsDirty(false);
            setIsPublishModalOpen(false);
            addNotification('success', 'Roster published and confirmed for the team');
        },
        onError: (err) => {
            logger.error('useWeeklyShiftPlanner', 'Publish failed', err as Error);
            addNotification('alert', 'Failed to publish roster');
            setIsPublishModalOpen(false);
        }
    });

    // --- CLEAR WEEK ---
    const clearWeek = useCallback(() => {
        const clearedOverrides: Record<string, StaffSchedule | null> = {};
        weekDays.forEach(day => {
            filteredEmployees.forEach(emp => {
                const key = `${emp.id}_${day.date}`;
                const existing = scheduleMap.get(key);
                if (existing) {
                    clearedOverrides[key] = {
                        ...existing,
                        status: 'Cancelled',
                        startTime: '00:00',
                        endTime: '00:00'
                    };
                }
            });
        });

        setLocalOverrides(prev => ({ ...prev, ...clearedOverrides }));
        setIsDirty(true);
        setIsClearModalOpen(false);
        addNotification('info', 'Weekly shifts cleared (click Save to persist)');
    }, [weekDays, filteredEmployees, scheduleMap, addNotification]);

    // --- ANALYTICS ---
    const allCurrentShifts = useMemo(() => {
        const shifts: StaffSchedule[] = [];
        scheduleMap.forEach(s => {
            if (s && s.status !== 'Cancelled') shifts.push(s);
        });
        return shifts;
    }, [scheduleMap]);

    const dailyCoverage = useMemo(() => {
        return calculateDailyCoverage(allCurrentShifts, weekDays.map(d => d.date));
    }, [allCurrentShifts, weekDays]);

    const totalWeekHours = useMemo(() => {
        return dailyCoverage.reduce((sum, day) => sum + day.totalHours, 0);
    }, [dailyCoverage]);

    const employeeWeeklyHours = useMemo(() => {
        const map = new Map<string, number>();
        filteredEmployees.forEach(emp => {
            const empShifts = weekDays.map(d => scheduleMap.get(`${emp.id}_${d.date}`));
            map.set(emp.id, calculateWeeklyHours(empShifts));
        });
        return map;
    }, [filteredEmployees, weekDays, scheduleMap]);

    return {
        // State
        currentMonday,
        weekDays,
        weekLabel,
        filterSite,
        setFilterSite,
        filterDepartment,
        setFilterDepartment,
        searchQuery,
        setSearchQuery,
        filteredEmployees,
        scheduleMap,
        isLoading,
        isDirty,
        sites,

        // Actions
        navigateWeek,
        goToCurrentWeek,
        cycleShift,
        setCustomShift,
        saveSchedule: saveMutation.mutate,
        isSaving: saveMutation.isPending,
        copyPreviousWeek: copyPreviousWeekMutation.mutate,
        isCopying: copyPreviousWeekMutation.isPending,
        publishRoster: publishRosterMutation.mutate,
        isPublishing: publishRosterMutation.isPending,
        clearWeek,

        // Modals
        editingCell,
        setEditingCell,
        isPublishModalOpen,
        setIsPublishModalOpen,
        isClearModalOpen,
        setIsClearModalOpen,
        isCopyModalOpen,
        setIsCopyModalOpen,

        // Metrics
        dailyCoverage,
        totalWeekHours,
        employeeWeeklyHours
    };
}
