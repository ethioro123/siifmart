import React from 'react';

const CardSkeleton = ({ className }: { className?: string }) => (
    <div className={`bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animate" />
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10" />
            <div className="w-16 h-6 rounded-full bg-white/10" />
        </div>
        <div className="space-y-3">
            <div className="w-24 h-3 rounded bg-white/10" />
            <div className="w-32 h-8 rounded bg-white/10" />
            <div className="w-40 h-3 rounded bg-white/10" />
        </div>
    </div>
);

const ChartSkeleton = ({ height = "h-[400px]", className }: { height?: string, className?: string }) => (
    <div className={`bg-white/5 border border-white/5 rounded-3xl p-6 ${height} relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animate" />
        <div className="w-48 h-6 rounded bg-white/10 mb-8" />
        <div className="flex items-end space-x-4 h-[calc(100%-60px)] pb-4">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className="bg-white/5 rounded-t-lg w-full"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                />
            ))}
        </div>
    </div>
);

const ListSkeleton = ({ rows = 5, className }: { rows?: number, className?: string }) => (
    <div className={`bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animate" />
        <div className="w-40 h-6 rounded bg-white/10 mb-6" />
        <div className="space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-white/10" />
                        <div className="space-y-2">
                            <div className="w-32 h-3 rounded bg-white/10" />
                            <div className="w-20 h-2 rounded bg-white/10" />
                        </div>
                    </div>
                    <div className="w-16 h-4 rounded bg-white/10" />
                </div>
            ))}
        </div>
    </div>
);

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen p-6 pb-20 bg-black">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="w-64 h-10 rounded-lg bg-white/10 mb-2" />
                    <div className="w-48 h-4 rounded bg-white/10" />
                </div>
                <div className="flex gap-3">
                    <div className="w-32 h-10 rounded-lg bg-white/10" />
                    <div className="w-32 h-10 rounded-lg bg-white/10" />
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
