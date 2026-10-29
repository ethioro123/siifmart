import React from 'react';
import { ClipboardList, XCircle } from 'lucide-react';
import { Employee, EmployeeTask } from '../../types';
import { formatDateTime } from '../../utils/formatting';

interface GlobalTaskQueueProps {
   tasks: EmployeeTask[];
   employees: Employee[];
   setIsTaskQueueOpen: (open: boolean) => void;
}

export default function GlobalTaskQueue({ tasks, employees, setIsTaskQueueOpen }: GlobalTaskQueueProps) {
   const activeTasks = tasks.filter(t => t.status !== 'Completed');

   return (
      <div className="animate-in slide-in-from-top duration-300">
         <div className="bg-[var(--theme-bg-card)] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                  <ClipboardList size={18} className="text-cyber-primary" />
                  Global Task Board
               </h3>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold px-2 py-1 bg-[var(--theme-bg-subtle)] rounded-lg border border-[var(--theme-border-subtle)]">
                     {activeTasks.length} Active
                  </span>
                  <button
                     onClick={() => setIsTaskQueueOpen(false)}
                     className="p-1 hover:bg-[var(--theme-bg-card-hover)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
                     title="Close Task Board"
                     aria-label="Close Task Board"
                  >
                     <XCircle size={20} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-2">
               {['High', 'Medium', 'Low'].map(priority => {
                  const priorityTasks = activeTasks.filter(t => t.priority === priority);
                  const color = priority === 'High' ? 'text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)]' :
                     priority === 'Medium' ? 'text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)]' :
                        'text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)] bg-[var(--theme-status-info-bg)]';

                  return (
                     <div key={priority} className={`rounded-xl border ${color.split(' ')[1]} ${color.split(' ')[2]} p-4 min-w-[250px]`}>
                        <div className="flex items-center justify-between mb-3 border-b border-[var(--theme-border-subtle)] pb-2">
                           <span className={`text-xs font-bold uppercase ${priority === 'High' ? 'text-[var(--theme-status-danger-text)]' : priority === 'Medium' ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-status-info-text)]'}`}>
                              {priority} Priority
                           </span>
                           <span className="text-xs bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full text-[var(--theme-text-muted)]">{priorityTasks.length}</span>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                           {priorityTasks.length === 0 ? (
                              <div className="text-center py-4 text-xs text-[var(--theme-text-secondary)] italic">No tasks</div>
                           ) : (
                              priorityTasks.map(task => (
                                 <div key={task.id} className="bg-[var(--theme-bg-card)] p-3 rounded-lg border border-[var(--theme-border-subtle)] hover:border-[var(--theme-border)] transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                       <span className="text-sm font-medium text-gray-200 line-clamp-1">{task.title}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-[var(--theme-text-secondary)]">
                                       <span>{employees.find(e => e.id === task.assignedTo)?.name || 'Unassigned'}</span>
                                       <span className="text-gray-600">{formatDateTime(task.dueDate).split(',')[0]}</span>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
}
