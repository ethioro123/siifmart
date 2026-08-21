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
        <div className="w-full lg:w-72 flex flex-col gap-2.5 shrink-0 p-3 lg:p-4 border-t lg:border-t-0 lg:border-l border-[#E2DCCE]/60 dark:border-white/10 bg-stone-50 dark:bg-black/10">
            {/* Packing Options */}
            <div className="bg-white dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/10 rounded-xl p-3 flex flex-col gap-3 shadow-sm">
                <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">{t('warehouse.packingOptions')}</span>

                <div>
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest block mb-1">{t('warehouse.boxSize')}</label>
                    <select title="Box Size" aria-label="Select Box Size" value={boxSize} onChange={(e) => setBoxSize(e.target.value as any)} className="w-full bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/10 text-gray-900 dark:text-gray-200 rounded-lg p-2 text-xs outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]">
                        <option value="Small">{t('warehouse.boxSmall')}</option>
                        <option value="Medium">{t('warehouse.boxMedium')}</option>
                        <option value="Large">{t('warehouse.boxLarge')}</option>
                        <option value="Extra Large">{t('warehouse.boxXL')}</option>
                    </select>
                </div>

                {hasFragileItems && (
                    <div className="pt-2 border-t border-[#E2DCCE]/60 dark:border-white/10 space-y-1.5">
                        <p className="text-[8px] text-red-500 font-extrabold uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={9} /> {t('warehouse.packing.fragile')}</p>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                                <input type="checkbox" aria-label="Bubble Wrap" title="Bubble Wrap" checked={packingMaterials.bubbleWrap} onChange={e => setPackingMaterials({ ...packingMaterials, bubbleWrap: e.target.checked })} className="w-3.5 h-3.5 rounded border-gray-300 text-[#2C5E3B]" />
                                <span>{t('warehouse.packing.bubbleWrap')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                                <input type="checkbox" aria-label="Fragile Stickers" title="Fragile Stickers" checked={packingMaterials.fragileStickers} onChange={e => setPackingMaterials({ ...packingMaterials, fragileStickers: e.target.checked })} className="w-3.5 h-3.5 rounded border-gray-300 text-[#2C5E3B]" />
                                <span>{t('warehouse.packing.stickers')}</span>
                            </label>
                        </div>
                    </div>
                )}

                {hasColdItems && (
                    <div className="pt-2 border-t border-[#E2DCCE]/60 dark:border-white/10 space-y-1.5">
                        <p className="text-[8px] text-[#2C5E3B] dark:text-[#A9CBA2] font-extrabold uppercase tracking-widest flex items-center gap-1"><Snowflake size={9} /> {t('warehouse.packing.coldChain')}</p>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                            <input type="checkbox" aria-label="Ice Packs" title="Ice Packs" checked={hasIcePack} onChange={e => setHasIcePack(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-[#2C5E3B]" />
                            <span>{t('warehouse.packing.icePacks')}</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};
