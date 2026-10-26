import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { WMSJob } from '../types';
import { pickingExecutionService } from '../services/picking-execution.service';
import { calculateWarehousePoints } from '../utils/warehouseGamification';

interface Deps {
    setJobs: Dispatch<SetStateAction<WMSJob[]>>;
    queryClient: QueryClient;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
}
/** The server confirms stock, assignment, parent and PACK together before UI success. */
export function useCompletePickJob({ setJobs, queryClient, addNotification }: Deps) {
    return useCallback(async (jobId: string) => {
        const { job, pack } = await pickingExecutionService.complete(jobId);
        setJobs(previous => {
            const next = previous.map(row => row.id === job.id ? job : row);
            return pack && !next.some(row => row.id === pack.id) ? [pack, ...next] : next;
        });
        for (const key of ['jobs', 'job-assignments', 'products', 'transfers', 'sales']) {
            void queryClient.invalidateQueries({ queryKey: key === 'products' ? [key, job.siteId] : [key] });
        }
        const lines = job.lineItems || [];
        const shortCount = lines.filter(line => line.status === 'Short').length;
        const accuracy = lines.length ? Math.round((lines.length - shortCount) / lines.length * 100) : 100;
        const pointsResult = calculateWarehousePoints(job, undefined, accuracy);
        window.dispatchEvent(new CustomEvent('fulfillment:job-completed', { detail: {
            job, userId: job.completedBy, employeeId: job.completedBy, pointsResult, accuracy
        } }));
        addNotification('success', pack
            ? 'Picking completed. Stock deducted and packing job created.'
            : 'Picking completed with no stock picked. No packing job was created; the order requires supervisor review.');
        return { points: 0, breakdown: [], pendingConfirmation: true };
    }, [setJobs, queryClient, addNotification]);
}
