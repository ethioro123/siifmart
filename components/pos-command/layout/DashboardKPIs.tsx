import React, { useState } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { DollarSign, UserCheck, Activity, RefreshCw, ShieldCheck, Eye, EyeOff, PackageCheck, Zap } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';

export const DashboardKPIs: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { cashInDrawer, personalSales, txCount, returnCount } = usePOSCommand();
    const [isRevealed, setIsRevealed] = useState(false);

    const isManagerOrAdmin = [
        'super_admin',
        'admin',
        'store_manager',
        'operations_manager',
        'ceo'
    ].includes(user?.role?.toLowerCase() || '');

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Cash in Drawer (Concealed for Cashiers) */}
            <KPICard
                title={t('pos.cashInDrawer')}
                value={
                    isManagerOrAdmin
                        ? isRevealed ? `${CURRENCY_SYMBOL} ${cashInDrawer.toLocaleString()}` : '••••••••'
                        : 'Protected (Blind)'
                }
                subtitle={!isManagerOrAdmin ? "Anti-Skimming Lock Active" : isRevealed ? "Manager Visible" : "Click eye to reveal"}
                color={!isManagerOrAdmin ? "forest" : "green"}
                icon={
                    !isManagerOrAdmin ? (
                        <ShieldCheck size={22} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    ) : (
                        <DollarSign size={22} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    )
                }
                action={
                    isManagerOrAdmin ? (
                        <button
                            onClick={() => setIsRevealed(!isRevealed)}
                            title={isRevealed ? "Hide Cash Total" : "Reveal Cash Total"}
                            className="p-1 rounded-lg text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors cursor-pointer"
                        >
                            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    ) : null
                }
            />

            {/* Card 2: Shift Performance (Items count for Cashier, Revenue for Manager) */}
            <KPICard
                title={isManagerOrAdmin ? t('pos.personalSales') : "Shift Activity"}
                value={
                    isManagerOrAdmin
                        ? isRevealed ? `${CURRENCY_SYMBOL} ${personalSales.toLocaleString()}` : '••••••••'
                        : `${txCount} Completed Orders`
                }
                subtitle={isManagerOrAdmin ? t('pos.todayShift') : "Current Active Shift"}
                color="forest"
                icon={
                    isManagerOrAdmin ? (
                        <UserCheck size={22} className="text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:scale-110 transition-transform" />
                    ) : (
                        <PackageCheck size={22} className="text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:scale-110 transition-transform" />
                    )
                }
            />

            {/* Card 3: Transactions */}
            <KPICard
                title={t('pos.transactions')}
                value={txCount.toString()}
                trend="+18%"
                trendUp={true}
                color="sage"
                icon={<Activity size={22} className="text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:scale-110 transition-transform" />}
            />

            {/* Card 4: Returns / Efficiency */}
            <KPICard
                title={t('pos.returns')}
                value={returnCount.toString()}
                trend={returnCount === 0 ? "0 Returns" : "-5%"}
                trendUp={returnCount === 0}
                color={returnCount > 0 ? "red" : "sage"}
                icon={<RefreshCw size={22} className={returnCount > 0 ? "text-red-500 dark:text-red-400" : "text-[#2C5E3B] dark:text-[#A9CBA2]"} />}
            />
        </div>
    );
};

const getColorClasses = (color: string) => {
    switch (color) {
        case 'green': return { glow: 'bg-emerald-400/15 dark:bg-emerald-500/5', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' };
        case 'forest': return { glow: 'bg-[#2C5E3B]/15 dark:bg-[#2C5E3B]/8', iconBg: 'bg-[#2C5E3B]/8 dark:bg-[#2C5E3B]/10 border-[#2C5E3B]/20 dark:border-[#2C5E3B]/20', badge: 'bg-[#2C5E3B]/8 dark:bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#2C5E3B]/20' };
        case 'sage': return { glow: 'bg-[#A9CBA2]/20 dark:bg-[#A9CBA2]/5', iconBg: 'bg-[#A9CBA2]/20 dark:bg-[#A9CBA2]/10 border-[#A9CBA2]/30 dark:border-[#A9CBA2]/20', badge: 'bg-[#A9CBA2]/20 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#A9CBA2]/30 dark:border-[#A9CBA2]/20' };
        case 'red': return { glow: 'bg-red-400/10 dark:bg-red-500/5', iconBg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', badge: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' };
        default: return { glow: 'bg-[#2C5E3B]/10', iconBg: 'bg-[#2C5E3B]/10 border-[#2C5E3B]/20', badge: 'bg-[#2C5E3B]/10 text-[#2C5E3B] border-[#2C5E3B]/20' };
    }
};

const KPICard = ({ title, value, subtitle, trend, trendUp, icon, color = 'forest', action }: any) => {
    const theme = getColorClasses(color);

    return (
        <div className="group relative bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] p-6 overflow-hidden transition-all duration-300 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(34,50,38,0.1)] dark:hover:shadow-[0_16px_48px_-8px_rgba(5,8,6,0.7)] hover:-translate-y-0.5">

            {/* Ambient corner glow */}
            <div className={`absolute -top-8 -right-8 w-32 h-32 ${theme.glow} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

            {/* Top edge accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent" />

            <div className="relative z-10 flex justify-between items-start mb-5">
                <div className={`p-2.5 rounded-2xl border ${theme.iconBg} group-hover:-translate-y-0.5 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex items-center gap-2">
                    {action}
                    {trend && (
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${theme.badge} tracking-wider shadow-sm`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 select-none">{title}</h3>
                <p className="text-2xl font-mono font-black tracking-tighter text-[#1E3F27] dark:text-[#EAE5D9] group-hover:scale-[1.01] origin-left transition-transform duration-300">{value}</p>
                {subtitle && <p className="text-[10px] text-[#4D6E56]/60 dark:text-[#7A9E83] mt-2 uppercase font-bold tracking-wider">{subtitle}</p>}
            </div>
        </div>
    );
};
