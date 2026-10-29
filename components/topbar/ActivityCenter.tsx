import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Clock, Trash2, Layout, CheckSquare } from 'lucide-react';
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
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Activity Center and Notifications"
            aria-expanded={isNotifOpen}
            className={`min-w-[44px] min-h-[44px] p-2 rounded-full border transition-all duration-300 relative group flex items-center justify-center touch-manipulation cursor-pointer ${isNotifOpen
               ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border-focus)] text-[var(--theme-text-primary)]'
               : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-focus)]'
            }`}
         >
            <Bell size={18} className={isNotifOpen ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'} />
            {totalAlerts > 0 && (
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[var(--theme-bg-panel)] shadow-sm animate-pulse">
                  {totalAlerts}
               </span>
            )}
         </button>

         {isNotifOpen && (
            <div
               className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[calc(var(--app-top-inset,0px)+3.75rem)] sm:top-full mt-0 sm:mt-2 w-auto sm:w-96 max-w-[400px] bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] z-[150] animate-in fade-in slide-in-from-top-4 overflow-hidden backdrop-blur-xl"
               onClick={(e) => e.stopPropagation()}
            >
                  {/* Header */}
                  <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <Layout size={16} className="text-[var(--theme-primary)]" />
                           <h4 className="text-sm font-black text-[var(--theme-text-primary)] uppercase tracking-widest">Activity Center</h4>
                        </div>
                        <div className="flex items-center gap-3">
                           {notifTab === 'all' && filteredNotifications.length > 0 && (
                              <>
                                 <button
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] font-bold text-[var(--theme-primary)] hover:opacity-80 uppercase transition-opacity cursor-pointer"
                                 >
                                    Mark all read
                                 </button>
                                 <div className="w-px h-3 bg-[var(--theme-border)]" />
                                 <button
                                    onClick={handleClearAll}
                                    className="text-[10px] font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] uppercase transition-colors cursor-pointer"
                                 >
                                    Clear all
                                 </button>
                              </>
                           )}
                           <button
                              onClick={() => setIsNotifOpen(false)}
                              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
                              title="Close Activity Center"
                              aria-label="Close"
                           >
                              <X size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Tabs */}
                     <div className="flex p-1 bg-[var(--theme-bg-panel)] rounded-xl border border-[var(--theme-border)]">
                        <button
                           onClick={() => setNotifTab('all')}
                           className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${notifTab === 'all' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                           <Bell size={12} />
                           Recent events
                           {filteredNotifications.length > 0 && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${notifTab === 'all' ? 'bg-[color-mix(in_srgb,var(--theme-bg-card)_20%,transparent)]' : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)]'}`}>
                                 {filteredNotifications.length}
                              </span>
                           )}
                        </button>
                        <button
                           onClick={() => setNotifTab('tasks')}
                           className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${notifTab === 'tasks' ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                        >
                           <CheckSquare size={12} />
                           Tasks
                           {tasksAssignedToMe.filter(t => t.status === 'Pending').length > 0 && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${notifTab === 'tasks' ? 'bg-[color-mix(in_srgb,var(--theme-bg-card)_20%,transparent)]' : 'bg-[var(--theme-status-info-bg)] text-[var(--theme-text-primary)]'}`}>
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
                              <div className="divide-y divide-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex-1">
                                 {displayedNotifications.map(notif => (
                                    <div key={notif.id} className={`p-4 hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] transition-colors relative group ${!notif.read ? 'bg-[var(--theme-primary)]/5 dark:bg-[var(--theme-primary-muted)]/5' : ''}`}>
                                       <div className="flex gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${(notif.type === 'error' || notif.type === 'alert') ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]' :
                                             notif.type === 'warning' ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]' :
                                                notif.type === 'success' ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]' :
                                                   'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]'
                                             }`}>
                                             {(notif.type === 'error' || notif.type === 'alert') ? <AlertTriangle size={16} /> :
                                                notif.type === 'warning' ? <AlertTriangle size={16} /> :
                                                   notif.type === 'success' ? <CheckCircle2 size={16} /> :
                                                      <Info size={16} />
                                             }
                                          </div>
                                          <div className="flex-1 min-w-0">
                                             <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <p className="text-xs font-bold text-[var(--theme-text-primary)] truncate">{notif.title}</p>
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono whitespace-nowrap">
                                                   {formatRelativeTime(getSafeTime(notif))}
                                                </span>
                                             </div>
                                             <p className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed break-words">{notif.message}</p>
                                             {formatExactTime(getSafeTime(notif)) && (
                                                <p className="text-[9px] text-[var(--theme-text-secondary)] font-mono mt-1 flex items-center gap-1.5">
                                                   <Clock size={8} /> {formatExactTime(getSafeTime(notif))}
                                                </p>
                                             )}
                                          </div>
                                          <button
                                             onClick={() => handleClearSingle(notif.id)}
                                             className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] transition-all border border-transparent border-[var(--theme-status-danger-border)] rounded bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)]"
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
                                 <Bell size={32} className="mx-auto text-[var(--theme-text-primary)] mb-3" />
                                 <p className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-widest">No recent events</p>
                                 <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">Messages for this session and location appear here.</p>
                              </div>
                           )}
                        </div>
                     ) : notifTab === 'tasks' ? (
                        <div className="p-2 space-y-2">
                           {/* Task List */}
                           <div className="space-y-1 mt-2">
                              {tasksAssignedToMe.length > 0 ? (
                                 tasksAssignedToMe.map(task => (
                                    <div key={task.id} className="p-3 bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] hover:border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] transition-colors group">
                                       <div className="flex items-start gap-3">
                                          <button
                                             onClick={() => handleTaskStatusChange(task.id, task.status === 'Completed' ? 'Pending' : 'Completed')}
                                             className={`mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center ${task.status === 'Completed' ? 'bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-muted)] border-[var(--theme-border)] dark:border-[var(--theme-border)]' : 'border-[var(--theme-border)] border-[var(--theme-border)] hover:border-[var(--theme-border)] dark:hover:border-[var(--theme-border)]'}`}
                                          >
                                             {task.status === 'Completed' && <X size={12} className="text-[var(--theme-text-primary)]" />}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                             <p className={`text-xs font-bold transition-all ${task.status === 'Completed' ? 'text-[var(--theme-text-secondary)] line-through' : 'text-[var(--theme-text-primary)]'}`}>{task.title}</p>
                                             <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${task.priority === 'Urgent' ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]' : 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]'}`}>
                                                   {task.priority}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-[var(--theme-text-secondary)] font-mono">
                                                   <span>{formatRelativeTime(getSafeTime(task))}</span>
                                                   {formatExactTime(getSafeTime(task)) && (
                                                      <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] before:content-['•'] before:mr-0.5 before:opacity-50">
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
                                 <div className="p-8 text-center bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-dashed">
                                    <CheckCircle2 size={32} className="mx-auto text-[var(--theme-text-primary)] mb-3" />
                                    <p className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">No assigned tasks</p>
                                    <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">You're all caught up with your missions</p>
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
