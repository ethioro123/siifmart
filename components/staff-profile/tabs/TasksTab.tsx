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
    handleAddTask: () => void;
    handleCompleteTask: (id: string) => void;
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
                <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                    <div className="flex-1 relative">
                        <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Assign or note a new task..."
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white outline-none focus:border-cyber-primary transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-cyber-primary"
                        title="Select Task Priority"
                    >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                    </select>
                    <button
                        onClick={handleAddTask}
                        className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-black hover:bg-cyber-accent transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Add Task
                    </button>
                </div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {employeeTasks.length > 0 ? (
                    employeeTasks.map(task => (
                        <div key={task.id} className="group flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-3 h-3 rounded-full shadow-lg ${task.priority === 'High' ? 'bg-red-500' :
                                        task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`}
                                    role="status"
                                    aria-label={`${task.priority} priority`}
                                ></div>
                                <div>
                                    <p className={`text-base font-bold transition-all ${task.status === 'Completed' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                                            Due: {task.dueDate}
                                        </span>
                                        {task.status === 'Completed' && (
                                            <span className="text-[10px] text-green-600 dark:text-green-500 font-black uppercase flex items-center gap-1">
                                                <CheckCircle size={10} /> Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {task.status !== 'Completed' && (
                                <button
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-green-100 dark:hover:bg-green-500/20 text-gray-500 hover:text-green-600 dark:hover:text-green-500 rounded-xl transition-all border border-transparent hover:border-green-200 dark:hover:border-green-500/20"
                                    title="Complete Task"
                                >
                                    <CheckCircle size={20} />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <ClipboardList size={48} className="mx-auto mb-4 text-gray-300 dark:text-white/10" />
                        <p className="text-gray-500 font-bold">No tasks assigned yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
