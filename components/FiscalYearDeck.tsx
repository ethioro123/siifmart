
import React from 'react';
import { Calendar, TrendingUp, CheckCircle, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDateTime } from '../utils/formatting';

interface FiscalYearDeckProps {
    year: number;
    currentQuarter: number; // 1-4
    metrics?: {
        q1: { value: string; label: string; trend?: string };
        q2: { value: string; label: string; trend?: string };
        q3: { value: string; label: string; trend?: string };
        q4: { value: string; label: string; trend?: string };
    };
    onQuarterSelect?: (q: number) => void;
}

const FiscalYearDeck: React.FC<FiscalYearDeckProps> = ({ year, currentQuarter, metrics, onQuarterSelect }) => {

    // Helper to get quarter dates
    const getQuarterDates = (q: number) => {
        const start = new Date(year, (q - 1) * 3, 1);
        const end = new Date(year, q * 3, 0);
        return `${formatDateTime(start)} - ${formatDateTime(end)}`;
    };

    // Helper calculate progress for CURRENT quarter
    const getProgress = () => {
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3) + 1;
        if (q !== currentQuarter || now.getFullYear() !== year) return 100; // If past/future, handle logic

        // If we are displaying the current year's deck
        const start = new Date(year, (q - 1) * 3, 1);
        const end = new Date(year, q * 3, 0);
        const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
        return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    };

    const quarters = [1, 2, 3, 4];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {quarters.map((q) => {
                const isCompleted = year < new Date().getFullYear() || (year === new Date().getFullYear() && q < currentQuarter);
                const isCurrent = year === new Date().getFullYear() && q === currentQuarter;
                const isFuture = year > new Date().getFullYear() || (year === new Date().getFullYear() && q > currentQuarter);

                const data = metrics ? metrics[`q${q}` as keyof typeof metrics] : null;

                return (
                    <motion.div
                        key={q}
                        whileHover={{ y: -5 }}
                        onClick={() => onQuarterSelect && onQuarterSelect(q)}
                        className={`
                            relative overflow-hidden rounded-2xl p-4 border transition-all cursor-pointer
                            ${isCurrent
                                ? 'bg-cyber-primary/10 border-cyber-primary shadow-[0_0_20px_rgba(0,255,157,0.2)]'
                                : isCompleted
                                    ? 'bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)]'
                                    : 'bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] opacity-60'}
                        `}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className={`font-bold text-lg font-mono ${isCurrent ? 'text-cyber-primary' : 'text-[var(--theme-text-primary)]'}`}>Q{q}</h3>
                                <p className="text-[10px] text-[var(--theme-text-muted)] font-mono uppercase">{getQuarterDates(q)}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${isCurrent ? 'bg-cyber-primary/20 text-cyber-primary' : isCompleted ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)]'}`}>
                                {isCurrent ? <Clock size={16} className="animate-pulse" /> : isCompleted ? <CheckCircle size={16} /> : <Lock size={16} />}
                            </div>
                        </div>

                        {/* Metric (if provided) */}
                        {data ? (
                            <div className="mb-3">
                                <p className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">{data.value}</p>
                                <p className="text-[10px] text-[var(--theme-text-secondary)]">{data.label}</p>
                                {data.trend && (
                                    <div className="mt-1 text-xs flex items-center gap-1 text-[var(--theme-status-success-text)]">
                                        <TrendingUp size={10} /> {data.trend}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-12 flex items-center">
                                {isFuture ? (
                                    <p className="text-xs text-[var(--theme-text-secondary)] italic">Locked</p>
                                ) : (
                                    <p className="text-xs text-[var(--theme-text-muted)] italic">--</p>
                                )}
                            </div>
                        )}

                        {/* Progress Bar (Current Only) */}
                        {isCurrent && (
                            <div className="w-full bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] h-1.5 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-cyber-primary"
                                    ref={(el) => { if (el) el.style.width = `${getProgress()}%`; }}
                                />
                            </div>
                        )}
                        {isCurrent && (
                            <p className="text-[9px] text-cyber-primary text-right mt-1">{Math.round(getProgress())}% Elapsed</p>
                        )}

                    </motion.div>
                );
            })}
        </div>
    );
};

export default FiscalYearDeck;
