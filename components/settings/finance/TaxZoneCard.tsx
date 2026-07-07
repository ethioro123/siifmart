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
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyber-primary/10 flex items-center justify-center text-cyber-primary">
                        <Globe size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">{zone.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-white/5 px-2 py-0.5 rounded">{zone.type}</span>
                            {zone.rules.length > 0 && (
                                <span className="text-[10px] font-mono font-bold text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded">
                                    {effectiveRate.toFixed(1)}% Total
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={onDelete} title="Delete Jurisdiction" className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Assigned Sites */}
            <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase font-black mb-2 flex items-center gap-1">
                    <MapPin size={10} /> Assigned Sites ({assignedSites.length})
                </p>
                <div className="flex flex-wrap gap-2">
                    {assignedSites.length === 0 && (
                        <span className="text-[10px] text-yellow-500/70 italic">No sites assigned</span>
                    )}
                    {assignedSites.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-1.5 bg-cyber-primary/5 border border-cyber-primary/20 rounded-full px-2 py-1 group/site">
                            <span className="text-[10px] text-cyber-primary font-bold">{s.name}</span>
                            <button
                                onClick={() => onUnassignSite(s.id)}
                                title={`Unassign ${s.name} from jurisdiction`}
                                className="text-cyber-primary/40 hover:text-red-400 transition-colors"
                            >
                                <Plus size={10} className="rotate-45" />
                            </button>
                        </div>
                    ))}
                    {availableSites.length > 0 && (
                        <select
                            title="Assign site to this jurisdiction"
                            onChange={(e) => {
                                if (e.target.value) {
                                    onAssignSite(e.target.value, zone.id);
                                    e.target.value = "";
                                }
                            }}
                            className="bg-transparent border border-dashed border-white/10 rounded-full px-2 py-0.5 text-[10px] text-gray-500 hover:border-cyber-primary/30 outline-none cursor-pointer"
                        >
                            <option value="">+ Assign Site</option>
                            {availableSites.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black flex items-center gap-1">
                    <Percent size={10} /> Tax Rules ({zone.rules.length})
                </p>
                {zone.rules.length === 0 && (
                    <p className="text-[10px] text-gray-600 italic py-2">No rules defined yet</p>
                )}
                {zone.rules.map((rule: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 group/rule">
                        <div className="flex items-center gap-2">
                            {rule.compound ? <Layers size={14} className="text-purple-400" /> : <Percent size={14} className="text-cyber-primary" />}
                            <span className="text-xs text-gray-300">{rule.name}</span>
                            {rule.compound && <span className="text-[8px] text-purple-400 uppercase">compound</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-white">{rule.rate}%</span>
                            <button
                                onClick={() => onDeleteRule(zone.id, idx)}
                                title="Delete Rule"
                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover/rule:opacity-100 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    onClick={onAddRule}
                    title="Add Tax Rule"
                    className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-gray-500 hover:text-cyber-primary hover:border-cyber-primary/30 transition-colors flex items-center justify-center gap-1"
                >
                    <Plus size={12} /> Add Rule
                </button>
            </div>
        </div>
    );
};
export default TaxZoneCard;
