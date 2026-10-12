import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ClipboardList, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { METRIC_ROUTES } from '../../utils/metrics';

export interface WarehouseMetricsData {
  totalRevenue: number;
  active_alerts: number;
  inboundPOs: number;
  pendingPicks: number;
  completedJobs: number;
  criticalPicks: number;
  avgCycleTime: string | number;
  pickAccuracy: string;
}

interface WarehouseCommandDeckProps {
  metrics: WarehouseMetricsData;
  dateRange?: string;
}

export const WarehouseCommandDeck: React.FC<WarehouseCommandDeckProps> = ({
  metrics,
  dateRange = 'This Quarter'
}) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Inbound Logistics',
      category: 'Procurement & Docks',
      value: metrics.inboundPOs,
      badgeText: 'Dock Schedule',
      badgeColor: 'bg-[#34C759]/10 text-[#34C759] dark:text-[#30D158] border-[#34C759]/20',
      icon: Truck,
      iconColor: 'text-[#34C759] dark:text-[#30D158]',
      iconBg: 'bg-[#34C759]/10',
      barColor: 'bg-[#34C759] dark:bg-[#30D158]',
      barWidth: metrics.inboundPOs > 0 ? '70%' : '15%',
      statusLeft: 'Dock Ready',
      statusRight: 'Inbound Orders',
      route: METRIC_ROUTES.procurement
    },
    {
      title: 'Fulfillment Queue',
      category: 'Picks & Orders',
      value: metrics.pendingPicks,
      badgeText: metrics.criticalPicks > 0 ? `${metrics.criticalPicks} Priority` : 'Active Orders',
      badgeColor: metrics.criticalPicks > 0
        ? 'bg-[#FF3B30]/10 text-[#FF3B30] dark:text-[#FF453A] border-[#FF3B30]/20'
        : 'bg-[#FF9500]/10 text-[#FF9500] dark:text-[#FF9F0A] border-[#FF9500]/20',
      icon: ClipboardList,
      iconColor: 'text-[#FF9500] dark:text-[#FF9F0A]',
      iconBg: 'bg-[#FF9500]/10',
      barColor: 'bg-[#FF9500] dark:bg-[#FF9F0A]',
      barWidth: `${Math.min(100, Math.max(15, metrics.pendingPicks * 10))}%`,
      statusLeft: `${metrics.completedJobs} Dispatched`,
      statusRight: 'Queue Flow',
      route: METRIC_ROUTES.picks
    },
    {
      title: 'Cycle Velocity',
      category: 'Operational Pace',
      value: metrics.avgCycleTime,
      badgeText: 'Efficiency Target',
      badgeColor: 'bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border-[#0071E3]/20',
      icon: Clock,
      iconColor: 'text-[#0071E3] dark:text-[#2997FF]',
      iconBg: 'bg-[#0071E3]/10 dark:bg-[#2997FF]/10',
      barColor: 'bg-[#0071E3] dark:bg-[#2997FF]',
      barWidth: metrics.avgCycleTime !== '--' ? '82%' : '20%',
      statusLeft: 'Target <15m',
      statusRight: 'WMS Latency',
      route: METRIC_ROUTES.wms
    },
    {
      title: 'Pick Accuracy',
      category: 'Quality Standard',
      value: metrics.pickAccuracy,
      badgeText: 'Quality SLA',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: CheckCircle,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10',
      barColor: 'bg-purple-500',
      barWidth: metrics.pickAccuracy !== 'N/A' && metrics.pickAccuracy.endsWith('%') ? metrics.pickAccuracy : '96%',
      statusLeft: 'Zero-Defect',
      statusRight: 'QA Verified',
      route: METRIC_ROUTES.picks
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={() => navigate(card.route)}
            className="group relative bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-xs hover:border-[#0071E3]/40 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon size={16} />
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                  {card.badgeText}
                </span>
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-1">
                {card.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-text-primary)] leading-none">
                  {card.value}
                </span>
                <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                  {card.category}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--theme-border)]">
              <div className="relative h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${card.barColor} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: card.barWidth }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {card.statusLeft}
                </span>
                <span className="text-[11px] text-[#0071E3] dark:text-[#2997FF] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{card.statusRight}</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WarehouseCommandDeck;
