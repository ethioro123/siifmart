import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { StaffSchedule, Employee } from '../../types';
import { Clock, User, Sun, Sunset, Moon, XCircle, AlertCircle } from 'lucide-react';
import { calculateShiftHours, SHIFT_PRESETS } from '../../utils/shiftPlanner';

interface ShiftDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    date: string;
    schedule: StaffSchedule | null;
    onSave: (
        employee: Employee,
        date: string,
        details: {
            startTime: string;
            endTime: string;
            role: string;
            notes?: string;
            status?: 'Scheduled' | 'Confirmed' | 'Cancelled';
        }
    ) => void;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
    isOpen,
    onClose,
    employee,
    date,
    schedule,
    onSave
}) => {
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('16:00');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState<'Scheduled' | 'Confirmed' | 'Cancelled'>('Scheduled');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (schedule) {
            setStartTime(schedule.startTime || '08:00');
            setEndTime(schedule.endTime || '16:00');
            setRole(schedule.role || employee?.role || '');
            setStatus(schedule.status as any || 'Scheduled');
            setNotes(schedule.notes || '');
        } else {
            setStartTime('08:00');
            setEndTime('16:00');
            setRole(employee?.role || '');
            setStatus('Scheduled');
            setNotes('');
        }
    }, [schedule, employee, isOpen]);

    if (!employee) return null;

    const hours = calculateShiftHours(startTime, endTime);

    const applyPreset = (presetKey: 'M' | 'E' | 'N' | 'O') => {
        const p = SHIFT_PRESETS[presetKey];
        setStartTime(p.startTime);
        setEndTime(p.endTime);
        if (presetKey === 'O') {
            setStatus('Cancelled');
        } else if (status === 'Cancelled') {
            setStatus('Scheduled');
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(employee, date, {
            startTime,
            endTime,
            role,
            notes,
            status
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Shift Details & Assignment"
            size="md"
        >
            <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Employee Header */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-100/70 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10">
                    <img
                        src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                            {employee.name}
                        </p>
                        <p className="text-xs text-stone-500 capitalize">
                            {employee.department || 'Operations'} • {date}
                        </p>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-[var(--theme-status-success-bg)] dark:bg-emerald-950/20 text-[var(--theme-primary)] dark:text-[#A9CBA2] border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] text-xs font-bold font-mono">
                        {status === 'Cancelled' ? '0h' : `${hours}h`}
                    </div>
                </div>

                {/* Preset Quick Buttons */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Quick Preset
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => applyPreset('M')}
                            className="p-2 rounded-xl border border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-xs font-bold flex flex-col items-center gap-1 bg-[var(--theme-status-warning-bg)] cursor-pointer"
                        >
                            <Sun size={14} />
                            <span>Morning</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('E')}
                            className="p-2 rounded-xl border border-orange-300 dark:border-orange-700/50 bg-orange-500/10 text-orange-800 dark:text-orange-200 text-xs font-bold flex flex-col items-center gap-1 hover:bg-orange-500/20 cursor-pointer"
                        >
                            <Sunset size={14} />
                            <span>Evening</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('N')}
                            className="p-2 rounded-xl border border-indigo-300 dark:border-indigo-700/50 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 text-xs font-bold flex flex-col items-center gap-1 hover:bg-indigo-500/20 cursor-pointer"
                        >
                            <Moon size={14} />
                            <span>Night</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset('O')}
                            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-white/5 text-stone-500 text-xs font-bold flex flex-col items-center gap-1 hover:bg-stone-200 dark:hover:bg-white/10 cursor-pointer"
                        >
                            <XCircle size={14} />
                            <span>Day Off</span>
                        </button>
                    </div>
                </div>

                {/* Custom Time Fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-1 flex items-center gap-1">
                            <Clock size={12} className="text-[var(--theme-primary)]" /> Start Time
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-mono font-bold text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-1 flex items-center gap-1">
                            <Clock size={12} className="text-[var(--theme-primary)]" /> End Time
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-mono font-bold text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20"
                            required
                        />
                    </div>
                </div>

                {/* Role and Status */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-1 block">
                            Assigned Shift Role
                        </label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Cashier, Dispatcher"
                            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-medium text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-1 block">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20"
                        >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled (Off)</option>
                        </select>
                    </div>
                </div>

                {/* Shift Notes */}
                <div>
                    <label className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] mb-1 block">
                        Shift Instructions / Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Opening register 1, check cold storage temperature..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-medium text-[#1E3F27] dark:text-[#EAE5D9] focus:outline-none focus:ring-2 focus:ring-[#2C5E3B]/20 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2DCCE] dark:border-white/10">
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
                        Save Shift
                    </button>
                </div>
            </form>
        </Modal>
    );
};
