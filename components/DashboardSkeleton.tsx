import React from 'react';
import { VerticalBar } from './shared/ProgressBar';

const CardSkeleton = ({ className }: { className?: string }) => (
    <div className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--theme-bg-subtle)] to-transparent shimmer-animate" />
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)]" />
            <div className="w-16 h-6 rounded-full bg-[var(--theme-bg-subtle)]" />
        </div>
        <div className="space-y-3">
            <div className="w-24 h-3 rounded bg-[var(--theme-bg-subtle)]" />
            <div className="w-32 h-8 rounded bg-[var(--theme-bg-subtle)]" />
            <div className="w-40 h-3 rounded bg-[var(--theme-bg-subtle)]" />
        </div>
    </div>
);

const ChartSkeleton = ({ height = "h-[400px]", className }: { height?: string, className?: string }) => (
    <div className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 ${height} relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--theme-bg-subtle)] to-transparent shimmer-animate" />
        <div className="w-48 h-6 rounded bg-[var(--theme-bg-subtle)] mb-8" />
        <div className="flex items-end space-x-4 h-[calc(100%-60px)] pb-4">
            {[...Array(8)].map((_, i) => (
                <VerticalBar
                    key={i}
                    className="bg-[var(--theme-bg-subtle)] rounded-t-lg w-full"
                    heightPercent={Math.random() * 60 + 20}
                />
            ))}
        </div>
    </div>
);

const ListSkeleton = ({ rows = 5, className }: { rows?: number, className?: string }) => (
    <div className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--theme-bg-subtle)] to-transparent shimmer-animate" />
        <div className="w-40 h-6 rounded bg-[var(--theme-bg-subtle)] mb-6" />
        <div className="space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--theme-border-subtle)]">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-[var(--theme-bg-subtle)]" />
                        <div className="space-y-2">
                            <div className="w-32 h-3 rounded bg-[var(--theme-bg-subtle)]" />
                            <div className="w-20 h-2 rounded bg-[var(--theme-bg-subtle)]" />
                        </div>
                    </div>
                    <div className="w-16 h-4 rounded bg-[var(--theme-bg-subtle)]" />
                </div>
            ))}
        </div>
    </div>
);

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen p-6 pb-20 bg-[var(--theme-bg-app)]">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="w-64 h-10 rounded-lg bg-[var(--theme-bg-subtle)] mb-2" />
                    <div className="w-48 h-4 rounded bg-[var(--theme-bg-subtle)]" />
                </div>
                <div className="flex gap-3">
                    <div className="w-32 h-10 rounded-lg bg-[var(--theme-bg-subtle)]" />
                    <div className="w-32 h-10 rounded-lg bg-[var(--theme-bg-subtle)]" />
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
                {/* KPI Row */}
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />

                {/* Main Chart */}
                <ChartSkeleton height="h-[450px]" className="md:col-span-3" />

                {/* Radar Chart */}
                <ChartSkeleton height="h-[450px]" className="" />

                {/* Site Matrix */}
                <ListSkeleton rows={6} className="md:col-span-2 h-[400px]" />

                {/* Top Products & Recent Sales */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                    <ListSkeleton rows={5} />
                    <ListSkeleton rows={5} />
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-animate {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
        </div>
    );
}
