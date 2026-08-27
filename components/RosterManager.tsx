import React, { useState, useMemo } from 'react';
import {
    Calendar, Clock, User, Plus, Trash2, Edit2,
    Check, X, ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useRoster } from '../contexts/RosterContext';
import { useStore } from '../contexts/CentralStore';
import { StaffSchedule, Employee } from '../types';
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
        if (!activeSite || !user) return;

        const employee = siteEmployees.find(emp => emp.id === formState.employeeId);
        if (!employee) return;

        if (editingSchedule) {
            await updateSchedule(editingSchedule.id, {
                ...formState,
                employeeName: employee.name
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
                status: 'Scheduled'
            };
            await addSchedule(newSchedule, user.name);
        }
        setIsModalOpen(false);
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
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black dark:text-[#EAE5D9] text-[#1E3F27] flex items-center gap-3 uppercase tracking-tight">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 shadow-inner">
                            <Calendar size={22} />
                        </div>
                        {t('posCommand.rosterManager')}
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">
                        {t('posCommand.shiftAssignment')} • {siteEmployees.length} Staff Stationed at {activeSite.name}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white/80 dark:bg-black/30 p-1.5 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                    <button
                        onClick={() => changeDate(-1)}
                        title="Previous Day"
                        aria-label="Previous Day"
                        className="p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex flex-col items-center min-w-[120px] px-1">
                        <span className="text-xs font-black dark:text-white text-stone-900 uppercase tracking-tight">
                            {new Date(selectedDate).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-bold">
                            {selectedDate}
                        </span>
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        title="Next Day"
                        aria-label="Next Day"
                        className="p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Roster Grid/List */}
            <div className="grid grid-cols-1 gap-3">
                {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="group p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#18201B]/80 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-between hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 transition-all shadow-xs"
                        >
                            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-black/40 flex items-center justify-center border border-[#E2DCCE] dark:border-white/10 overflow-hidden shadow-sm shrink-0">
                                    <User size={20} className="text-stone-400 dark:text-stone-500" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black dark:text-[#EAE5D9] text-[#1E3F27] tracking-tight truncate">{schedule.employeeName}</h4>
                                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Briefcase size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            {schedule.role}
                                        </span>
                                        <span className="text-[9px] text-stone-500 dark:text-stone-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Clock size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => handleOpenModal(schedule)}
                                    title="Edit Shift"
                                    aria-label="Edit Shift"
                                    className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-[#2C5E3B] hover:bg-stone-200 dark:hover:bg-white/10 transition-all shadow-xs"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => deleteSchedule(schedule.id, user?.name || 'Manager')}
                                    title="Delete Shift"
                                    aria-label="Delete Shift"
                                    className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-xs"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-16 text-center bg-stone-50/60 dark:bg-white/[0.01] rounded-3xl border border-dashed border-[#E2DCCE] dark:border-white/10 p-6">
                        <Calendar size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-black uppercase tracking-wider">{t('posCommand.noTasks')}</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">No staff shifts scheduled for {activeSite.name} on this date.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-5 px-6 py-2.5 bg-[#2C5E3B] hover:bg-[#234b2f] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                            {t('common.add')} Shift
                        </button>
                    </div>
                )}

                {/* Action Button at bottom */}
                {daySchedules.length > 0 && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-stone-400 hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-all group font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
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
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        {/* Employee Selection */}
                        <div>
                            <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1.5">
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
                                className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2.5 text-stone-900 dark:text-white text-xs font-bold focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:outline-none transition-all shadow-xs"
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
                                <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1.5">Shift Start</label>
                                <input
                                    type="time"
                                    value={formState.startTime}
                                    onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                                    required
                                    title="Shift Start Time"
                                    className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-stone-900 dark:text-white text-xs font-mono font-bold focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:outline-none transition-all shadow-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1.5">Shift End</label>
                                <input
                                    type="time"
                                    value={formState.endTime}
                                    onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                                    required
                                    title="Shift End Time"
                                    className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-stone-900 dark:text-white text-xs font-mono font-bold focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:outline-none transition-all shadow-xs"
                                />
                            </div>
                        </div>

                        {/* Custom Role */}
                        <div>
                            <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1.5">Assigned Role / Function (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Inbound Receiver, Order Picker, Lead Dispatcher"
                                value={formState.role}
                                onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                                title="Assigned Role"
                                className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-stone-900 dark:text-white text-xs focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:outline-none transition-all shadow-xs"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-1.5">Shift Notes & Instructions</label>
                            <textarea
                                rows={3}
                                value={formState.notes}
                                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                                className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-stone-900 dark:text-white text-xs focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:outline-none transition-all shadow-xs"
                                placeholder="Station assignment, task details or specific notes..."
                                title="Shift Notes"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-[#E2DCCE]/60 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 bg-stone-100 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-black text-stone-600 dark:text-stone-400 uppercase tracking-wider hover:bg-stone-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-[#2C5E3B] hover:bg-[#234b2f] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs"
                        >
                            Save Shift
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

