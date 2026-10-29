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
      badgeColor: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
      icon: Truck,
      iconColor: 'text-[var(--theme-status-success-text)]',
      iconBg: 'bg-[var(--theme-status-success-bg)]',
      barColor: 'bg-[var(--theme-status-success)]',
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
        ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
        : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
      icon: ClipboardList,
      iconColor: 'text-[var(--theme-status-warning-text)]',
      iconBg: 'bg-[var(--theme-status-warning-bg)]',
      barColor: 'bg-[var(--theme-status-warning)]',
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
      badgeColor: 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20',
      icon: Clock,
      iconColor: 'text-[var(--theme-accent)]',
      iconBg: 'bg-[var(--theme-accent)]/10/10',
      barColor: 'bg-[var(--theme-accent)]',
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
          <button
            key={idx}
            type="button"
            onClick={() => navigate(card.route)}
            className="group relative w-full text-left bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden transition-colors shadow-2xs hover:shadow-xs hover:border-[var(--theme-accent)]/40 flex flex-col justify-between cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)]" />
                  {card.statusLeft}
                </span>
                <span className="text-[11px] text-[var(--theme-accent)] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{card.statusRight}</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default WarehouseCommandDeck;
