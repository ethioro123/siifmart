import { useCallback } from 'react';
import {
    WMSJob, JobItem, JobAssignment, Product
} from '../../types';
import {
    wmsJobsService,
    jobAssignmentsService
} from '../../services/supabase.service';
import { QueryClient } from '@tanstack/react-query';

// Helper for translations (mirrors the one in FulfillmentDataProvider)
const getTranslation = (path: string): string => {
    try {
        const { TRANSLATIONS } = require('../../utils/translations');
        const lang = localStorage.getItem('language') || 'en';
        const keys = path.split('.');
        let result: any = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
        for (const key of keys) {
            result = result?.[key];
        }
        return typeof result === 'string' ? result : path;
    } catch { return path; }
};

// ─── Hook Dependencies ──────────────────────────────────────────────────────

interface UseJobActionsDeps {
    jobs: WMSJob[];
    jobAssignments: JobAssignment[];
    employees: any[];
    user: any; // [NEW] Added user
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    setJobAssignments: React.Dispatch<React.SetStateAction<JobAssignment[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    queryClient: QueryClient;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useJobActions = (deps: UseJobActionsDeps) => {
    const { jobs, jobAssignments, employees, user, setJobs, setJobAssignments, addNotification, queryClient } = deps;

    const assignJob = useCallback(async (jobId: string, employeeIdOrName: string) => {
        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                addNotification('alert', 'Job not found');
                return;
            }

            const employee = employees.find((e: any) =>
                e.id === employeeIdOrName || e.name === employeeIdOrName
            );

            if (!employee) {
                addNotification('alert', 'Employee not found');
                return;
            }

            const activeAssignments = jobAssignments.filter(
                a => a.employeeId === employee.id &&
                    ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
            );

            if (activeAssignments.length >= 3) {
                addNotification('alert', getTranslation('warehouse.employeeHasActiveJobs').replace('{name}', employee.name).replace('{count}', activeAssignments.length.toString()));
                return;
            }

            let estimatedDuration = 15;
            if (job.type === 'PICK') {
                estimatedDuration = Math.max(15, job.items * 3);
            } else if (job.type === 'PACK') {
                estimatedDuration = Math.max(10, job.items * 2);
            } else if (job.type === 'PUTAWAY') {
                estimatedDuration = Math.max(20, job.items * 4);
            }

            try {
                const assignment: Partial<JobAssignment> = {
                    jobId: job.id,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    assignedAt: new Date().toISOString(),
                    status: 'Assigned',
                    estimatedDuration
                };

                const createdAssignment = await jobAssignmentsService.create(assignment);
                setJobAssignments(prev => [createdAssignment, ...prev]);
            } catch (assignError) {
                console.warn('Failed to create job assignment record (likely permissions), proceeding with job update:', assignError);
            }

            const updatedJob = await wmsJobsService.update(jobId, {
                assignedTo: employee.id,
                status: 'In-Progress',
                assignedBy: user?.name || 'System' // [NEW] Track dispatcher
            });

            setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            addNotification('success', getTranslation('warehouse.jobAssigned').replace('{name}', employee.name));
        } catch (error) {
            console.error('Failed to assign job:', error);
            addNotification('alert', getTranslation('warehouse.jobAssignFailed'));
        }
    }, [jobs, jobAssignments, employees, setJobs, setJobAssignments, addNotification, queryClient]);

    const unassignJob = useCallback(async (jobId: string) => {
        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                addNotification('alert', 'Job not found');
                return;
            }

            const assignment = jobAssignments.find(a => a.jobId === jobId && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status));
            if (assignment) {
                try {
                    await jobAssignmentsService.update(assignment.id, { status: 'Cancelled' });
                    setJobAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, status: 'Cancelled' } : a));
                } catch (err) {
                    console.warn('Failed to cancel assignment record:', err);
                }
            }

            const updatedJob = await wmsJobsService.update(jobId, {
                assignedTo: '',
                status: 'Pending',
                assignedBy: user?.name || 'System' // [NEW] Track dispatcher
            });

            setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            addNotification('success', 'Job unassigned and returned to queue');
        } catch (error) {
            console.error('Failed to unassign job:', error);
            addNotification('alert', 'Failed to unassign job');
        }
    }, [jobs, jobAssignments, setJobs, setJobAssignments, addNotification, queryClient]);

    const updateJobItem = useCallback(async (jobId: string, itemId: number, status: JobItem['status'], qty: number, location?: string) => {
        console.log(`📝 [updateJobItem] Job=${jobId}, ItemIdx=${itemId}, Status=${status}, Qty=${qty}, Location=${location}`);
        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                console.error(`❌ [updateJobItem] Job ${jobId} not found in local state!`);
                addNotification('alert', getTranslation('warehouse.jobNotFoundRefresh'));
                return;
            }

            const updatedLineItems = [...job.lineItems];
            if (updatedLineItems[itemId]) {
                const oldStatus = updatedLineItems[itemId].status;
                updatedLineItems[itemId] = {
                    ...updatedLineItems[itemId],
                    status,
                    pickedQty: qty,
                    location: location || updatedLineItems[itemId].location
                };
                console.log(`📝 [updateJobItem] Updated item ${itemId}: ${oldStatus} -> ${status}, loc=${updatedLineItems[itemId].location}`);
            } else {
                console.error(`❌ [updateJobItem] Item at index ${itemId} not found in job ${jobId}`);
                return;
            }

            const jobUpdates: Partial<WMSJob> = { lineItems: updatedLineItems };
            if (job.type === 'PUTAWAY' && location) {
                jobUpdates.location = location;
                console.log(`📦 [updateJobItem] Updating job-level location to: ${location} (PUTAWAY)`);
            }

            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...jobUpdates } : j));

            const result = await wmsJobsService.update(jobId, jobUpdates);
            queryClient.invalidateQueries({ queryKey: ['jobs'] });

            console.log(`✅ [updateJobItem] DB update successful. Items count:`, result?.lineItems?.length || 0);
            addNotification('success', 'Item updated');
        } catch (error) {
            console.error(`❌ [updateJobItem] FAILED:`, error);
            addNotification('alert', getTranslation('warehouse.failedToUpdateJobItem'));
        }
    }, [jobs, setJobs, addNotification, queryClient]);

    const updateJobStatus = useCallback(async (jobId: string, status: WMSJob['status']) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));

        try {
            await wmsJobsService.update(jobId, { status });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        } catch (e) {
            console.error('Failed to update job status in DB (keeping local)', e);
        }
    }, [setJobs, queryClient]);

    const updateJob = useCallback(async (id: string, updates: Partial<WMSJob>) => {
        try {
            await wmsJobsService.update(id, updates);
            setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
            addNotification('success', 'Job updated');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update job');
        }
    }, [setJobs, addNotification]);

    return { assignJob, unassignJob, updateJobItem, updateJobStatus, updateJob };
};
