import React, { useState } from 'react';
import Modal from '../../Modal';
import { Calendar, AlertCircle } from 'lucide-react';
import { LeaveRequest } from '../../../utils/employeeProfileData';

interface RequestTimeOffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const RequestTimeOffModal: React.FC<RequestTimeOffModalProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const today = new Date().toISOString().split('T')[0];
    const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Annual Leave');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reason, setReason] = useState('');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            type: leaveType,
            startDate,
            endDate,
            days,
            reason: reason.trim() || 'Personal request'
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Time Off"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] mb-1 block">
                        Leave Type
                    </label>
                    <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[var(--theme-border)] dark:border-white/10 rounded-xl text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20"
                    >
                        <option value="Annual Leave">Annual Vacation Leave</option>
                        <option value="Sick Leave">Sick / Medical Leave</option>
                        <option value="Emergency">Family / Emergency Leave</option>
                        <option value="Unpaid">Unpaid Personal Leave</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] mb-1 flex items-center gap-1">
                            <Calendar size={12} className="text-[var(--theme-primary)]" /> Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={today}
                            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[var(--theme-border)] dark:border-white/10 rounded-xl text-xs font-mono font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] mb-1 flex items-center gap-1">
                            <Calendar size={12} className="text-[var(--theme-primary)]" /> End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[var(--theme-border)] dark:border-white/10 rounded-xl text-xs font-mono font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20"
                            required
                        />
                    </div>
                </div>

                <div className="p-3 bg-[var(--theme-status-success-bg)] dark:bg-emerald-950/20 border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] rounded-xl text-xs font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] flex items-center justify-between">
                    <span>Duration:</span>
                    <span className="font-mono text-sm">{days} {days === 1 ? 'Day' : 'Days'}</span>
                </div>

                <div>
                    <label className="text-xs font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] mb-1 block">
                        Reason / Notes
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Briefly state reason for leave..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[var(--theme-border)] dark:border-white/10 rounded-xl text-xs font-medium text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--theme-border)] dark:border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="woody-btn-primary px-5 py-2 text-xs font-bold rounded-xl cursor-pointer"
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </Modal>
    );
};
