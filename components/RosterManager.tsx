
import React, { useState, useMemo } from 'react';
import {
    Calendar, Clock, User, Plus, Trash2, Edit2,
    Check, X, ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { StaffSchedule, Employee } from '../types';
import Modal from './Modal';

interface RosterManagerProps {
    className?: string;
}

export default function RosterManager({ className = "" }: RosterManagerProps) {
    const {
        employees,
        activeSite,
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule
    } = useData();
    const { user } = useStore();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null);

    // New Schedule Form State
    const [formState, setFormState] = useState({
        employeeId: '',
        startTime: '09:00',
        endTime: '17:00',
        role: '',
        notes: ''
    });

    const daySchedules = useMemo(() => {
        return schedules.filter(s => s.date === selectedDate);
    }, [schedules, selectedDate]);

    const siteEmployees = useMemo(() => {
        if (!activeSite) return [];
        return employees.filter(e => e.siteId === activeSite.id || (e as any).site_id === activeSite.id);
    }, [employees, activeSite]);

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
                employeeId: '',
                startTime: '09:00',
                endTime: '17:00',
                role: '',
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
                role: formState.role || employee.role,
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
                    <h3 className="text-xl font-black dark:text-white text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                        <div className="p-2.5 rounded-xl dark:bg-cyber-primary/10 bg-cyber-primary/5 border dark:border-cyber-primary/20 border-black/5 shadow-inner">
                            <Calendar size={22} className="text-cyber-primary" />
                        </div>
                        Personnel E-Rostering
                    </h3>
                    <p className="dark:text-gray-500 text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-[0.2em] opacity-60">
                        Shift Orchestration & Allocation Matrix
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => changeDate(-1)}
                        title="Previous Day"
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col items-center min-w-[120px]">
                        <span className="text-xs font-black dark:text-white text-slate-900 uppercase">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                        <span className="text-[10px] dark:text-cyber-primary text-cyber-primary font-mono font-bold">
                            {selectedDate}
                        </span>
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        title="Next Day"
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Roster Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="group p-5 rounded-[2rem] dark:bg-white/[0.03] bg-white border dark:border-white/5 border-black/[0.03] flex items-center justify-between hover:bg-white/[0.05] transition-all"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl dark:bg-black/40 bg-slate-50 flex items-center justify-center border dark:border-white/10 border-black/5 overflow-hidden shadow-xl">
                                    <User size={24} className="dark:text-white/20 text-slate-300" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black dark:text-white text-slate-900 tracking-tight">{schedule.employeeName}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[9px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <Briefcase size={10} className="text-cyber-primary" />
                                            {schedule.role}
                                        </span>
                                        <span className="text-[9px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={10} className="text-cyber-primary" />
                                            {schedule.startTime} - {schedule.endTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(schedule)}
                                    title="Edit Shift"
                                    className="p-2.5 rounded-xl dark:bg-white/5 bg-slate-100 dark:text-gray-400 text-slate-500 hover:text-cyber-primary hover:dark:bg-white/10 transition-all shadow-sm"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => deleteSchedule(schedule.id, user?.name || 'Manager')}
                                    title="Delete Shift"
                                    className="p-2.5 rounded-xl dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-500 hover:bg-red-500/20 transition-all shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center dark:bg-white/[0.01] bg-slate-50/50 rounded-[3rem] border border-dashed dark:border-white/5 border-black/5">
                        <Calendar size={48} className="mx-auto text-gray-400/20 mb-4" />
                        <p className="text-xs dark:text-gray-600 text-slate-400 font-bold uppercase tracking-[0.2em]">No Operations Scheduled for this Log</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-6 px-8 py-3 dark:bg-cyber-primary/10 bg-cyber-primary/5 dark:text-cyber-primary text-cyber-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-cyber-primary/20 hover:bg-cyber-primary/20 transition-all"
                        >
                            Allocate First Node
                        </button>
                    </div>
                )}

                {/* Action Button at bottom */}
                {daySchedules.length > 0 && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] border-2 border-dashed dark:border-white/5 border-black/5 dark:text-gray-500 text-slate-400 hover:dark:border-cyber-primary/40 hover:border-cyber-primary/30 hover:text-cyber-primary transition-all group"
                    >
                        <Plus size={20} className="group-hover:scale-125 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add Shift Node</span>
                    </button>
                )}
            </div>

            {/* Allocation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingSchedule ? "Modify Shift Allocation" : "New Shift Allocation"}
                variant="side"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Employee Selection */}
                        <div>
                            <label className="block text-[10px] font-black dark:text-gray-500 text-slate-400 uppercase tracking-widest mb-2">Personnel Node</label>
                            <select
                                value={formState.employeeId}
                                onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                                required
                                title="Select Personnel Node"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-cyber-primary transition-all"
                            >
                                <option value="">Select Employee...</option>
                                {siteEmployees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                ))}
                            </select>
                        </div>

                        {/* Time Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black dark:text-gray-500 text-slate-400 uppercase tracking-widest mb-2">Activation Time</label>
                                <input
                                    type="time"
                                    value={formState.startTime}
                                    onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                                    required
                                    title="Activation Time"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-cyber-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black dark:text-gray-500 text-slate-400 uppercase tracking-widest mb-2">Deactivation Time</label>
                                <input
                                    type="time"
                                    value={formState.endTime}
                                    onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                                    required
                                    title="Deactivation Time"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-cyber-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Custom Role */}
                        <div>
                            <label className="block text-[10px] font-black dark:text-gray-500 text-slate-400 uppercase tracking-widest mb-2">Operational Role (Optional)</label>
                            <input
                                type="text"
                                placeholder="Leave blank to use default role"
                                value={formState.role}
                                onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                                title="Operational Role"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-cyber-primary transition-all"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-[10px] font-black dark:text-gray-500 text-slate-400 uppercase tracking-widest mb-2">Operational Notes</label>
                            <textarea
                                rows={3}
                                value={formState.notes}
                                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-cyber-primary transition-all"
                                placeholder="Mission parameters or specific instructions..."
                                title="Operational Notes"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Abort Mission
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-cyber-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyber-primary/90 transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                        >
                            Confirm Allocation
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
