import React from 'react';
import { Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/metrics';

interface TopProductsWidgetProps {
    products: any[];
}

export const TopProductsWidget = ({ products }: TopProductsWidgetProps) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 h-full relative overflow-hidden flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                    <Zap className="text-[var(--theme-status-warning-text)]" size={16} />
                    Top Performing Products
                </h3>
            </div>

            <div className="space-y-3 relative z-10 overflow-y-auto custom-scrollbar pr-1">
                {products.length === 0 ? (
                    <div className="text-xs text-[var(--theme-text-muted)] font-mono text-center py-4">NO SALES DATA</div>
                ) : (
                    products.map((p, i) => (
                        <div key={i} className="group relative">
                            <div className="flex justify-between items-end mb-1 text-xs">
                                <span className="font-semibold text-[var(--theme-text-primary)] truncate w-2/3 flex items-center gap-2">
                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] shrink-0 font-bold ${
                                        i === 0
                                            ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                    }`}>
                                        {i + 1}
                                    </span>
                                    <span className="truncate">{p.name}</span>
                                </span>
                                <span className="font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">{formatCurrency(p.sales)}</span>
                            </div>
                            <div className="w-full bg-[var(--theme-border)] h-1.5 rounded-full overflow-hidden">
                                {/* eslint-disable-next-line react/forbid-dom-props */}
                                <div
                                    className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-500"
                                    ref={(el) => { if (el) el.style.width = `${(p.sales / products[0].sales) * 100}%`; }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
