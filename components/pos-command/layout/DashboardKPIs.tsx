import React, { useState } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { DollarSign, UserCheck, Activity, RefreshCw, ShieldCheck, Eye, EyeOff, PackageCheck } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';

export const DashboardKPIs: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { cashInDrawer, personalSales, txCount, shiftTxCount, returnCount, dateRange } = usePOSCommand();
    const [isRevealed, setIsRevealed] = useState(false);

    const isCentralHQ = [
        'super_admin',
        'ceo',
        'admin',
        'regional_manager',
        'operations_manager',
        'finance_manager'
    ].includes(user?.role?.toLowerCase() || '');

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Cash in Drawer (Concealed for Store Staff & Store Managers) */}
            <KPICard
                title={t('pos.cashInDrawer')}
                value={
                    isCentralHQ
                        ? isRevealed ? `${CURRENCY_SYMBOL} ${cashInDrawer.toLocaleString()}` : '••••••••'
                        : 'Protected (Blind)'
                }
                subtitle={!isCentralHQ ? "Anti-Skimming Lock Active" : isRevealed ? "Central HQ Visible" : "Click eye to reveal"}
                iconBg="bg-emerald-500/10 text-emerald-500"
                icon={
                    !isCentralHQ ? (
                        <ShieldCheck size={18} />
                    ) : (
                        <DollarSign size={18} />
                    )
                }
                action={
                    isCentralHQ ? (
                        <button
                            onClick={() => setIsRevealed(!isRevealed)}
                            title={isRevealed ? "Hide Cash Total" : "Reveal Cash Total"}
                            className="p-1 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                        >
                            {isRevealed ? <EyeOff size={15} className="text-blue-500" /> : <Eye size={15} className="text-blue-500" />}
                        </button>
                    ) : null
                }
            />

            {/* Card 2: Shift Performance */}
            <KPICard
                title={isCentralHQ ? t('pos.personalSales') : "Shift Activity"}
                value={
                    isCentralHQ
                        ? isRevealed ? `${CURRENCY_SYMBOL} ${personalSales.toLocaleString()}` : '••••••••'
                        : `${shiftTxCount} Completed Orders`
                }
                subtitle={isCentralHQ ? t('pos.todayShift') : "Current Active Shift"}
                iconBg="bg-blue-500/10 text-blue-500"
                icon={
                    isCentralHQ ? (
                        <UserCheck size={18} />
                    ) : (
                        <PackageCheck size={18} />
                    )
                }
            />

            {/* Card 3: Transactions */}
            <KPICard
                title={t('pos.transactions')}
                value={txCount.toString()}
                subtitle={`${dateRange} Volume`}
                trend="+18%"
                trendPositive={true}
                iconBg="bg-indigo-500/10 text-indigo-500"
                icon={<Activity size={18} />}
            />

            {/* Card 4: Returns / Efficiency */}
            <KPICard
                title={t('pos.returns')}
                value={returnCount.toString()}
                subtitle={`${dateRange} Total`}
                trend={returnCount === 0 ? "0 Returns" : "-5%"}
                trendPositive={returnCount === 0}
                iconBg={returnCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}
                icon={<RefreshCw size={18} />}
            />
        </div>
    );
};

interface KPICardProps {
    title: string;
    value: string;
    subtitle?: string;
    trend?: string;
    trendPositive?: boolean;
    icon: React.ReactNode;
    iconBg: string;
    action?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    subtitle,
    trend,
    trendPositive,
    icon,
    iconBg,
    action
}) => {
    return (
        <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 isolate">
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                    {icon}
                </div>
                <div className="flex items-center gap-2">
                    {action}
                    {trend && (
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border tracking-tight ${
                            trendPositive
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-[var(--theme-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 select-none">
                    {title}
                </h3>
                <p className="text-2xl font-mono font-bold tracking-tight text-[var(--theme-text-primary)] tabular-nums transition-transform duration-300">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-[10px] text-[var(--theme-text-muted)] mt-1.5 uppercase font-medium tracking-wider">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};
