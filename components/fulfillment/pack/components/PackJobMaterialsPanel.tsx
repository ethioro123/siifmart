import React from 'react';
import { Truck, Info, AlertTriangle, Snowflake } from 'lucide-react';
import { WMSJob, Site } from '../../../../types';
import { formatJobId } from '../../../../utils/jobIdFormatter';
import { ProgressBar } from '../../../shared/ProgressBar';

interface PackJobMaterialsPanelProps {
    progressPercent: number;
    isFullyPacked: boolean;
    destSite: Site | undefined;
    job: WMSJob;
    boxSize: 'Small' | 'Medium' | 'Large' | 'Extra Large';
    setBoxSize: (size: 'Small' | 'Medium' | 'Large' | 'Extra Large') => void;
    hasFragileItems: boolean | undefined;
    packingMaterials: { bubbleWrap: boolean; fragileStickers: boolean };
    setPackingMaterials: (materials: { bubbleWrap: boolean; fragileStickers: boolean }) => void;
    hasColdItems: boolean | undefined;
    hasIcePack: boolean;
    setHasIcePack: (hasIce: boolean) => void;
    t: (key: string) => string;
}

export const PackJobMaterialsPanel: React.FC<PackJobMaterialsPanelProps> = ({
    progressPercent,
    isFullyPacked,
    destSite,
    job,
    boxSize,
    setBoxSize,
    hasFragileItems,
    packingMaterials,
    setPackingMaterials,
    hasColdItems,
    hasIcePack,
    setHasIcePack,
    t,
}) => {
    return (
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 p-4 lg:p-6 border-t lg:border-t-0 border-[#E2DCCE]/60 dark:border-white/10 bg-stone-50 dark:bg-black/10">
            {/* Progress */}
            <div className="bg-white dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/10 rounded-2xl p-5">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">{t('warehouse.putaway.progress')}</span>
                    <span className="text-xl font-mono font-black text-gray-900 dark:text-white leading-none">{Math.round(progressPercent)}%</span>
                </div>
                <ProgressBar
                    progress={progressPercent}
                    containerClassName="h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden"
                    fillClassName={`h-full transition-all duration-300 ${isFullyPacked ? 'bg-green-500' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2]'}`}
                />
            </div>

            {/* Shipping Info */}
            <div className="bg-white dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <span className="text-[10px] text-gray-550 font-black uppercase tracking-widest block">{t('warehouse.packing.shipping')}</span>

                <div className="flex items-center gap-3">
                    <Truck size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 w-4 h-4" />
                    <div className="min-w-0">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block truncate">{t('warehouse.to')}</span>
                        <span className="text-gray-900 dark:text-white text-sm font-bold break-words leading-tight block">
                            {destSite ? (
                                <>
                                    {destSite.name} <span className="text-gray-500 dark:text-zinc-650 font-normal lowercase">({destSite.code || destSite.id})</span>
                                </>
                            ) : ((job as any).customerName || 'Customer')}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Info size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 w-4 h-4" />
                    <div className="min-w-0">
                        <span className="text-[9px] text-gray-555 font-black uppercase tracking-widest block truncate">{t('warehouse.putaway.jobDetails')}</span>
                        <span className="text-gray-900 dark:text-white text-sm font-bold font-mono truncate block">{formatJobId(job)}</span>
                    </div>
                </div>
            </div>

            {/* Packing Options */}
            <div className="bg-white dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <span className="text-[10px] text-gray-555 font-black uppercase tracking-widest block">{t('warehouse.packingOptions')}</span>

                <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-2">{t('warehouse.boxSize')}</label>
                    <select title="Box Size" aria-label="Select Box Size" value={boxSize} onChange={(e) => setBoxSize(e.target.value as any)} className="w-full bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/10 hover:border-[#CFC6B4] dark:hover:border-white/20 text-[#1E3F27] dark:text-[#EAE5D9] rounded-xl p-3 text-sm outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:bg-white dark:focus:bg-zinc-900 transition-all focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10">
                        <option value="Small">{t('warehouse.boxSmall')}</option>
                        <option value="Medium">{t('warehouse.boxMedium')}</option>
                        <option value="Large">{t('warehouse.boxLarge')}</option>
                        <option value="Extra Large">{t('warehouse.boxXL')}</option>
                    </select>
                </div>

                {hasFragileItems && (
                    <div className="pt-2 border-t border-[#E2DCCE]/60 dark:border-white/10">
                        <p className="text-[9px] text-red-655 dark:text-red-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={10} /> {t('warehouse.packing.fragile')}</p>
                        <label className="flex items-center gap-3 mb-2 cursor-pointer group">
                            <input type="checkbox" aria-label="Bubble Wrap" title="Bubble Wrap" checked={packingMaterials.bubbleWrap} onChange={e => setPackingMaterials({ ...packingMaterials, bubbleWrap: e.target.checked })} className="w-4 h-4 rounded border-[#E2DCCE] dark:border-white/20 text-[#2C5E3B] dark:text-[#A9CBA2] focus:ring-[#2C5E3B] dark:focus:ring-[#A9CBA2] focus:ring-offset-white dark:focus:ring-offset-black bg-white dark:bg-black/40" />
                            <span className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t('warehouse.packing.bubbleWrap')}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" aria-label="Fragile Stickers" title="Fragile Stickers" checked={packingMaterials.fragileStickers} onChange={e => setPackingMaterials({ ...packingMaterials, fragileStickers: e.target.checked })} className="w-4 h-4 rounded border-[#E2DCCE] dark:border-white/20 text-[#2C5E3B] dark:text-[#A9CBA2] focus:ring-[#2C5E3B] dark:focus:ring-[#A9CBA2] focus:ring-offset-white dark:focus:ring-offset-black bg-white dark:bg-black/40" />
                            <span className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t('warehouse.packing.stickers')}</span>
                        </label>
                    </div>
                )}

                {hasColdItems && (
                    <div className="pt-2 border-t border-[#E2DCCE]/60 dark:border-white/10">
                        <p className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Snowflake size={10} /> {t('warehouse.packing.coldChain')}</p>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" aria-label="Ice Packs" title="Ice Packs" checked={hasIcePack} onChange={e => setHasIcePack(e.target.checked)} className="w-4 h-4 rounded border-[#E2DCCE] dark:border-white/20 text-[#2C5E3B] dark:text-[#A9CBA2] focus:ring-[#2C5E3B] dark:focus:ring-[#A9CBA2] focus:ring-offset-white dark:focus:ring-offset-black bg-white dark:bg-black/40" />
                            <span className="text-sm text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t('warehouse.packing.icePacks')}</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};
