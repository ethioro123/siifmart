import React, { useState } from 'react';
import { Landmark, Globe, MapPin, Calculator, Plus, Trash2, Percent, Layers, ShieldCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const TaxZoneCard = ({ zone, onDelete }: any) => (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyber-primary/10 flex items-center justify-center text-cyber-primary">
                    <Globe size={18} />
                </div>
                <div>
                    <h4 className="font-bold text-white">{zone.name}</h4>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-white/5 px-2 py-0.5 rounded">{zone.type}</span>
                </div>
            </div>
            <button onClick={onDelete} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={16} />
            </button>
        </div>

        <div className="space-y-3">
            {zone.rules.map((rule: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5 hover:border-white/10">
                    <div className="flex items-center gap-2">
                        {rule.compound ? <Layers size={14} className="text-purple-400" /> : <Percent size={14} className="text-cyber-primary" />}
                        <span className="text-xs text-gray-300">{rule.name}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-white">{rule.rate}%</span>
                </div>
            ))}
            <button className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-gray-500 hover:text-cyber-primary hover:border-cyber-primary/30 transition-colors flex items-center justify-center gap-1">
                <Plus size={12} /> Add Rule
            </button>
        </div>
    </div>
);

export default function TaxSettings() {
    const { user } = useStore();
    const { settings, updateSettings } = useData(); // Using context for global settings consistency

    // Mock state for complex tax rules (normally would be in global context)
    const [taxZones, setTaxZones] = useState([
        {
            id: 1, name: 'Ethiopia (Federal)', type: 'National', rules: [
                { name: 'VAT', rate: 15, compound: false },
                { name: 'Turnover Tax', rate: 2, compound: false }
            ]
        },
        {
            id: 2, name: 'Addis Ababa', type: 'Region', rules: [
                { name: 'Municipal Tax', rate: 1, compound: true }
            ]
        }
    ]);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                <Calculator className="text-orange-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-orange-400 font-bold text-sm">Global Tax Matrix</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage multi-jurisdiction tax liabilities, compound rates, and category-specific overrides.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* MAIN CONFIG */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                    <SectionHeader title="Tax Jurisdictions" desc="Active tax zones and nexus definitions" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {taxZones.map(zone => (
                            <TaxZoneCard key={zone.id} zone={zone} onDelete={() => setTaxZones(taxZones.filter(z => z.id !== zone.id))} />
                        ))}

                        {/* Add New Zone Button */}
                        <button className="bg-black/20 border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide">Add Jurisdiction</span>
                        </button>
                    </div>
                </div>

                {/* SIDEBAR SETTINGS */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <SectionHeader title="Compliance" desc="Automated rules" />

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Layers size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Compound Tax</p>
                                    <p className="text-[10px] text-gray-400">Calculate tax on tax (e.g. VAT on top of Duty)</p>
                                    <div className="mt-2 text-xs font-bold text-cyber-primary">Global Enabled</div>
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Exemptions</p>
                                    <p className="text-[10px] text-gray-400">Auto-remove tax for qualified entities</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['NGO', 'Government', 'Export'].map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-300 border border-white/5">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyber-primary/10 to-transparent border border-cyber-primary/20">
                        <h5 className="text-cyber-primary font-bold text-sm mb-1">Tax Holiday Mode</h5>
                        <p className="text-xs text-gray-400 mb-3">Temporarily suspend specific taxes for promotional periods.</p>
                        <button className="w-full py-2 bg-cyber-primary/10 hover:bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 rounded-lg text-xs font-bold transition-colors">
                            Configure Schedule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
