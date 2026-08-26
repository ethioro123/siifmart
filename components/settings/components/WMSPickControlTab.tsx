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
            <div className="flex items-center gap-2 p-1.5 bg-[#FAF8F5] dark:bg-black/40 rounded-2xl border border-[#E2DCCE] dark:border-white/10 mb-6">
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
                            className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${active
                                ? 'bg-[#2C5E3B] text-white shadow-md'
                                : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            <Icon size={14} /> {subTab.label}
                            {subTab.count ? <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-md text-[8px] animate-pulse font-bold">{subTab.count}</span> : null}
                        </button>
                    );
                })}
            </div>

            {activeSubTab === 'strategies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fulfillmentSites.map(site => (
                        <div key={site.id} className={`p-6 rounded-3xl border transition-all duration-300 ${isSaving === site.id ? 'border-[#2C5E3B] bg-[#2C5E3B]/5' : 'border-[#E2DCCE] dark:border-white/10 bg-white/80 dark:bg-black/20'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2]">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#1E3F27] dark:text-white">{site.name}</p>
                                        <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase">{site.type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleFulfillmentNode(site.id, !site.isFulfillmentNode)}
                                    disabled={!!isSaving}
                                    title={`Toggle node for ${site.name}`}
                                    className={`w-11 h-6 rounded-full relative transition-all cursor-pointer p-1 ${site.isFulfillmentNode ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${site.isFulfillmentNode ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-stone-600 dark:text-gray-400 uppercase tracking-widest block">Operational Strategy</label>
                                <select
                                    value={site.fulfillmentStrategy || 'NEAREST'}
                                    onChange={(e) => handleStrategyChange(site.id, e.target.value as FulfillmentStrategy)}
                                    disabled={!!isSaving}
                                    title={`Select strategy for ${site.name}`}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] transition-all disabled:opacity-50"
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
                    <div className="flex items-center gap-4 bg-white/80 dark:bg-black/20 p-4 rounded-2xl border border-[#E2DCCE] dark:border-white/10">
                        <Layers size={20} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <select
                            value={selectedSiteId}
                            onChange={(e) => setSelectedSiteId(e.target.value)}
                            title="Select site"
                            className="bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] transition-all"
                        >
                            {fulfillmentSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {siteZones.map(zone => (
                            <div key={zone.id} className={`p-5 rounded-3xl border transition-all ${isSaving === zone.id ? 'border-[#2C5E3B] bg-[#2C5E3B]/5' : 'border-[#E2DCCE] dark:border-white/10 bg-white/80 dark:bg-black/20'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase">{zone.name}</h4>
                                        <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-lg uppercase mt-1 inline-block">{zone.zoneType || 'Standard'}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="1" max="100"
                                        title={`Priority for ${zone.name}`}
                                        value={zone.pickingPriority || 10}
                                        onChange={(e) => handlePriorityChange(zone.id, parseInt(e.target.value))}
                                        className="w-16 bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2 py-1 text-center text-xs font-bold text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeSubTab === 'release' && (
                <div className="bg-white/80 dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between bg-[#FAF8F5] dark:bg-black/30">
                        <h3 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Pending Release Orders
                        </h3>
                    </div>
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5]/80 dark:bg-white/5 border-b border-[#E2DCCE]/60 dark:border-white/5 text-[10px] font-black text-[#4D6E56] dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Order Ref</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-white/5">
                                {pendingOrders.map(sale => (
                                    <tr key={sale.id} className="hover:bg-[#2C5E3B]/[0.03] transition-colors">
                                        <td className="px-6 py-4"><div className="font-bold text-[#1E3F27] dark:text-white font-mono">{sale.receiptNumber}</div></td>
                                        <td className="px-6 py-4 text-stone-500 dark:text-gray-400">{formatDateTime(sale.date || sale.created_at || '')}</td>
                                        <td className="px-6 py-4"><span className="bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] px-2 py-1 rounded-lg font-bold">{sale.items.length} units</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <Button onClick={() => handleReleaseClick(sale.id)} loading={isSaving === sale.id} icon={<Play size={12} />} className="text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-xl">Release</Button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingOrders.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400 dark:text-gray-600 uppercase text-[10px] font-black tracking-widest">Queue Clear — No Pending Orders</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
