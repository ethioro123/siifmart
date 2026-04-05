import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Clock, Trash2, Layout, CheckSquare, ListTodo, Plus, Send, Calendar, UserPlus, Activity } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatting';

interface ActivityCenterProps {
   notifRef: React.RefObject<HTMLDivElement | null>;
   isNotifOpen: boolean;
   setIsNotifOpen: (val: boolean) => void;
   totalAlerts: number;
   notifTab: string;
   setNotifTab: (tab: any) => void;
   filteredNotifications: any[];
   myTasks: any[];
   handleClearAll: () => void;
   handleClearSingle: (id: string) => void;
   tasksAssignedToMe: any[];
   handleTaskStatusChange: (id: string, status: 'Pending' | 'In-Progress' | 'Completed') => void;
   tasksICreated: any[];
   handleMarkAllRead: () => void;
   showQuickAssign: boolean;
   setShowQuickAssign: (val: boolean) => void;
   quickTaskTitle: string;
   setQuickTaskTitle: (val: string) => void;
   quickTaskPriority: 'High' | 'Medium' | 'Low';
   setQuickTaskPriority: (val: 'High' | 'Medium' | 'Low') => void;
   quickTaskAssignee: string;
   setQuickTaskAssignee: (val: string) => void;
   handleQuickAssign: () => void;
   visibleEmployees: any[];
}

