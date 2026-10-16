import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { cashDropsService } from '../../../services/cash-drops.service';
import { realtimeService } from '../../../services/realtime.service';
import type { CashDropRecord } from '../../../types/pos-zero-trust';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Vault, ShieldCheck, Truck, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

interface SafeLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SafeLedgerModal: React.FC<SafeLedgerModalProps> = ({ isOpen, onClose }) => {
    const { user } = useStore();
    const { activeSite, effectiveCountry, addNotification } = useData();
    const [drops, setDrops] = useState<CashDropRecord[]>([]);
    const [selectedDrops, setSelectedDrops] = useState<string[]>([]);
    const [armoredManifest, setArmoredManifest] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const loadDrops = async () => {
        const data = await cashDropsService.getSafeLedger(activeSite?.id || 'All', activeSite?.country || effectiveCountry || 'ET');
        setDrops(data);
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
    }, [isOpen, activeSite?.id, effectiveCountry]);

    const activeSafeDrops = drops.filter(d => d.status === 'deposited_in_safe');
    const totalInSafe = activeSafeDrops.reduce((sum, d) => sum + d.amount, 0);

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
        } catch {
            addNotification('alert', 'Failed to transfer safe drops.');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Store Drop Safe Ledger (Cash Skim Custody)"
            size="lg"
        >
            <div className="p-4 sm:p-6 space-y-6">
                {/* Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">Total Cash in Drop Safe</span>
                        <p className="text-2xl font-mono font-bold text-[var(--theme-text-primary)]">
                            {CURRENCY_SYMBOL} {totalInSafe.toLocaleString()}
                        </p>
                    </div>
                    <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">Sealed Deposit Bags</span>
                        <p className="text-2xl font-mono font-bold text-[var(--theme-text-primary)]">
                            {activeSafeDrops.length}
                        </p>
                    </div>
                    <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">Selected for Transit</span>
                            <p className="text-xl font-mono font-bold text-[var(--theme-primary)]">
                                {selectedDrops.length} bags
                            </p>
                        </div>
                        {selectedDrops.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsTransferModalOpen(true)}
                                className="px-3.5 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer uppercase tracking-wider"
                            >
                                <Truck size={14} className="text-teal-300" />
                                Transit
                            </button>
                        )}
                    </div>
                </div>

                {/* Drops Table */}
                <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)] isolate">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[var(--theme-border)] text-[10px] uppercase font-bold tracking-wider text-[var(--theme-thead-text)] bg-[var(--theme-bg-subtle)]">
                                <th className="py-2.5 px-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDrops.length > 0 && selectedDrops.length === activeSafeDrops.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-[var(--theme-border)]"
                                    />
                                </th>
                                <th className="py-2.5 px-3">Bag #</th>
                                <th className="py-2.5 px-3">Cashier</th>
                                <th className="py-2.5 px-3">Supervisor</th>
                                <th className="py-2.5 px-3 text-right">Amount</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)] font-mono">
                            {drops.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-[var(--theme-text-muted)] font-sans text-xs">
                                        No cash drops recorded in the safe ledger.
                                    </td>
                                </tr>
                            ) : (
                                drops.map((drop) => (
                                    <tr key={drop.id} className="hover:bg-[var(--theme-table-row-hover)] transition-colors">
                                        <td className="py-3 px-3">
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
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            )}
                                        </td>
                                        <td className="py-3 px-3 font-bold text-[var(--theme-text-primary)]">
                                            {drop.safe_bag_number || drop.drop_number}
                                        </td>
                                        <td className="py-3 px-3 font-sans text-[var(--theme-text-secondary)]">
                                            {drop.cashier_name}
                                        </td>
                                        <td className="py-3 px-3 font-sans text-[var(--theme-text-muted)]">
                                            {drop.supervisor_name} ({drop.supervisor_role})
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-[var(--theme-primary)]">
                                            {drop.currency} {drop.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-sans uppercase border ${
                                                drop.status === 'deposited_in_safe'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            }`}>
                                                {drop.status === 'deposited_in_safe' ? 'In Safe' : 'Transferred to Bank'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-[var(--theme-text-muted)] text-[11px]">
                                            {new Date(drop.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Transfer Modal Inner */}
                {isTransferModalOpen && (
                    <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl space-y-4 animate-in fade-in shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            <Truck size={16} className="text-[var(--theme-primary)]" />
                            <span>Armored Carrier Bank Deposit Handshake</span>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[var(--theme-text-secondary)]">Carrier Manifest / Receipt Reference #</label>
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
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmTransfer}
                                disabled={isTransferring || !armoredManifest.trim()}
                                className="flex-2 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                            >
                                Sign Manifest & Release Safe Bags
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
