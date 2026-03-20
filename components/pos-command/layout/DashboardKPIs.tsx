import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { DollarSign, UserCheck, Activity, RefreshCw } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';

export const DashboardKPIs: React.FC = () => {
    const { t } = useLanguage();
    const {
        cashInDrawer,
        personalSales,
        txCount,
        returnCount
    } = usePOSCommand();

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                title={t('pos.cashInDrawer')}
                value={`${CURRENCY_SYMBOL} ${cashInDrawer.toLocaleString()}`}
                trend="+12%"
                trendUp={true}
                color="green"
                icon={<DollarSign size={24} className="text-green-400 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-all" />}
            />
            <KPICard
                title={t('pos.personalSales')}
                value={`${CURRENCY_SYMBOL} ${personalSales.toLocaleString()}`}
                subtitle={t('pos.todayShift')}
                color="blue"
                icon={<UserCheck size={24} className="text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all" />}
            />
            <KPICard
                title={t('pos.transactions')}
                value={txCount.toString()}
                trend="+18%"
                trendUp={true}
                color="purple"
                icon={<Activity size={24} className="text-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all" />}
            />
            <KPICard
                title={t('pos.returns')}
                value={returnCount.toString()}
                trend="-5%"
                trendUp={false}
                color="red"
                icon={<RefreshCw size={24} className="text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all" />}
            />
        </div>
    );
};

const getColorClasses = (color: string) => {
    switch (color) {
        case 'green': return { container: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:border-green-500/30', bgGlow: 'from-green-500/10', iconBg: 'border-green-500/20 bg-green-500/5', trendBg: 'bg-green-500/10 text-green-400 border-green-500/20' };
        case 'blue': return { container: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/30', bgGlow: 'from-blue-500/10', iconBg: 'border-blue-500/20 bg-blue-500/5', trendBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
        case 'purple': return { container: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-500/30', bgGlow: 'from-purple-500/10', iconBg: 'border-purple-500/20 bg-purple-500/5', trendBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
        case 'red': return { container: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:border-red-500/30', bgGlow: 'from-red-500/10', iconBg: 'border-red-500/20 bg-red-500/5', trendBg: 'bg-red-500/10 text-red-400 border-red-500/20' };
        default: return { container: 'hover:shadow-[0_0_30px_rgba(0,255,157,0.15)] hover:border-cyber-primary/30', bgGlow: 'from-cyber-primary/10', iconBg: 'border-cyber-primary/20 bg-cyber-primary/5', trendBg: 'bg-cyber-primary/10 text-cyber-primary border-cyber-primary/20' };
    }
}

const KPICard = ({ title, value, subtitle, trend, trendUp, icon, color = "green" }: any) => {
    const theme = getColorClasses(color);

    return (
        <div className={`bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 ${theme.container}`}>
            {/* Holographic Gradient */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${theme.bgGlow} to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-3 rounded-2xl border ${theme.iconBg} backdrop-blur-sm group-hover:-translate-y-1 transition-transform duration-300`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${theme.trendBg} tracking-wider shadow-sm`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1.5">{title}</h3>
                <p className="text-3xl font-mono text-white font-black tracking-tighter drop-shadow-md group-hover:scale-[1.02] origin-left transition-transform duration-300">{value}</p>
                {subtitle && <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-wider">{subtitle}</p>}
            </div>
        </div>
    );
};
