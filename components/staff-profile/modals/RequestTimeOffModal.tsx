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
                    <label className="text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">
                        Leave Type
                    </label>
                    <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as any)}
                        className="w-full min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
                    >
                        <option value="Annual Leave">Annual Vacation Leave</option>
                        <option value="Sick Leave">Sick / Medical Leave</option>
                        <option value="Emergency">Family / Emergency Leave</option>
                        <option value="Unpaid">Unpaid Personal Leave</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 flex items-center gap-1.5">
                            <Calendar size={13} className="text-[var(--theme-accent)]" /> Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={today}
                            className="w-full min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 flex items-center gap-1.5">
                            <Calendar size={13} className="text-[var(--theme-accent)]" /> End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="w-full min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-mono font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] transition-colors"
                            required
                        />
                    </div>
                </div>

                <div className="p-3.5 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-xl text-xs font-semibold text-[var(--theme-status-success-text)] flex items-center justify-between">
                    <span>Duration:</span>
                    <span className="font-mono text-sm font-bold tabular-nums">{days} {days === 1 ? 'Day' : 'Days'}</span>
                </div>

                <div>
                    <label className="text-xs font-semibold text-[var(--theme-text-secondary)] mb-1.5 block">
                        Reason / Notes
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Briefly state reason for leave..."
                        rows={3}
                        className="w-full p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] transition-colors resize-none placeholder:text-[var(--theme-text-muted)]"
                    />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--theme-border-subtle)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 px-4 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="min-h-11 px-5 text-xs font-semibold rounded-xl bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-text-primary)] shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </Modal>
    );
};
