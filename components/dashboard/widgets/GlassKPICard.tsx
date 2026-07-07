import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { formatCompactNumber } from '../../../utils/formatting';
import { GlassKPICardProps } from '../types';

export const GlassKPICard = ({ title, value, icon: Icon, color, sub, route, trend }: GlassKPICardProps) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => route && navigate(route)}
            className="group relative overflow-hidden glass-panel glass-panel-hover rounded-3xl p-6 cursor-pointer"
        >
            <div className={`absolute -right-10 -top-10 p-16 rounded-full ${color.replace('text-', 'bg-')}/10 blur-3xl group-hover:blur-[60px] transition-all duration-700`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${color.replace('text-', 'bg-')}/10 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className={color} />
                </div>
                {trend && (
                    <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-sm ${trend.startsWith('+') ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                        <TrendingUp size={10} className={`mr-1 ${trend.startsWith('-') ? 'rotate-180' : ''}`} /> {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-tight truncate drop-shadow-sm">
                    {typeof value === 'number' ? formatCompactNumber(value) : value}
                </h3>
                {sub && <p className="text-[11px] text-gray-500 mt-2 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-600"></span>{sub}</p>}
            </div>
        </div>
    );
};
