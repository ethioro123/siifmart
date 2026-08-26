import React from 'react';
import { Globe, Trash2, MapPin, Plus, Percent, Layers } from 'lucide-react';

interface TaxZoneCardProps {
    zone: any;
    onDelete: () => void;
    onAddRule: () => void;
    onDeleteRule: (zoneId: string, ruleIndex: number) => void;
    sites: any[];
    onAssignSite: (siteId: string, zoneId: string | null) => void;
    onUnassignSite: (siteId: string) => void;
}

export const TaxZoneCard: React.FC<TaxZoneCardProps> = ({
    zone,
    onDelete,
    onAddRule,
    onDeleteRule,
    sites,
    onAssignSite,
    onUnassignSite
}) => {
    const assignedSites = sites.filter((s: any) => s.taxJurisdictionId === zone.id);
    const availableSites = sites.filter((s: any) => !s.taxJurisdictionId);

    const effectiveRate = zone.rules.reduce((sum: number, r: any) => sum + (r.rate || 0), 0);

    return (
        <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 hover:border-[#2C5E3B]/40 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] flex items-center justify-center border border-emerald-200 dark:border-emerald-950/30">
                        <Globe size={18} />
                    </div>
                    <div>
                        <h4 className="font-black text-sm text-[#1E3F27] dark:text-white">{zone.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] uppercase font-black tracking-wide text-stone-500 bg-white/60 dark:bg-white/5 px-2 py-0.5 rounded-lg">{zone.type}</span>
                            {zone.rules.length > 0 && (
                                <span className="text-[10px] font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2 py-0.5 rounded-lg">
                                    {effectiveRate.toFixed(1)}% Total
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={onDelete} title="Delete Jurisdiction" className="text-stone-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg cursor-pointer">
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Assigned Sites */}
            <div className="mb-4">
                <p className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black mb-2 flex items-center gap-1">
                    <MapPin size={10} /> Assigned Locations ({assignedSites.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {assignedSites.length === 0 && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 italic">No locations linked</span>
                    )}
                    {assignedSites.map((s: any) => (
                        <span key={s.id} className="text-[10px] font-bold bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 px-2 py-1 rounded-xl text-[#1E3F27] dark:text-gray-300 flex items-center gap-1.5">
                            {s.name}
                            <button
                                onClick={() => onUnassignSite(s.id)}
                                className="text-stone-400 hover:text-red-600 font-black cursor-pointer"
                                title="Unassign"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Rules */}
            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-black flex items-center gap-1">
                        <Layers size={10} /> Tax Rules ({zone.rules.length})
                    </p>
                    <button
                        onClick={onAddRule}
                        className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
                    >
                        <Plus size={10} /> Add Rule
                    </button>
                </div>

                <div className="space-y-1.5">
                    {zone.rules.map((rule: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-white/70 dark:bg-black/20 rounded-xl border border-[#E2DCCE]/60 dark:border-white/5 text-xs">
                            <span className="text-stone-700 dark:text-gray-300 font-bold">{rule.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{rule.rate}%</span>
                                <button
                                    onClick={() => onDeleteRule(zone.id, idx)}
                                    className="text-stone-400 hover:text-red-600 cursor-pointer"
                                    title="Delete rule"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Assign Dropdown */}
            {availableSites.length > 0 && (
                <div className="pt-3 border-t border-[#E2DCCE]/60 dark:border-white/10 flex items-center gap-2">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                onAssignSite(e.target.value, zone.id);
                                e.target.value = '';
                            }
                        }}
                        className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-stone-600 dark:text-gray-300 font-medium outline-none focus:border-[#2C5E3B]"
                        defaultValue=""
                    >
                        <option value="" disabled>+ Assign Location...</option>
                        {availableSites.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
