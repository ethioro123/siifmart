import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { cashDropsService } from '../../../services/cash-drops.service';
import { realtimeService } from '../../../services/realtime.service';
import type { CashDropRecord } from '../../../types/pos-zero-trust';
import { Vault, Truck, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { logger } from '../../../utils/logger';

interface SafeLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SafeLedgerModal: React.FC<SafeLedgerModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { activeSite, effectiveCountry, addNotification } = useData();
    const [drops, setDrops] = useState<CashDropRecord[]>([]);
    const [selectedDrops, setSelectedDrops] = useState<string[]>([]);
    const [armoredManifest, setArmoredManifest] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const countryCode = ((activeSite?.country || effectiveCountry || 'ET') as string).toUpperCase();
    const currency = countryCode === 'KE' ? 'KSh' : 'ETB';

    const loadDrops = async () => {
        setIsLoading(true);
        try {
            const data = await cashDropsService.getSafeLedger(activeSite?.id || 'All', countryCode);
            setDrops(data);
        } catch (err) {
            logger.warn('SafeLedgerModal', 'Failed to load safe drops', { error: String(err) });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDrops();
            setSelectedDrops([]);
            setArmoredManifest(`ARM-${Date.now().toString().slice(-6)}`);

            const sub = realtimeService.subscribeToCashDrops(() => {
                loadDrops();
            }, activeSite?.id);
            return () => sub.unsubscribe();
        }
    }, [isOpen, activeSite?.id, countryCode]);

    const activeSafeDrops = drops.filter(d => d.status === 'deposited_in_safe');
    const totalInSafe = activeSafeDrops.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const handleSelectAll = () => {
        if (selectedDrops.length === activeSafeDrops.length) {
            setSelectedDrops([]);
        } else {
            setSelectedDrops(activeSafeDrops.map(d => d.id));
        }
    };

    const handleConfirmTransfer = async () => {
        if (selectedDrops.length === 0 || !user) return;
        setIsTransferring(true);
        try {
            await cashDropsService.transferSafeToBank(selectedDrops, armoredManifest, {
                id: user.id,
                name: user.name
            });
            addNotification('success', `${selectedDrops.length} Safe Bag(s) Transferred to Armored Carrier #${armoredManifest}.`);
            setIsTransferModalOpen(false);
            loadDrops();
            setSelectedDrops([]);
        } catch (err: any) {
            addNotification('alert', err?.message || 'Failed to transfer safe drops.');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('posCommand.safeLedgerTitle')}
            size="lg"
        >
            <div className="space-y-4">
                {/* Header Action & Site Indicator */}
                <div className="flex items-center justify-between gap-3 pb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                            {activeSite?.name || 'Store Location'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-medium">
                            {countryCode}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={loadDrops}
                        disabled={isLoading}
                        title="Refresh Safe Ledger"
                        aria-label="Refresh Safe Ledger"
                        className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                        <span>{t('common.refresh') || 'Refresh'}</span>
                    </button>
                </div>

                {/* Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">{t('posCommand.totalInSafe')}</span>
                        <p className="text-xl font-mono font-bold text-[var(--theme-text-primary)]">
                            {currency} {totalInSafe.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">{t('posCommand.sealedBags')}</span>
                        <p className="text-xl font-mono font-bold text-[var(--theme-text-primary)]">
                            {activeSafeDrops.length}
                        </p>
                    </div>
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">{t('posCommand.selectedForTransit')}</span>
                            <p className="text-lg font-mono font-bold text-[var(--theme-primary)]">
                                {selectedDrops.length} bags
                            </p>
                        </div>
                        {selectedDrops.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsTransferModalOpen(true)}
                                className="px-3 py-1.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            >
                                <Truck size={13} className="text-[var(--theme-primary-text)] opacity-90" />
                                {t('posCommand.transitBtn')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Drops Table */}
                <div className="overflow-x-auto rounded-xl border border-[var(--theme-border)] isolate">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[var(--theme-border)] text-[10px] uppercase font-bold tracking-wider text-[var(--theme-thead-text)] bg-[var(--theme-bg-subtle)]">
                                <th className="py-2 px-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDrops.length > 0 && selectedDrops.length === activeSafeDrops.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-[var(--theme-border)]"
                                    />
                                </th>
                                <th className="py-2 px-3">{t('posCommand.thBagNumber')}</th>
                                <th className="py-2 px-3">{t('posCommand.cashier')}</th>
                                <th className="py-2 px-3">{t('posCommand.thSupervisor')}</th>
                                <th className="py-2 px-3 text-right">{t('inventory.price') || 'Amount'}</th>
                                <th className="py-2 px-3 text-center">{t('posCommand.thStatus')}</th>
                                <th className="py-2 px-3 text-right">{t('posCommand.thStartTime') || 'Timestamp'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)] font-mono">
                            {isLoading && drops.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[var(--theme-text-muted)] font-sans text-xs">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-[var(--theme-text-secondary)]" />
                                            <span>{t('posCommand.loadingSafeLedger')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : drops.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-[var(--theme-text-muted)] font-sans text-xs">
                                        {t('posCommand.noCashDropsRecorded')}
                                    </td>
                                </tr>
                            ) : (
                                drops.map((drop) => {
                                    const dropDate = new Date(drop.created_at);
                                    const isToday = dropDate.toDateString() === new Date().toDateString();
                                    const timeLabel = isToday
                                        ? dropDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : `${dropDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${dropDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                                    return (
                                        <tr key={drop.id} className="hover:bg-[var(--theme-table-row-hover)] transition-colors">
                                            <td className="py-2 px-3">
                                                {drop.status === 'deposited_in_safe' ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDrops.includes(drop.id)}
                                                        onChange={() => {
                                                            setSelectedDrops(prev =>
                                                                prev.includes(drop.id) ? prev.filter(id => id !== drop.id) : [...prev, drop.id]
                                                            );
                                                        }}
                                                        className="rounded border-[var(--theme-border)]"
                                                    />
                                                ) : (
                                                    <CheckCircle2 size={14} className="text-[var(--theme-status-success)]" />
                                                )}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-[var(--theme-text-primary)]">
                                                {drop.safe_bag_number || drop.drop_number}
                                            </td>
                                            <td className="py-2 px-3 font-sans text-[var(--theme-text-secondary)]">
                                                {drop.cashier_name}
                                            </td>
                                            <td className="py-2 px-3 font-sans text-[var(--theme-text-muted)]">
                                                {drop.supervisor_name} ({drop.supervisor_role})
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-[var(--theme-primary)]">
                                                {drop.currency || currency} {Number(drop.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-sans uppercase border ${
                                                    drop.status === 'deposited_in_safe'
                                                        ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                                        : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                }`}>
                                                    {drop.status === 'deposited_in_safe' ? t('posCommand.inSafeStatus') : t('posCommand.transferredToBankStatus')}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-right text-[var(--theme-text-muted)] text-[11px]">
                                                {timeLabel}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Transfer Modal Inner */}
                {isTransferModalOpen && (
                    <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl space-y-4 animate-in fade-in shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            <Truck size={16} className="text-[var(--theme-primary)]" />
                            <span>{t('posCommand.armoredCarrierHandshake')}</span>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[var(--theme-text-secondary)]">{t('posCommand.carrierManifestRef')}</label>
                            <input
                                type="text"
                                value={armoredManifest}
                                onChange={(e) => setArmoredManifest(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl font-mono text-xs text-[var(--theme-input-text)] outline-none focus:border-[var(--theme-border-focus)]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsTransferModalOpen(false)}
                                className="flex-1 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                            >
                                {t('common.back') || 'Back'}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmTransfer}
                                disabled={isTransferring || !armoredManifest.trim()}
                                className="flex-2 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                            >
                                {t('posCommand.signManifestBtn')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
