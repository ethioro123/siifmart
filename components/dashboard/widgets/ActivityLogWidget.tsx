import React from 'react';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/formatting';

interface ActivityLogWidgetProps {
    logs?: any[];
}

export const ActivityLogWidget = ({ logs }: ActivityLogWidgetProps) => {
    const displayLogs = logs?.slice(0, 5) || [];

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 h-full relative overflow-hidden flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                    <Activity className="text-[var(--theme-accent)]" size={16} />
                    Live System Activity
                </h3>
                <span className="w-2 h-2 bg-[var(--theme-status-success-bg)] rounded-full animate-pulse"></span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
                {displayLogs.length === 0 ? (
                    <div className="text-xs text-[var(--theme-text-muted)] font-mono text-center py-4">NO RECENT ACTIVITY</div>
                ) : (
                    displayLogs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start border-l-2 border-[var(--theme-accent)]/40 pl-3 py-1.5 hover:bg-[var(--theme-bg-subtle)] transition-colors rounded-r">
                            <div className="pt-0.5">
                                <div className="text-[11px] font-semibold text-[var(--theme-accent)] font-mono leading-none">
                                    {formatRelativeTime(log.created_at || log.timestamp)}
                                </div>
                            </div>
                            <div>
                                <p className="text-[var(--theme-text-primary)] text-xs font-semibold leading-tight">{log.action}</p>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] leading-tight mt-0.5">{log.details} • <span className="text-[var(--theme-text-muted)]">{(log.user_name || log.user)?.split(' ')[0]}</span></p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
