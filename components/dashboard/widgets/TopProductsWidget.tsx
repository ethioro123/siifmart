import React from 'react';
import { Zap } from 'lucide-react';
import { formatCurrency } from '../../../utils/metrics';

interface TopProductsWidgetProps {
    products: any[];
}

export const TopProductsWidget = ({ products }: TopProductsWidgetProps) => {
    return (
        <div className="glass-panel rounded-3xl p-6 h-full relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <Zap className="text-yellow-500 dark:text-yellow-400" size={16} />
                    Top Performing Products
                </h3>
            </div>

            <div className="space-y-2 relative z-10 overflow-y-auto custom-scrollbar pr-1">
                {products.length === 0 ? (
                    <div className="text-xs text-gray-500 font-mono text-center py-4">NO SALES DATA</div>
                ) : (
                    products.map((p, i) => (
                        <div key={i} className="group relative">
                            <div className="flex justify-between items-end mb-1 text-xs">
                                <span className="font-bold text-gray-700 dark:text-gray-300 truncate w-2/3 flex items-center gap-2">
                                    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                                        {i + 1}
                                    </span>
                                    {p.name}
                                </span>
                                <span className="font-mono text-cyber-primary">{formatCurrency(p.sales)}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-black/40 h-1.5 rounded-full overflow-hidden">
                                {/* eslint-disable-next-line react/forbid-dom-props */}
                                <div
                                    className="h-full bg-gradient-to-r from-cyber-primary to-cyan-400 rounded-full transition-all duration-1000"
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
