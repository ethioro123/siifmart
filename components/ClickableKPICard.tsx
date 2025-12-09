/**
 * Clickable KPI Card Component
 * Reusable metric card with navigation capability
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface ClickableKPICardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: string;
  bg?: string;
  route?: string;
  onClick?: () => void;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export default function ClickableKPICard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  route,
  onClick,
  trend,
  trendValue
}: ClickableKPICardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      navigate(route);
    }
  };

  const isClickable = !!route || !!onClick;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`
        bg-cyber-gray border border-white/5 rounded-2xl p-6 
        flex items-center justify-between 
        transition-all group
        ${isClickable ? 'cursor-pointer hover:border-cyber-primary/50 hover:bg-white/5' : 'hover:border-white/10'}
        ${bg || ''}
      `}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </div>
          )}
        </div>
        <h3 className="text-2xl font-mono font-bold text-white">{value}</h3>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        {isClickable && (
          <p className="text-[10px] text-cyber-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view details →
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl ${bg || 'bg-white/5'} ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

