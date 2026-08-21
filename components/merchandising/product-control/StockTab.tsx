import React from 'react';
import { Hash, RefreshCw, Save } from 'lucide-react';
import { Product } from '../../../types';
import { getSellUnit } from '../../../utils/units';

export interface StockConfig {
    minStock: string;
    maxStock: string;
}

interface Props {
    product: Product;
    stockCfg: StockConfig;
    setStockCfg: React.Dispatch<React.SetStateAction<StockConfig>>;
    handleSaveStock: () => Promise<void>;
    isSaving: boolean;
    sellUnit: string;
}

export const StockTab: React.FC<Props> = ({
    product,
    stockCfg,
    setStockCfg,
    handleSaveStock,
    isSaving,
    sellUnit
}) => {
    const unitDef = getSellUnit(sellUnit);

    return (
        <div className="space-y-4">
            <div className="p-3 bg-stone-50 dark:bg-black/15 rounded-xl border border-stone-200 dark:border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[9px] text-stone-400 font-bold uppercase">Current Stock</p>
                    <p className="text-2xl font-black font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">
                        {product.stock} <span className="text-sm font-bold">{unitDef.shortLabel}</span>
                    </p>
                </div>
                <Hash size={28} className="text-stone-200 dark:text-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 block mb-1.5">Min Stock (Reorder Point)</label>
                    <input type="number" min="0" value={stockCfg.minStock}
                        onChange={e => setStockCfg(c => ({ ...c, minStock: e.target.value }))}
                        placeholder="e.g. 10"
                        className="w-full bg-stone-50 dark:bg-black/30 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500 transition-colors" />
                    <p className="text-[9px] text-stone-400 mt-1">Alert triggered below this level</p>
                </div>
                <div>
                    <label className="text-[9px] font-bold uppercase text-green-600 dark:text-green-400 block mb-1.5">Max Stock (Capacity)</label>
                    <input type="number" min="0" value={stockCfg.maxStock}
                        onChange={e => setStockCfg(c => ({ ...c, maxStock: e.target.value }))}
                        placeholder="e.g. 100"
                        className="w-full bg-stone-50 dark:bg-black/30 border border-green-200 dark:border-green-500/20 rounded-xl px-3 py-2 text-sm font-mono font-bold text-green-700 dark:text-green-400 focus:outline-none focus:border-green-500 transition-colors" />
                    <p className="text-[9px] text-stone-400 mt-1">Replenishment target ceiling</p>
                </div>
            </div>

            {(stockCfg.minStock || stockCfg.maxStock) && (() => {
                const min = parseInt(stockCfg.minStock) || 0;
                const max = parseInt(stockCfg.maxStock) || 0;
                const pct = max > 0 ? Math.min(100, (product.stock / max) * 100) : 0;
                const isLow = min > 0 && product.stock < min;
                return (
                    <div className="p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5 space-y-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase">
                            <span className={isLow ? 'text-red-400' : 'text-stone-400'}>{isLow ? '⚠ Below Min — Reorder Needed' : '✓ Within Policy'}</span>
                            <span className="text-stone-400">{Math.round(pct)}% of max</span>
                        </div>
                        <div className="h-2 bg-stone-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : pct > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                                ref={el => { if (el) el.style.width = `${pct}%`; }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-stone-500 font-mono">
                            <span>Min: {min || '—'}</span>
                            <span className="font-bold text-gray-900 dark:text-white">Now: {product.stock}</span>
                            <span>Max: {max || '—'}</span>
                        </div>
                    </div>
                );
            })()}

            <button onClick={handleSaveStock} disabled={isSaving}
                className="w-full py-3 bg-[#2C5E3B] hover:bg-[#1B3520] text-white rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all">
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Saving...' : 'Save Stock Policies'}
            </button>
        </div>
    );
};
