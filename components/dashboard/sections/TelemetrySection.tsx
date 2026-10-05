import React from 'react';
import { Activity, ShieldCheck, Zap, Wifi, Database } from 'lucide-react';
import { DashboardSection } from '../widgets/DashboardSection';
import { SystemLoadWidget } from '../widgets/SystemLoadWidget';
import { ActivityLogWidget } from '../widgets/ActivityLogWidget';
import WidgetErrorBoundary from '../../WidgetErrorBoundary';
import { Country } from '../../../utils/localization';

interface TelemetrySectionProps {
    systemLogs?: any[];
    activeCountry: Country;
}

export const TelemetrySection: React.FC<TelemetrySectionProps> = ({ systemLogs, activeCountry }) => {
    return (
        <DashboardSection title="System Telemetry & Audit Hub" icon={Activity} className="col-span-1 md:col-span-4">
            {/* Quick Infrastructure Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                        <Zap size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Edge Status</p>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-[var(--theme-text-secondary)] animate-pulse" />
                            OPTIMAL (100%)
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                        <Wifi size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Network Latency</p>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] font-mono">12ms • Local EAT</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Security Shield</p>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] font-mono">RLS Tenant Partitioned</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                        <Database size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Active Domain</p>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] font-mono">{activeCountry === 'KE' ? 'Kenya Tenant (KE)' : 'Ethiopia HQ (ET)'}</p>
                    </div>
                </div>
            </div>

            {/* System Load & Activity Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                <WidgetErrorBoundary title="System Load">
                    <SystemLoadWidget />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Live Activity Log">
                    <ActivityLogWidget logs={systemLogs} />
                </WidgetErrorBoundary>
            </div>
        </DashboardSection>
    );
};
