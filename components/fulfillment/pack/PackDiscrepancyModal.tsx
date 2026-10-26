import React from 'react';
import type { WMSJob, User } from '../../../types';
import { FloorDiscrepancyModal } from '../discrepancies/FloorDiscrepancyModal';
interface Props {
    isOpen: boolean; onClose: () => void; job: WMSJob; currentUser: User | null;
    initialLine?: number; initialCount?: number;
    wmsJobsService?: unknown;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    refreshData: () => Promise<void>;
    onAcceptCount?: (items: unknown[]) => void;
}
export function PackDiscrepancyModal({ isOpen, onClose, job, currentUser, addNotification, refreshData, initialLine, initialCount }: Props) {
    return <FloorDiscrepancyModal initialLine={initialLine} initialCount={initialCount} isOpen={isOpen} onClose={onClose} job={job} user={currentUser} addNotification={addNotification} onSaved={refreshData} />;
}