export function ActivityCenter({
   notifRef,
   isNotifOpen,
   setIsNotifOpen,
   totalAlerts,
   notifTab,
   setNotifTab,
   filteredNotifications,
   myTasks,
   handleClearAll,
   handleClearSingle,
   tasksAssignedToMe,
   handleTaskStatusChange,
   tasksICreated,
   handleMarkAllRead,
   showQuickAssign,
   setShowQuickAssign,
   quickTaskTitle,
   setQuickTaskTitle,
   quickTaskPriority,
   setQuickTaskPriority,
   quickTaskAssignee,
   setQuickTaskAssignee,
   handleQuickAssign,
   visibleEmployees
}: ActivityCenterProps) {
   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   const parseTime = (val: any) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return d;
   };

   const formatExactTime = (val: any) => {
      const d = parseTime(val);
      if (!d) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   };

   const getSafeTime = (item: any) => item.timestamp || item.created_at || item.createdAt;

   const displayedNotifications = filteredNotifications;
   return (
      <div className="relative" ref={notifRef}>
         <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2 rounded-full border transition-all duration-300 relative group ${isNotifOpen ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
            aria-label="Notifications"
         >
            <Bell size={18} className={isNotifOpen ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'} />
            {totalAlerts > 0 && (
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-cyber-dark shadow-lg animate-pulse">
                  {totalAlerts}
               </span>
            )}
         </button>

         {isNotifOpen && (
            <div
               className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[3.75rem] sm:top-full mt-0 sm:mt-2 w-auto sm:w-96 max-w-[400px] bg-cyber-gray border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[150] animate-in fade-in slide-in-from-top-4 overflow-hidden backdrop-blur-xl"
               onClick={(e) => e.stopPropagation()}
            >
                  {/* Header */}
                  <div className="p-4 border-b border-white/5 bg-black/20">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <Layout size={16} className="text-cyber-primary" />
                           <h4 className="text-sm font-black text-white uppercase tracking-widest">Activity Center</h4>
                        </div>
                        <div className="flex items-center gap-3">
                           {notifTab === 'all' && filteredNotifications.length > 0 && (
                              <>
                                 <button
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] font-bold text-cyber-primary hover:text-cyber-accent uppercase transition-colors"
                                 >
                                    Mark all read
                                 </button>
                                 <div className="w-px h-3 bg-white/10" />
                                 <button
                                    onClick={handleClearAll}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase transition-colors"
                                 >
                                    Clear all
                                 </button>
                              </>
                           )}
                           <button 
                              onClick={() => setIsNotifOpen(false)} 
                              className="text-gray-500 hover:text-white"
                              title="Close Activity Center"
                              aria-label="Close"
                           >
                              <X size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Tabs */}
                     <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                        <button
                           onClick={() => setNotifTab('all')}
                           className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${notifTab === 'all' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                           <Bell size={12} />
                           Alerts
                           {filteredNotifications.length > 0 && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${notifTab === 'all' ? 'bg-black/20' : 'bg-red-500 text-white'}`}>
                                 {filteredNotifications.length}
                              </span>
                           )}
                        </button>
                        <button
                           onClick={() => setNotifTab('tasks')}
                           className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${notifTab === 'tasks' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                           <CheckSquare size={12} />
                           Tasks
                           {tasksAssignedToMe.filter(t => t.status === 'Pending').length > 0 && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${notifTab === 'tasks' ? 'bg-black/20' : 'bg-blue-500 text-white'}`}>
                                 {tasksAssignedToMe.filter(t => t.status === 'Pending').length}
                              </span>
                           )}
                        </button>
                     </div>
                  </div>

                  {/* Content Area */}
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                     {notifTab === 'all' ? (
                        <div className="flex flex-col h-full">
                           {/* Log Filters Removed */}

                           {displayedNotifications.length > 0 ? (
                              <div className="divide-y divide-white/5 flex-1">
                                 {displayedNotifications.map(notif => (
                                    <div key={notif.id} className={`p-4 hover:bg-white/5 transition-colors relative group ${!notif.read ? 'bg-cyber-primary/5' : ''}`}>
                                       <div className="flex gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                             notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                notif.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                   'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                             }`}>
                                             {notif.type === 'error' ? <X size={16} /> :
                                                notif.type === 'warning' ? <AlertTriangle size={16} /> :
                                                   notif.type === 'success' ? <CheckCircle2 size={16} /> :
                                                      <Info size={16} />
                                             }
                                          </div>
                                          <div className="flex-1 min-w-0">
                                             <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                                                <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                                                   {formatRelativeTime(getSafeTime(notif))}
                                                </span>
                                             </div>
                                             <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                                             {formatExactTime(getSafeTime(notif)) && (
                                                <p className="text-[9px] text-gray-600 font-mono mt-1 flex items-center gap-1.5">
                                                   <Clock size={8} /> {formatExactTime(getSafeTime(notif))}
                                                </p>
                                             )}
                                          </div>
                                          <button
                                             onClick={() => handleClearSingle(notif.id)}
                                             className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30 rounded bg-red-500/0 hover:bg-red-500/10"
                                             title="Remove notification"
                                             aria-label="Remove"
                                          >
                                             <Trash2 size={14} />
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="p-10 text-center flex-1">
                                 <Bell size={32} className="mx-auto text-gray-700 mb-3" />
                                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No activities recorded</p>
                                 <p className="text-[10px] text-gray-600 mt-1">Your notifications will appear here</p>
                              </div>
                           )}
                        </div>
                     ) : notifTab === 'tasks' ? (
                        <div className="p-2 space-y-2">
                           {/* Quick Task Toggle */}
                           <button
                              onClick={() => setShowQuickAssign(!showQuickAssign)}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 hover:bg-cyber-primary/20 transition-all group"
                           >
                              <div className="flex items-center gap-2">
                                 <Plus size={14} className="text-cyber-primary group-hover:rotate-90 transition-transform" />
                                 <span className="text-xs font-bold text-cyber-primary uppercase tracking-wider">Quick Task Assign</span>
                              </div>
                              <div className="px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-bold text-gray-400">ALT+N</div>
                           </button>

                           {showQuickAssign && (
                              <div className="p-3 bg-black/30 rounded-xl border border-white/10 animate-in slide-in-from-top-2">
                                 <div className="space-y-3">
                                    <div className="relative">
                                       <ListTodo size={12} className="absolute left-2.5 top-3 text-gray-500" />
                                       <input
                                          type="text"
                                          placeholder="Awaiting intelligence..."
                                          className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyber-primary/50"
                                          value={quickTaskTitle}
                                          onChange={e => setQuickTaskTitle(e.target.value)}
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                       <div className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 flex items-center gap-2">
                                          <Calendar size={12} className="text-gray-500" />
                                          <select
                                             className="bg-transparent text-white text-[10px] outline-none border-none flex-1 font-bold"
                                             value={quickTaskPriority}
                                             onChange={e => setQuickTaskPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                                             title="Select Priority"
                                          >
                                             <option value="Normal" className="bg-gray-800">Normal</option>
                                             <option value="Urgent" className="bg-gray-800">Urgent</option>
                                             <option value="Low" className="bg-gray-800">Low</option>
                                          </select>
                                       </div>
                                       <div className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 flex items-center gap-2">
                                          <UserPlus size={12} className="text-gray-500 transition-colors" />
                                          <select
                                             className="bg-transparent text-white text-[10px] outline-none border-none flex-1 font-bold truncate"
                                             value={quickTaskAssignee}
                                             onChange={e => setQuickTaskAssignee(e.target.value)}
                                             title="Select Assignee"
                                          >
                                             <option value="">Select employee...</option>
                                             {visibleEmployees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                             ))}
                                          </select>
                                       </div>
                                    </div>
                                    <button
                                       onClick={handleQuickAssign}
                                       disabled={!quickTaskTitle.trim() || !quickTaskAssignee}
                                       className="w-full py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                       <Send size={12} />
                                       Assign Task
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* Task List */}
                           <div className="space-y-1 mt-2">
                              {tasksAssignedToMe.length > 0 ? (
                                 tasksAssignedToMe.map(task => (
                                    <div key={task.id} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                                       <div className="flex items-start gap-3">
                                          <button
                                             onClick={() => handleTaskStatusChange(task.id, task.status === 'Completed' ? 'Pending' : 'Completed')}
                                             className={`mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center ${task.status === 'Completed' ? 'bg-cyber-primary border-cyber-primary' : 'border-gray-600 hover:border-cyber-primary'}`}
                                          >
                                             {task.status === 'Completed' && <X size={12} className="text-black" />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                             <p className={`text-xs font-bold transition-all ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
                                             <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${task.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                   {task.priority}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                                   <span>{formatRelativeTime(getSafeTime(task))}</span>
                                                   {formatExactTime(getSafeTime(task)) && (
                                                      <span className="flex items-center gap-1.5 text-gray-600 before:content-['•'] before:mr-0.5 before:opacity-50">
                                                         {formatExactTime(getSafeTime(task))}
                                                      </span>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 ))
                              ) : (
                                 <div className="p-8 text-center bg-black/20 rounded-xl border border-white/5 border-dashed">
                                    <CheckCircle2 size={32} className="mx-auto text-gray-700 mb-3" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No assigned tasks</p>
                                    <p className="text-[10px] text-gray-600 mt-1">You're all caught up with your missions</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     ) : null}
                  </div>
               </div>
         )}
      </div>
   );
}
