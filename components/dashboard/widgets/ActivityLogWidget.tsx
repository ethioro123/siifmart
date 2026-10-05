import React from 'react';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/formatting';

interface ActivityLogWidgetProps {
    logs?: any[];
}

export const ActivityLogWidget = ({ logs }: ActivityLogWidgetProps) => {
    const displayLogs = logs?.slice(0, 5) || [];

    return (
        <div className="glass-panel rounded-3xl p-6 h-full relative overflow-hidden flex flex-col bg-white/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 text-sm">
                    <Activity className="text-emerald-600 dark:text-emerald-400" size={16} />
                    Live System Activity
                </h3>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
                {displayLogs.length === 0 ? (
                    <div className="text-xs text-stone-500 font-mono text-center py-4">NO RECENT ACTIVITY</div>
                ) : (
                    displayLogs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start border-l-2 border-emerald-500/30 dark:border-emerald-500/40 pl-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800/40 hover:border-emerald-500 transition-all rounded-r">
                            <div className="pt-0.5">
                                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 font-mono leading-none">
                                    {formatRelativeTime(log.created_at || log.timestamp)}
                                </div>
                            </div>
                            <div>
                                <p className="text-stone-900 dark:text-stone-100 text-xs font-bold leading-tight">{log.action}</p>
                                <p className="text-[10px] text-stone-500 leading-tight mt-0.5">{log.details} • <span className="text-stone-400">{(log.user_name || log.user)?.split(' ')[0]}</span></p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0)_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 pointer-events-none"></div>
        </div>
    );
};
