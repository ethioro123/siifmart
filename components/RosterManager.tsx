import React, { useState, useMemo } from 'react';
import {
    Calendar, Clock, User, Plus, Trash2, Edit2,
    ChevronLeft, ChevronRight, Briefcase, Loader2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useRoster } from '../contexts/RosterContext';
import { useStore } from '../contexts/CentralStore';
import { StaffSchedule } from '../types';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

interface RosterManagerProps {
    className?: string;
}

export default function RosterManager({ className = "" }: RosterManagerProps) {
    const {
        employees,
        activeSite
    } = useData();
    const {
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule
    } = useRoster();
    const { user } = useStore();
    const { t, language } = useLanguage();

    const locale = useMemo(() => {
        if (language === 'am') return 'am-ET';
        if (language === 'or') return 'om-ET';
        return 'en-US';
    }, [language]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);

    // New Schedule Form State
    const [formState, setFormState] = useState({
        employeeId: '',
        startTime: '08:00',
        endTime: '17:00',
        role: '',
        notes: ''
    });

    // Strictly appointed staff for the active site
    const siteEmployees = useMemo(() => {
        if (!activeSite) return [];
        return employees.filter(e => e.siteId === activeSite.id || (e as any).site_id === activeSite.id);
    }, [employees, activeSite]);

    // Strictly filter day schedules to active site and appointed staff
    const daySchedules = useMemo(() => {
        if (!activeSite) return [];
        const validEmployeeIds = new Set(siteEmployees.map(e => e.id));
        return schedules.filter(s =>
            s.date === selectedDate &&
            (s.siteId === activeSite.id || validEmployeeIds.has(s.employeeId))
        );
    }, [schedules, selectedDate, activeSite, siteEmployees]);

    const handleOpenModal = (schedule?: StaffSchedule) => {
        setTimeError(null);
        if (schedule) {
            setEditingSchedule(schedule);
            setFormState({
                employeeId: schedule.employeeId,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                role: schedule.role,
                notes: schedule.notes || ''
            });
        } else {
            setEditingSchedule(null);
            setFormState({
                employeeId: siteEmployees[0]?.id || '',
                startTime: '08:00',
                endTime: '17:00',
                role: siteEmployees[0]?.role ? siteEmployees[0].role.replace('_', ' ') : '',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSite || !user || isSubmitting) return;

        const employee = siteEmployees.find(emp => emp.id === formState.employeeId);
        if (!employee) {
            setTimeError('Please select an appointed staff member');
            return;
        }

        if (formState.startTime >= formState.endTime) {
            setTimeError('Shift end time must be after shift start time');
            return;
        }

        setTimeError(null);
        setIsSubmitting(true);

        try {
            let success = false;
            if (editingSchedule) {
                success = await updateSchedule(editingSchedule.id, {
                    ...formState,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    siteId: activeSite.id,
                    countryCode: activeSite.country,
                    regionCode: activeSite.region_code || (activeSite as any).regionCode
                }, user.name);
            } else {
                const newSchedule: StaffSchedule = {
                    id: crypto.randomUUID(),
                    siteId: activeSite.id,
                    employeeId: formState.employeeId,
                    employeeName: employee.name,
                    date: selectedDate,
                    startTime: formState.startTime,
                    endTime: formState.endTime,
                    role: formState.role || employee.role.replace('_', ' '),
                    notes: formState.notes,
                    status: 'Scheduled',
                    countryCode: activeSite.country,
                    country_code: activeSite.country,
                    regionCode: activeSite.region_code || (activeSite as any).regionCode,
                    region_code: activeSite.region_code || (activeSite as any).regionCode
                };
                success = await addSchedule(newSchedule, user.name);
            }

            if (success) {
                setIsModalOpen(false);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (schedule: StaffSchedule) => {
        if (!window.confirm(`Delete shift for ${schedule.employeeName} (${schedule.startTime} - ${schedule.endTime})?`)) {
            return;
        }
        await deleteSchedule(schedule.id, user?.name || 'Manager');
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    if (!activeSite) return null;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header with Date Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
                            {t('posCommand.rosterManager')}
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {t('posCommand.shiftAssignment')} • {siteEmployees.length} Staff at {activeSite.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] shadow-xs self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        title="Previous Day"
                        aria-label="Previous Day"
                        className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg transition-colors text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex flex-col items-center min-w-[110px] px-2">
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            {new Date(selectedDate).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-mono font-medium">
                            {selectedDate}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => changeDate(1)}
                        title="Next Day"
                        aria-label="Next Day"
                        className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg transition-colors text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Roster Grid/List */}
            <div className="space-y-3">
                {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="group p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)]/30 transition-all shadow-xs"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                                    <User size={18} className="text-[var(--theme-text-secondary)]" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{schedule.employeeName}</h4>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] flex items-center gap-1">
                                            <Briefcase size={12} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                            {schedule.role}
                                        </span>
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono flex items-center gap-1">
                                            <Clock size={12} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleOpenModal(schedule)}
                                    title="Edit Shift"
                                    aria-label="Edit Shift"
                                    className="p-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(schedule)}
                                    title="Delete Shift"
                                    aria-label="Delete Shift"
                                    className="p-2 rounded-xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] transition-all cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-12 text-center bg-[var(--theme-bg-subtle)] rounded-2xl border border-dashed border-[var(--theme-border)] p-6">
                        <Calendar size={32} className="mx-auto text-[var(--theme-text-secondary)] opacity-40 mb-2" />
                        <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{t('posCommand.noTasks')}</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">No staff shifts scheduled for {activeSite.name} on this date.</p>
                        <button
                            type="button"
                            onClick={() => handleOpenModal()}
                            className="mt-4 px-4 py-2 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                            {t('common.add')} Shift
                        </button>
                    </div>
                )}

                {/* Action Button at bottom */}
                {daySchedules.length > 0 && (
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] dark:hover:text-[var(--theme-accent)] hover:border-[var(--theme-border-focus)]/40 dark:hover:border-[var(--theme-border-focus)]/40 transition-all cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Schedule Shift for {activeSite.name}</span>
                    </button>
                )}
            </div>

            {/* Allocation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSchedule ? "Modify Shift Schedule" : "Schedule Staff Shift"}
                variant="side"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3.5">
                        {/* Employee Selection */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5">
                                Appointed Staff Member ({siteEmployees.length} at {activeSite.name})
                            </label>
                            <select
                                value={formState.employeeId}
                                onChange={(e) => {
                                    const empId = e.target.value;
                                    const emp = siteEmployees.find(p => p.id === empId);
                                    setFormState(prev => ({
                                        ...prev,
                                        employeeId: empId,
                                        role: emp ? emp.role.replace('_', ' ') : prev.role
                                    }));
                                }}
                                required
                                title="Select Staff Member"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                            >
                                <option value="">Select Appointed Staff Member...</option>
                                {siteEmployees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role.replace('_', ' ')})</option>
                                ))}
                            </select>
                        </div>

                        {/* Time Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5">Shift Start</label>
                                <input
                                    type="time"
                                    value={formState.startTime}
                                    onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                                    required
                                    title="Shift Start Time"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs font-mono text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5">Shift End</label>
                                <input
                                    type="time"
                                    value={formState.endTime}
                                    onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                                    required
                                    title="Shift End Time"
                                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs font-mono text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Custom Role */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5">Assigned Role / Function (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Inbound Receiver, Order Picker, Lead Dispatcher"
                                value={formState.role}
                                onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                                title="Assigned Role"
                                className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--theme-text-secondary)] mb-1.5">Shift Notes & Instructions</label>
                            <textarea
                                rows={3}
                                value={formState.notes}
                                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-border-focus)] focus:ring-2 focus:ring-[#0071E3]/20 focus:outline-none transition-all"
                                placeholder="Station assignment, task details or specific notes..."
                                title="Shift Notes"
                            />
                        </div>

                        {/* Error Alert */}
                        {timeError && (
                            <div className="p-3 rounded-xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-medium">
                                {timeError}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                            className="flex-1 h-10 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-50 border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-10 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Shift</span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
