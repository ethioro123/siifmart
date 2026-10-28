import React from 'react';
import { ClipboardList, Plus, CheckCircle } from 'lucide-react';
import { EmployeeTask } from '../../../types';

interface TasksTabProps {
    canManageEmployees: boolean;
    isOwnProfile: boolean;
    employeeTasks: EmployeeTask[];
    newTaskTitle: string;
    setNewTaskTitle: (value: string) => void;
    newTaskPriority: 'Low' | 'Medium' | 'High';
    setNewTaskPriority: (value: 'Low' | 'Medium' | 'High') => void;
    handleAddTask: () => void | Promise<void>;
    handleCompleteTask: (id: string) => void | Promise<void>;
}

export default function TasksTab({
    canManageEmployees,
    isOwnProfile,
    employeeTasks,
    newTaskTitle,
    setNewTaskTitle,
    newTaskPriority,
    setNewTaskPriority,
    handleAddTask,
    handleCompleteTask
}: TasksTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in">
            {(canManageEmployees || isOwnProfile) && (
                <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <div className="flex-1 relative">
                        <ClipboardList className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" size={16} />
                        <input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
                            placeholder="Assign or note a new task..."
                            className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-[var(--theme-accent)] transition-colors text-sm"
                        />
                    </div>
                    <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] text-xs font-semibold cursor-pointer"
                        title="Select Task Priority"
                    >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                    </select>
                    <button
                        onClick={handleAddTask}
                        className="h-11 px-5 rounded-xl bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent)]/90 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                    >
                        <Plus size={16} /> Add Task
                    </button>
                </div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {employeeTasks.length > 0 ? (
                    employeeTasks.map(task => (
                        <div key={task.id} className="group flex items-center justify-between bg-[var(--theme-bg-card)] p-4 rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 transition-colors shadow-xs">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-3 h-3 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                                        task.priority === 'Medium' ? 'bg-amber-500' : 'bg-sky-500'
                                        }`}
                                    role="status"
                                    aria-label={`${task.priority} priority`}
                                />
                                <div>
                                    <p className={`text-sm font-semibold transition-colors ${task.status === 'Completed' ? 'text-[var(--theme-text-muted)] line-through' : 'text-[var(--theme-text-primary)]'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[11px] uppercase font-semibold tracking-wider text-[var(--theme-text-secondary)]">
                                            Due: {task.dueDate}
                                        </span>
                                        {task.status === 'Completed' && (
                                            <span className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle size={12} /> Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {task.status !== 'Completed' && (
                                <button
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="p-2.5 bg-[var(--theme-bg-subtle)] hover:bg-emerald-500/10 text-[var(--theme-text-secondary)] hover:text-emerald-500 rounded-xl transition-colors border border-[var(--theme-border)] hover:border-emerald-500/30 cursor-pointer"
                                    title="Complete Task"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)]">
                        <ClipboardList size={40} className="mx-auto mb-3 text-[var(--theme-text-muted)]" />
                        <p className="text-[var(--theme-text-secondary)] font-semibold text-sm">No tasks assigned yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
