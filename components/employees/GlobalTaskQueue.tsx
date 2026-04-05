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
         <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-white flex items-center gap-2">
                  <ClipboardList size={18} className="text-cyber-primary" />
                  Global Task Board
               </h3>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                     {activeTasks.length} Active
                  </span>
                  <button
                     onClick={() => setIsTaskQueueOpen(false)}
                     className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
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
                  const color = priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/5' :
                     priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' :
                        'text-blue-400 border-blue-500/30 bg-blue-500/5';

                  return (
                     <div key={priority} className={`rounded-xl border ${color.split(' ')[1]} ${color.split(' ')[2]} p-4 min-w-[250px]`}>
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                           <span className={`text-xs font-bold uppercase ${priority === 'High' ? 'text-red-400' : priority === 'Medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                              {priority} Priority
                           </span>
                           <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full text-white/50">{priorityTasks.length}</span>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                           {priorityTasks.length === 0 ? (
                              <div className="text-center py-4 text-xs text-gray-500 italic">No tasks</div>
                           ) : (
                              priorityTasks.map(task => (
                                 <div key={task.id} className="bg-black/40 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                       <span className="text-sm font-medium text-gray-200 line-clamp-1">{task.title}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
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
