import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Package, Target, Box, Truck, ArrowRight,
  ClipboardList, AlertTriangle
} from 'lucide-react';

interface OperationalThroughputCardProps {
  queueBreakdown?: Record<string, number>;
  onSelectQueue?: (key: string) => void;
}

const OPERATIONS = [
  { label: 'Putaway', key: 'PUTAWAY', sub: 'Inbound Ingest', icon: Package, color: 'text-[#0071E3] dark:text-[#2997FF]', bg: 'bg-[#0071E3]/10 dark:bg-[#2997FF]/10' },
  { label: 'Picking', key: 'PICK', sub: 'Outbound Flow', icon: Target, color: 'text-[#FF9500] dark:text-[#FF9F0A]', bg: 'bg-[#FF9500]/10' },
  { label: 'Packing', key: 'PACK', sub: 'QA Validated', icon: Box, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Dispatch', key: 'DISPATCH', sub: 'Postal Ready', icon: Truck, color: 'text-[#34C759] dark:text-[#30D158]', bg: 'bg-[#34C759]/10' },
  { label: 'Internal', key: 'TRANSFER', sub: 'Cross-Network', icon: ArrowRight, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { label: 'Audits', key: 'COUNT', sub: 'Purity Check', icon: ClipboardList, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  { label: 'Compliance', key: 'WASTE', sub: 'Resolution', icon: AlertTriangle, color: 'text-[#FF3B30] dark:text-[#FF453A]', bg: 'bg-[#FF3B30]/10' },
  { label: 'Returns', key: 'RETURNS', sub: 'Reverse Log', icon: ArrowRight, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Resupply', key: 'REPLENISH', sub: 'Buffer Sync', icon: Activity, color: 'text-[#0071E3] dark:text-[#2997FF]', bg: 'bg-[#0071E3]/10' },
];

export const OperationalThroughputCard: React.FC<OperationalThroughputCardProps> = ({
  queueBreakdown,
  onSelectQueue
}) => {
  const navigate = useNavigate();

  const totalActiveJobs = React.useMemo(() => {
    if (!queueBreakdown) return 0;
    return Object.values(queueBreakdown).reduce((sum, val) => sum + (val || 0), 0);
  }, [queueBreakdown]);

  const handleQueueClick = (key: string) => {
    if (onSelectQueue) {
      onSelectQueue(key);
    } else {
      navigate(`/wms-ops?tab=${key}`);
    }
  };

  return (
    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
              Operational Throughput
            </h3>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
              Live queue velocity across fulfillment workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
            {totalActiveJobs} Active Tasks
          </span>
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#34C759] dark:bg-[#30D158] animate-pulse" />
            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Queue Synced</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 relative">
        {OPERATIONS.map((cluster) => {
          const Icon = cluster.icon;
          const count = queueBreakdown?.[cluster.key] || 0;
          return (
            <div
              key={cluster.key}
              onClick={() => handleQueueClick(cluster.key)}
              className="bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] hover:border-[#0071E3]/30 transition-all group relative cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-8 h-8 rounded-lg ${cluster.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <Icon size={16} className={cluster.color} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold font-mono text-[var(--theme-text-primary)]">
                    {count}
                  </span>
                  <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Jobs</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{cluster.label}</p>
                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 truncate">{cluster.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperationalThroughputCard;
