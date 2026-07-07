import { useCallback } from 'react';
import {
    WMSJob, JobItem, JobAssignment, Product
} from '../../types';
import {
    wmsJobsService,
    jobAssignmentsService
} from '../../services/supabase.service';
import { QueryClient } from '@tanstack/react-query';
import { logger } from '../../utils/logger';

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
    activeSiteId: string | undefined;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useJobActions = (deps: UseJobActionsDeps) => {
    const { jobs, jobAssignments, employees, user, setJobs, setJobAssignments, addNotification, queryClient, activeSiteId } = deps;

    const assignJob = useCallback(async (jobId: string, employeeIdOrName: string, source?: string) => {
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

            // Block double-assignment: if someone is already on this job, it must be unassigned first
            if (job.assignedTo && job.assignedTo !== employee.id) {
                const currentWorker = employees.find((e: any) => e.id === job.assignedTo);
                const workerName = currentWorker?.name || 'another worker';
                addNotification('alert', `This job is already assigned to ${workerName}. Unassign it first before reassigning.`);
                return;
            }

            const activeAssignments = jobAssignments.filter(
                a => a.employeeId === employee.id &&
                    ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
            );

            // Removed 3-job limit as per user request
            /*
            if (activeAssignments.length >= 3) {
                addNotification('alert', getTranslation('warehouse.employeeHasActiveJobs').replace('{name}', employee.name).replace('{count}', activeAssignments.length.toString()));
                return;
            }
            */

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
                logger.warn('useJobActions', 'Failed to create job assignment record (likely permissions), proceeding with job update:');
            }

            const updatedJob = await wmsJobsService.update(jobId, {
                assignedTo: employee.id,
                status: 'In-Progress',
                assignedBy: source || user?.name || 'System'
            });

            setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            addNotification('success', getTranslation('warehouse.jobAssigned').replace('{name}', employee.name));
        } catch (error) {
            logger.error('useJobActions', 'Failed to assign job:', error);
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
                    logger.warn('useJobActions', 'Failed to cancel assignment record:');
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
            logger.error('useJobActions', 'Failed to unassign job:', error);
            addNotification('alert', 'Failed to unassign job');
        }
    }, [jobs, jobAssignments, setJobs, setJobAssignments, addNotification, queryClient]);

    const updateJobItem = useCallback(async (jobId: string, itemId: number, status: JobItem['status'], qty: number, location?: string) => {
        logger.debug('useJobActions', `📝 [updateJobItem] Job=${jobId}, ItemIdx=${itemId}, Status=${status}, Qty=${qty}, Location=${location}`);
        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                logger.error('useJobActions', `❌ [updateJobItem] Job ${jobId} not found in local state!`, new Error(String(`❌ [updateJobItem] Job ${jobId} not found in local state!`)));
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
                logger.debug('useJobActions', `📝 [updateJobItem] Updated item ${itemId}: ${oldStatus} -> ${status}, loc=${updatedLineItems[itemId].location}`);
            } else {
                logger.error('useJobActions', `❌ [updateJobItem] Item at index ${itemId} not found in job ${jobId}`, new Error(String(`❌ [updateJobItem] Item at index ${itemId} not found in job ${jobId}`)));
                return;
            }

            const jobUpdates: Partial<WMSJob> = { lineItems: updatedLineItems };
            if (job.type === 'PUTAWAY' && location) {
                jobUpdates.location = location;
                logger.debug('useJobActions', `📦 [updateJobItem] Updating job-level location to: ${location} (PUTAWAY)`);
            }

            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...jobUpdates } : j));

            const result = await wmsJobsService.update(jobId, jobUpdates);
            queryClient.invalidateQueries({ queryKey: ['jobs'] });

            logger.debug('useJobActions', `✅ [updateJobItem] DB update successful. Items count:`, result?.lineItems?.length || 0);
            addNotification('success', 'Item updated');
        } catch (error) {
            logger.error('useJobActions', `❌ [updateJobItem] FAILED:`, error);
            addNotification('alert', getTranslation('warehouse.failedToUpdateJobItem'));
        }
    }, [jobs, setJobs, addNotification, queryClient]);

    const updateJobStatus = useCallback(async (jobId: string, status: WMSJob['status']) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));

        try {
            await wmsJobsService.update(jobId, { status });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        } catch (e) {
            logger.error('useJobActions', 'Failed to update job status in DB', e);
        }
    }, [setJobs, queryClient]);

    const autoAssignJobs = useCallback(async () => {
        try {
            const pendingJobs = jobs
                .filter(j => j.status?.toLowerCase() === 'pending' && !j.assignedTo && j.type !== 'TRANSFER')
                .sort((a, b) => {
                    const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Normal': 2 };
                    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
                });

            if (pendingJobs.length === 0) {
                addNotification('info', 'No pending jobs to assign');
                return;
            }

            const eligibleEmployees = employees.filter(e =>
                e.status?.toLowerCase() === 'active' &&
                (e.siteId === activeSiteId || e.site_id === activeSiteId) &&
                !['dispatcher', 'warehouse_manager', 'super_admin', 'admin'].includes((e.role || '').toLowerCase())
            );

            if (eligibleEmployees.length === 0) {
                addNotification('alert', 'No active staff available for auto-assignment');
                return;
            }

            const currentWorkloads = new Map<string, number>();
            eligibleEmployees.forEach(e => {
                const count = jobAssignments.filter(a =>
                    a.employeeId === e.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                ).length;
                currentWorkloads.set(e.id, count);
            });

            const getRoleMatch = (employee: any, job: WMSJob) => {
                const role = (employee.role || '').toLowerCase();
                const type = (job.type || '').toUpperCase();
                
                if (['manager', 'regional_manager', 'operations_manager'].includes(role)) return true;

                // Specific role restrictions for specialized jobs
                if (type === 'PICK' && !['picker', 'dispatcher', 'warehouse_manager'].includes(role)) return false;
                if (type === 'PACK' && !['packer', 'picker', 'dispatcher', 'warehouse_manager'].includes(role)) return false;
                if (type === 'PUTAWAY' && !['inventory_specialist', 'picker', 'dispatcher', 'warehouse_manager'].includes(role)) return false;
                if (type === 'RECEIVE' && !['receiver', 'inventory_specialist', 'picker', 'dispatcher', 'warehouse_manager'].includes(role)) return false;
                if ((type === 'DRIVER' || type === 'DISPATCH') && !['driver', 'dispatcher', 'warehouse_manager'].includes(role)) return false;
                
                // Allow any active worker for general tasks (COUNT, REPLENISH) if they passed the specific checks above
                return true;
            };

            let assignedCount = 0;
            for (const job of pendingJobs) {
                const candidates = eligibleEmployees
                    .filter(e => getRoleMatch(e, job))
                    .sort((a, b) => (currentWorkloads.get(a.id) || 0) - (currentWorkloads.get(b.id) || 0));

                if (candidates.length > 0) {
                    const bestCandidate = candidates[0];
                    await assignJob(job.id, bestCandidate.id, 'Auto-Assign');
                    currentWorkloads.set(bestCandidate.id, (currentWorkloads.get(bestCandidate.id) || 0) + 1);
                    assignedCount++;
                }
            }

            if (assignedCount > 0) {
                addNotification('success', `Auto-assigned ${assignedCount} jobs successfully`);
            } else {
                addNotification('info', 'No matching staff found for pending jobs');
            }
        } catch (error) {
            logger.error('useJobActions', 'Auto-assign failed:', error);
            addNotification('alert', 'Auto-assignment failed');
        }
    }, [jobs, employees, jobAssignments, assignJob, addNotification]);

    const updateJob = useCallback(async (id: string, updates: Partial<WMSJob>) => {
        try {
            await wmsJobsService.update(id, updates);
            setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
            addNotification('success', 'Job updated');
        } catch (error) {
            logger.error('useJobActions', 'caught error', error as Error);
            addNotification('alert', 'Failed to update job');
        }
    }, [setJobs, addNotification]);

    // Auto-Unassign: only unassigns jobs that were auto-assigned
    const autoUnassignJobs = useCallback(async () => {
        try {
            const autoAssignedJobs = jobs.filter(j => {
                const assignedBy = (j as any).assignedBy || (j as any).assigned_by || '';
                return assignedBy === 'Auto-Assign' && j.assignedTo && j.status !== 'Completed';
            });

            if (autoAssignedJobs.length === 0) {
                addNotification('info', 'No auto-assigned jobs to unassign');
                return;
            }

            let count = 0;
            for (const job of autoAssignedJobs) {
                await unassignJob(job.id);
                count++;
            }

            addNotification('success', `Unassigned ${count} auto-assigned jobs`);
        } catch (error) {
            logger.error('useJobActions', 'Auto-unassign failed:', error);
            addNotification('alert', 'Auto-unassign failed');
        }
    }, [jobs, unassignJob, addNotification]);

    return { assignJob, unassignJob, updateJobItem, updateJobStatus, updateJob, autoAssignJobs, autoUnassignJobs };
};
