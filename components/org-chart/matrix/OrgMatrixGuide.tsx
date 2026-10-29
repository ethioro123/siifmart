import React from 'react';
import {
    ChevronDown,
    ChevronUp,
    Shield,
    Network,
    ArrowRight,
    Info,
    CheckCircle2,
    Crown,
    Building2,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { HIERARCHY_LEVEL_CONFIGS } from '../hooks/orgReportingLines';

interface OrgMatrixGuideProps {
    isDark: boolean;
}

const renderTierIcon = (level: number, color: string) => {
    switch (level) {
        case 1:
        case 2:
            return <Crown size={15} style={{ color }} />;
        case 3:
        case 4:
        case 5:
            return <Building2 size={15} style={{ color }} />;
        case 6:
        case 7:
        case 8:
            return <ShieldCheck size={15} style={{ color }} />;
        case 9:
        case 10:
        default:
            return <Zap size={15} style={{ color }} />;
    }
};

export const OrgMatrixGuide: React.FC<OrgMatrixGuideProps> = ({ isDark }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden mb-5 ${
                isDark ? 'bg-[var(--theme-bg-panel)] border-[#2C4D35]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
            }`}
        >
            {/* Header Toggle */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                    isDark ? 'hover:bg-[#1E2822]' : 'hover:bg-[var(--theme-bg-subtle)]'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                        <Network size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                                Dual-Control Reporting Lines & Supervisory Matrix Standard
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-semibold border border-[var(--theme-border)]/20">
                                SOP-ORG-036
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] mt-0.5">
                            10-Level organizational hierarchy (L1–L10) with Solid-Line operational command & Dotted-Line functional compliance.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] hidden sm:inline">
                        {isExpanded ? 'Hide Governance Standard' : 'View Governance Standard'}
                    </span>
                    <button
                        type="button"
                        aria-label="Toggle Matrix Guide"
                        className="p-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] text-[var(--theme-text-muted)]"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="p-5 pt-1 border-t border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] space-y-5 text-xs">
                    {/* Core Matrix Concepts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div className={`p-4 rounded-xl border ${
                            isDark ? 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)]' : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)]'
                        }`}>
                            <div className="flex items-center gap-2 font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] mb-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-primary)]" />
                                <span>Solid Line (Operational Command)</span>
                            </div>
                            <p className="text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] leading-relaxed">
                                Direct supervisory hierarchy for shift rostering, task execution, time & attendance, immediate floor discipline, and daily custody sign-offs.
                            </p>
                            <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                                <span>↳ Shift Lead</span>
                                <ArrowRight size={12} />
                                <span>Cashier / Sales Associate</span>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${
                            isDark ? 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)]' : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)]'
                        }`}>
                            <div className="flex items-center gap-2 font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mb-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-[var(--theme-status-warning-border)]" />
                                <span>Dotted Line (Functional / 4-Eyes Compliance)</span>
                            </div>
                            <p className="text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] leading-relaxed">
                                Functional governance for fiscal audits, register till reconciliations, PO receiving variances, fleet roadworthiness, and compensation dual sign-off.
                            </p>
                            <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                <span>⤑ Finance / Audit</span>
                                <ArrowRight size={12} />
                                <span>Cashier / Receiver / Payroll</span>
                            </div>
                        </div>
                    </div>

                    {/* 10-Level Hierarchy Breakdown */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <Shield size={14} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
                            <span>Enterprise 10-Level Hierarchy Tiers (L1–L10)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(lvl => {
                                const cfg = HIERARCHY_LEVEL_CONFIGS[lvl];
                                return (
                                    <div
                                        key={lvl}
                                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                                            isDark ? 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)]' : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)]'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <div className="p-1 rounded-lg bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)]">
                                                    {renderTierIcon(lvl, cfg.color)}
                                                </div>
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: isDark ? cfg.bgDark : cfg.bgLight,
                                                        color: cfg.color,
                                                        border: `1px solid ${isDark ? cfg.borderDark : cfg.borderLight}`
                                                    }}
                                                >
                                                    {cfg.badge}
                                                </span>
                                            </div>
                                            <h5 className="font-bold text-xs text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                                                {cfg.title.split(':')[1]?.trim() || cfg.title}
                                            </h5>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] mt-1 line-clamp-2">
                                                {cfg.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Captain Owns the Ship Doctrine Note */}
                    <div className="p-3 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-start gap-2.5">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Supervisory Accountability (Rule 18 — "The Captain Owns the Ship"):</span>
                            <span className="ml-1 text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">
                                On-duty facility managers and shift leads co-sign cash drawer variances, dock receiving shortages, and overrides. High override velocity (&gt; 3%) triggers automatic HQ central audits.
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
