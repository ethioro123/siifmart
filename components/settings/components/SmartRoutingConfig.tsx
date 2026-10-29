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

    if (isLoading) return <div className="text-[var(--theme-text-secondary)] text-sm">Loading routing engine...</div>;

    return (
        <div className="space-y-6">
            <div className="p-4 bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/20 dark:border-[var(--theme-accent)]/30 rounded-2xl flex items-start gap-3">
                <MapPin className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Smart Putaway Routing</h4>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                        Configure default zones for incoming product categories. When new products arrive, the WMS will automatically suggest these zones for putaway.
                    </p>
                </div>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] mb-4">Add Routing Rule</h3>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="text-[11px] uppercase text-[var(--theme-text-secondary)] font-semibold tracking-wider block mb-1.5">Category</label>
                        <select
                            title="Product Category"
                            aria-label="Product Category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                        >
                            {ALL_CATEGORY_OPTIONS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-center pb-3 hidden sm:flex">
                        <ArrowRight className="text-[var(--theme-text-secondary)]" size={18} />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[11px] uppercase text-[var(--theme-text-secondary)] font-semibold tracking-wider block mb-1.5">Default Zone</label>
                        <select
                            title="Default Zone"
                            aria-label="Default Zone"
                            value={newZone}
                            onChange={(e) => setNewZone(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                        >
                            {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name} ({z.type})</option>
                            ))}
                            {zones.length === 0 && <option value="">No zones configured for site</option>}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddMapping}
                        disabled={isSaving || !newZone || zones.length === 0}
                        className="h-10 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40 shrink-0"
                    >
                        {isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                        Add Rule
                    </button>
                </div>
            </div>

            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                    <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)]">
                        <tr>
                            <th className="px-6 py-3.5 text-[11px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider">Product Category</th>
                            <th className="px-6 py-3.5 text-[11px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider">Default Putaway Zone</th>
                            <th className="px-6 py-3.5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {mappings.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-[var(--theme-text-secondary)] text-xs font-medium">
                                    No routing rules configured.
                                </td>
                            </tr>
                        ) : (
                            mappings.map(mapping => (
                                <tr key={mapping.id} className="hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-[var(--theme-text-primary)] text-xs">
                                        {mapping.category}
                                    </td>
                                    <td className="px-6 py-4 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-mono text-xs font-semibold">
                                        {mapping.defaultZone}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMapping(mapping.category)}
                                            className="p-2 text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] rounded-lg transition-colors cursor-pointer"
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
