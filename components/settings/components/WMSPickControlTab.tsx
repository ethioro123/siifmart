import React, { useState, useEffect } from 'react';
import { Globe, Layers, Clock, MapPin, Play } from 'lucide-react';
import { Site, FulfillmentStrategy, SaleRecord } from '../../../types';
import { sitesService, warehouseZonesService } from '../../../services/supabase.service';
import { formatDateTime } from '../../../utils/formatting';
import { logger } from '../../../utils/logger';
import { useStore } from '../../../contexts/CentralStore';
import Button from '../../shared/Button';

interface WMSPickControlTabProps {
    fulfillmentSites: Site[];
    pendingOrders: SaleRecord[];
    onReleaseOrder: (saleId: string) => Promise<void>;
    refreshData: () => void;
}

export const WMSPickControlTab: React.FC<WMSPickControlTabProps> = ({
    fulfillmentSites,
    pendingOrders,
    onReleaseOrder,
    refreshData,
}) => {
    const { showToast } = useStore();
    const [activeSubTab, setActiveSubTab] = useState<'strategies' | 'zones' | 'release'>('strategies');
    const [selectedSiteId, setSelectedSiteId] = useState<string>(fulfillmentSites[0]?.id || '');
    const [siteZones, setSiteZones] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedSiteId) return;
        warehouseZonesService.getAll(selectedSiteId).then(setSiteZones);
    }, [selectedSiteId]);

    const handleStrategyChange = async (siteId: string, strategy: FulfillmentStrategy) => {
        setIsSaving(siteId);
        try {
            await sitesService.update(siteId, { fulfillmentStrategy: strategy });
            showToast('Fulfillment strategy updated', 'success');
            refreshData();
        } catch (error) {
            logger.error('WMSSettings', 'caught error', error as Error);
            showToast('Failed to update strategy', 'error');
        } finally {
            setIsSaving(null);
        }
    };

    const handleToggleFulfillmentNode = async (siteId: string, isNode: boolean) => {
        setIsSaving(siteId);
        try {
            await sitesService.update(siteId, { isFulfillmentNode: isNode });
            showToast('Fulfillment node status updated', 'success');
            refreshData();
        } catch (error) {
            logger.error('WMSSettings', 'caught error', error as Error);
            showToast('Failed to update node status', 'error');
        } finally {
            setIsSaving(null);
        }
    };

    const handlePriorityChange = async (zoneId: string, priority: number) => {
        setIsSaving(zoneId);
        try {
            await warehouseZonesService.update(zoneId, { pickingPriority: priority });
            showToast('Zone priority updated', 'success');
            refreshData();
        } catch (error) {
            logger.error('WMSSettings', 'caught error', error as Error);
            showToast('Failed to update zone priority', 'error');
        } finally {
            setIsSaving(null);
        }
    };

    const handleReleaseClick = async (saleId: string) => {
        setIsSaving(saleId);
        try {
            await onReleaseOrder(saleId);
            showToast('Order released to pick queue', 'success');
        } catch (error) {
            logger.error('WMSSettings', 'caught error', error as Error);
            showToast('Failed to release order', 'error');
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] mb-6">
                {[
                    { id: 'strategies', label: 'Strategies', icon: Globe },
                    { id: 'zones', label: 'Zone Priority', icon: Layers },
                    { id: 'release', label: 'Order Release', icon: Clock, count: pendingOrders.length },
                ].map(subTab => {
                    const Icon = subTab.icon;
                    const active = activeSubTab === subTab.id;
                    return (
                        <button
                            key={subTab.id}
                            onClick={() => setActiveSubTab(subTab.id as any)}
                            className={`min-h-[38px] flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${active
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]/50'
                                }`}
                        >
                            <Icon size={14} /> {subTab.label}
                            {subTab.count ? (
                                <span className="px-1.5 py-0.5 bg-[var(--theme-status-danger-bg)] text-[var(--theme-text-primary)] rounded-full text-[10px] font-semibold">
                                    {subTab.count}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {activeSubTab === 'strategies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fulfillmentSites.map(site => (
                        <div key={site.id} className={`p-5 rounded-2xl border transition-all ${isSaving === site.id ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/5' : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] shadow-xs'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--theme-text-primary)]">{site.name}</p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wide">{site.type}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggleFulfillmentNode(site.id, !site.isFulfillmentNode)}
                                    disabled={!!isSaving}
                                    title={`Toggle node for ${site.name}`}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer disabled:opacity-40"
                                >
                                    <div className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${site.isFulfillmentNode ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]' : 'bg-[var(--theme-border)]'}`}>
                                        <div className={`w-5 h-5 bg-[var(--theme-bg-card)] rounded-full shadow-xs transition-transform ${site.isFulfillmentNode ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block">Operational Strategy</label>
                                <select
                                    value={site.fulfillmentStrategy || 'NEAREST'}
                                    onChange={(e) => handleStrategyChange(site.id, e.target.value as FulfillmentStrategy)}
                                    disabled={!!isSaving}
                                    title={`Select strategy for ${site.name}`}
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30 transition-all disabled:opacity-40"
                                >
                                    <option value="NEAREST">Nearest Warehouse</option>
                                    <option value="LOCAL_ONLY">Local Only</option>
                                    <option value="SPLIT">Split (Cross-Site)</option>
                                    <option value="MANUAL">Manual Control</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeSubTab === 'zones' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 bg-[var(--theme-bg-card)] p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <Layers size={16} />
                        </div>
                        <select
                            value={selectedSiteId}
                            onChange={(e) => setSelectedSiteId(e.target.value)}
                            title="Select site"
                            className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30 transition-all"
                        >
                            {fulfillmentSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {siteZones.map(zone => (
                            <div key={zone.id} className={`p-4 rounded-2xl border transition-all ${isSaving === zone.id ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/5' : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)] shadow-xs'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">{zone.name}</h4>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] rounded-full uppercase mt-1 inline-block">{zone.zoneType || 'Standard'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-[var(--theme-text-secondary)]">Priority:</span>
                                        <input
                                            type="number"
                                            min="1" max="100"
                                            title={`Priority for ${zone.name}`}
                                            value={zone.pickingPriority || 10}
                                            onChange={(e) => handlePriorityChange(zone.id, parseInt(e.target.value))}
                                            className="w-16 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 py-1.5 text-center text-xs font-semibold text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSubTab === 'release' && (
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-subtle)]">
                        <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                            <Clock size={15} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" /> Pending Release Orders
                        </h3>
                    </div>
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                    <th className="px-6 py-3.5">Order Ref</th>
                                    <th className="px-6 py-3.5">Date</th>
                                    <th className="px-6 py-3.5">Items</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {pendingOrders.map(sale => (
                                    <tr key={sale.id} className="hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                                        <td className="px-6 py-4"><div className="font-semibold text-[var(--theme-text-primary)] font-mono">{sale.receiptNumber}</div></td>
                                        <td className="px-6 py-4 text-[var(--theme-text-secondary)]">{formatDateTime(sale.date || sale.created_at || '')}</td>
                                        <td className="px-6 py-4"><span className="bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] px-2.5 py-0.5 rounded-full text-xs font-semibold">{sale.items.length} units</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleReleaseClick(sale.id)}
                                                disabled={isSaving === sale.id}
                                                className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                                            >
                                                {isSaving === sale.id ? <span className="w-3.5 h-3.5 border-2 border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)] border-t-[var(--theme-border)] rounded-full animate-spin" /> : <Play size={12} />}
                                                Release
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingOrders.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-[var(--theme-text-secondary)] text-xs font-medium">Queue Clear — No Pending Orders</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
