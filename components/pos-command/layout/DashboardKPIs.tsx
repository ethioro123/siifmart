import React, { useState } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { DollarSign, UserCheck, Activity, RefreshCw, ShieldCheck, Eye, EyeOff, PackageCheck, Zap } from 'lucide-react';
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
                icon={
                    !isCentralHQ ? (
                        <ShieldCheck size={20} className="text-[var(--theme-text-primary)]" />
                    ) : (
                        <DollarSign size={20} className="text-[var(--theme-text-primary)] transition-transform" />
                    )
                }
                action={
                    isCentralHQ ? (
                        <button
                            onClick={() => setIsRevealed(!isRevealed)}
                            title={isRevealed ? "Hide Cash Total" : "Reveal Cash Total"}
                            className="p-1 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                        >
                            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    ) : null
                }
            />

            {/* Card 2: Shift Performance (Items count for Store Staff, Revenue for Central HQ) */}
            <KPICard
                title={isCentralHQ ? t('pos.personalSales') : "Shift Activity"}
                value={
                    isCentralHQ
                        ? isRevealed ? `${CURRENCY_SYMBOL} ${personalSales.toLocaleString()}` : '••••••••'
                        : `${shiftTxCount} Completed Orders`
                }
                subtitle={isCentralHQ ? t('pos.todayShift') : "Current Active Shift"}
                icon={
                    isCentralHQ ? (
                        <UserCheck size={20} className="text-[var(--theme-text-primary)] transition-transform" />
                    ) : (
                        <PackageCheck size={20} className="text-[var(--theme-text-primary)] transition-transform" />
                    )
                }
            />

            {/* Card 3: Transactions */}
            <KPICard
                title={t('pos.transactions')}
                value={txCount.toString()}
                subtitle={`${dateRange} Volume`}
                trend="+18%"
                icon={<Activity size={20} className="text-[var(--theme-text-primary)] transition-transform" />}
            />

            {/* Card 4: Returns / Efficiency */}
            <KPICard
                title={t('pos.returns')}
                value={returnCount.toString()}
                subtitle={`${dateRange} Total`}
                trend={returnCount === 0 ? "0 Returns" : "-5%"}
                icon={<RefreshCw size={20} className={returnCount > 0 ? "text-rose-500" : "text-[var(--theme-text-primary)]"} />}
            />
        </div>
    );
};

const KPICard = ({ title, value, subtitle, trend, icon, action }: any) => {
    return (
        <div className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 shadow-xs hover:shadow-sm hover:-translate-y-0.5">
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] transition-transform duration-300">
                    {icon}
                </div>
                <div className="flex items-center gap-2">
                    {action}
                    {trend && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] tracking-wider">
                            {trend}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-[var(--theme-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 select-none">{title}</h3>
                <p className="text-2xl font-mono font-bold tracking-tight text-[var(--theme-text-primary)] tabular-nums transition-transform duration-300">{value}</p>
                {subtitle && <p className="text-[10px] text-[var(--theme-text-muted)] mt-1.5 uppercase font-medium tracking-wider">{subtitle}</p>}
            </div>
        </div>
    );
};
