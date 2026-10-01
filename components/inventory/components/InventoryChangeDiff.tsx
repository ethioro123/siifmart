import React from 'react';
import { ArrowRight, Package, RefreshCw } from 'lucide-react';
import { Product, PendingInventoryChange } from '../../../types';

interface InventoryChangeDiffProps {
    change: PendingInventoryChange;
    allProducts: Product[];
}

export const renderChangeDiff = (change: PendingInventoryChange, allProducts: Product[]) => {
    if (change.changeType !== 'edit' || !change.proposedChanges) return null;

    const original = allProducts.find(p => p.id === change.productId);
    if (!original) return <span className="text-gray-500 italic">Original product not found</span>;

    const diffs: React.ReactNode[] = [];
    const propsToCompare: (keyof Product)[] = ['name', 'category', 'price', 'costPrice', 'salePrice', 'stock', 'sku', 'location', 'image'];

    propsToCompare.forEach(prop => {
        const oldValue = original[prop];
        // @ts-ignore
        const newValue = change.proposedChanges[prop];

        if (newValue !== undefined && newValue !== oldValue) {
            diffs.push(
                <div key={prop as string} className="flex items-center gap-2 text-[10px] bg-gray-100 dark:bg-black/40 rounded px-1.5 py-0.5 border border-gray-200 dark:border-white/5">
                    <span className="text-gray-500 uppercase font-bold">{prop as string}:</span>
                    <span className="text-red-400 line-through truncate max-w-[60px]">{String(oldValue || 'None')}</span>
                    <ArrowRight size={10} className="text-blue-400 shrink-0" />
                    <span className="text-green-400 font-bold truncate max-w-[80px]">{String(newValue)}</span>
                </div>
            );
        }
    });

    if (diffs.length === 0) return <span className="text-amber-400/50 italic text-[10px]">No visible differences</span>;

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {diffs}
        </div>
    );
};

interface DetailedComparisonProps {
    requestForDetails: PendingInventoryChange | null;
    allProducts: Product[];
}

export const DetailedComparison: React.FC<DetailedComparisonProps> = ({ requestForDetails, allProducts }) => {
    if (!requestForDetails) return null;

    if (requestForDetails.changeType === 'create') {
        const prod = requestForDetails.proposedChanges as Product;
        return (
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex justify-center mb-4">
                    <div className="w-32 h-32 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                        {prod?.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={32} className="opacity-20" /></div>
                        )}
                    </div>
                </div>
                {Object.entries(prod || {}).map(([key, value]) => {
                    if (['id', 'image', 'description', 'reviews', 'related', 'createdAt'].includes(key)) return null;
                    if (typeof value === 'object') return null;
                    return (
                        <div key={key} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{String(value)}</p>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (requestForDetails.changeType === 'edit' && requestForDetails.proposedChanges) {
        const original = allProducts.find(p => p.id === requestForDetails.productId);
        if (!original) return <div className="text-center p-8 text-gray-500">Original product not found.</div>;

        return (
            <div className="space-y-4">
                <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Changed Fields</h5>
                <div className="grid grid-cols-1 gap-2">
                    {renderChangeDiff(requestForDetails, allProducts)}
                </div>
                <div className="mt-8">
                    <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">Full Json Comparison</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                            <h6 className="text-red-400 font-bold mb-2 uppercase">Original</h6>
                            <pre className="whitespace-pre-wrap text-gray-500">{JSON.stringify(original, null, 2)}</pre>
                        </div>
                        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                            <h6 className="text-green-400 font-bold mb-2 uppercase">Proposed</h6>
                            <pre className="whitespace-pre-wrap text-gray-500">{JSON.stringify({ ...original, ...requestForDetails.proposedChanges }, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (requestForDetails.changeType === 'stock_adjustment') {
        return (
            <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-center">
                <RefreshCw size={48} className="mx-auto text-yellow-500 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Stock Adjustment Request</h3>
                <div className="flex items-center justify-center gap-4 text-2xl font-mono my-6">
                    <span className="text-gray-500">Current: {allProducts.find(p => p.id === requestForDetails.productId)?.stock || 0}</span>
                    <ArrowRight className="text-gray-600" />
                    <span className={requestForDetails.adjustmentType === 'IN' ? 'text-green-400' : 'text-red-400'}>
                        {requestForDetails.adjustmentType === 'IN' ? '+' : '-'}{requestForDetails.adjustmentQty}
                    </span>
                </div>
                <div>
                    <p className="text-xs uppercase text-gray-500 font-bold mb-2">Reason Provided</p>
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 inline-block min-w-[300px]">
                        <span className="text-white text-lg font-bold block leading-tight">{requestForDetails.adjustmentReason}</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
