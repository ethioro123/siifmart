import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
    onClick?: () => void;
}

export default function StatCard({
    label,
    value,
    icon,
    trend,
    color = 'primary',
    onClick
}: StatCardProps) {
    const colorClasses = {
        primary: 'text-cyber-primary',
        blue: 'text-blue-400',
        green: 'text-green-400',
        yellow: 'text-yellow-400',
        red: 'text-red-400',
        purple: 'text-purple-400',
        gray: 'text-gray-400'
    };

    return (
        <div
            className={`bg-black/20 rounded-lg p-4 border border-white/5 ${onClick ? 'cursor-pointer hover:bg-black/30 transition-colors' : ''
                }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{label}</p>
                {icon && <div className="text-gray-500">{icon}</div>}
            </div>
            <div className="flex items-end justify-between">
                <p className={`text-2xl font-mono font-bold ${colorClasses[color]}`}>
                    {value}
                </p>
                {trend && (
                    <span className={`text-xs font-bold ${trend.isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}
