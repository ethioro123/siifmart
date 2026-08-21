import React, { useState, useEffect } from 'react';
import { MapPin, Save, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { categoryZonesService, CategoryZoneMapping } from '../../../services/category-zones.service';
import Button from '../../shared/Button';
import { ALL_CATEGORY_OPTIONS } from '../../../constants';
import { warehouseZonesService } from '../../../services/supabase.service';
import { logger } from '../../../utils/logger';

interface Props {
    siteId: string;
}

export default function SmartRoutingConfig({ siteId }: Props) {
    const { addNotification } = useData();
    const [mappings, setMappings] = useState<CategoryZoneMapping[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New mapping state
    const [newCategory, setNewCategory] = useState<string>(ALL_CATEGORY_OPTIONS[0]);
    const [newZone, setNewZone] = useState<string>('');

    useEffect(() => {
        if (!siteId) return;
        loadData();
    }, [siteId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedMappings, fetchedZones] = await Promise.all([
                categoryZonesService.getMappings(siteId),
                warehouseZonesService.getAll(siteId)
            ]);
            setMappings(fetchedMappings);
            setZones(fetchedZones);
            if (fetchedZones.length > 0) {
                setNewZone(fetchedZones[0].name);
            }
        } catch (error) {
            logger.error('SmartRoutingConfig', 'Failed to load config', error as Error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMapping = async () => {
        if (!newCategory || !newZone) {
            addNotification('alert', 'Please select a category and a zone');
            return;
        }

        setIsSaving(true);
        try {
            const added = await categoryZonesService.setMapping(siteId, newCategory, newZone);
            setMappings(prev => [...prev.filter(m => m.category !== newCategory), added]);
            addNotification('success', 'Smart routing rule added');
        } catch (error) {
            logger.error('SmartRoutingConfig', 'Failed to add rule', error as Error);
            addNotification('alert', 'Failed to add rule');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMapping = async (category: string) => {
        try {
            await categoryZonesService.removeMapping(siteId, category);
            setMappings(prev => prev.filter(m => m.category !== category));
            addNotification('success', 'Rule removed');
        } catch (error) {
            logger.error('SmartRoutingConfig', 'Failed to remove rule', error as Error);
            addNotification('alert', 'Failed to remove rule');
        }
    };

    if (isLoading) return <div className="text-gray-400 text-sm">Loading routing engine...</div>;

    return (
        <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <MapPin className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-emerald-400 font-bold text-sm">Smart Putaway Routing</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Configure default zones for incoming product categories. When new products arrive, the WMS will automatically suggest these zones for putaway.
                    </p>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Add Routing Rule</h3>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] uppercase text-gray-400 font-black tracking-widest block mb-2">Category</label>
                        <select
                            title="Product Category"
                            aria-label="Product Category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2C5E3B]"
                        >
                            {ALL_CATEGORY_OPTIONS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-center pb-3 hidden sm:flex">
                        <ArrowRight className="text-gray-500" size={20} />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[10px] uppercase text-gray-400 font-black tracking-widest block mb-2">Default Zone</label>
                        <select
                            title="Default Zone"
                            aria-label="Default Zone"
                            value={newZone}
                            onChange={(e) => setNewZone(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2C5E3B]"
                        >
                            {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name} ({z.type})</option>
                            ))}
                            {zones.length === 0 && <option value="">No zones configured for site</option>}
                        </select>
                    </div>
                    <Button onClick={handleAddMapping} loading={isSaving} icon={<Plus size={16} />} disabled={!newZone || zones.length === 0}>
                        Add Rule
                    </Button>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/40 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">Product Category</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 tracking-widest">Default Putaway Zone</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {mappings.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No routing rules configured.
                                </td>
                            </tr>
                        ) : (
                            mappings.map(mapping => (
                                <tr key={mapping.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white text-sm">
                                        {mapping.category}
                                    </td>
                                    <td className="px-6 py-4 text-emerald-400 font-mono text-sm">
                                        {mapping.defaultZone}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleRemoveMapping(mapping.category)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Remove Rule"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
