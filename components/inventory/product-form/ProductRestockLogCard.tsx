import React from 'react';
import { TrendingUp } from 'lucide-react';
import { StockMovement, Employee } from '../../../types';

interface ProductRestockLogCardProps {
    movements?: StockMovement[];
    employees?: Employee[];
    productId?: string;
    createdBy?: string;
    createdAt?: string;
}

export const ProductRestockLogCard: React.FC<ProductRestockLogCardProps> = ({
    movements,
    employees,
    productId,
    createdBy,
    createdAt
}) => {
    const recentReceives = movements && productId
        ? movements
            .filter(m => (m.productId === productId || (m as any).product_id === productId) && m.type === 'IN')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
        : [];

    return (
        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-2.5">
                <TrendingUp size={14} className="text-[var(--theme-text-secondary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                    Restock Log & Audits
                </h3>
            </div>

            {recentReceives.length > 0 ? (
                <div className="space-y-3 pl-2 border-l border-[var(--theme-border)] ml-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                    {recentReceives.map(m => (
                        <div key={m.id} className="relative flex flex-col gap-0.5">
                            <div className="absolute -left-[14px] top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-[var(--theme-bg-card)]" />
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-[var(--theme-text-primary)] uppercase">
                                    {employees?.find(e => e.id === m.performedBy)?.name || m.performedBy || 'System'}
                                </span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    +{m.quantity}
                                </span>
                            </div>
                            <span className="text-[11px] text-[var(--theme-text-muted)] font-mono">
                                {new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs font-medium text-[var(--theme-text-muted)] text-center py-4">
                    {productId ? 'No recent restocks logged' : 'Initial SKU registration — no movement history yet'}
                </p>
            )}

            <div className="pt-3 border-t border-[var(--theme-border)] text-[11px] space-y-1.5">
                <div className="flex justify-between">
                    <span className="text-[var(--theme-text-muted)] font-medium uppercase">Created By:</span>
                    <span className="font-semibold text-[var(--theme-text-primary)]">{createdBy || 'System'}</span>
                </div>
                {createdAt && (
                    <div className="flex justify-between">
                        <span className="text-[var(--theme-text-muted)] font-medium uppercase">Created Date:</span>
                        <span className="font-mono text-[var(--theme-text-primary)]">{new Date(createdAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
