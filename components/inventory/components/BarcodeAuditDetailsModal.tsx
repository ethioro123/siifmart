import React from 'react';
import { Barcode, User, Clock, Trash2 } from 'lucide-react';
import Modal from '../../Modal';
import { formatDateTime } from '../../../utils/formatting';

interface BarcodeAuditDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any;
    employeeName: string;
    userRole?: string;
    onDelete: (record: any) => void;
    onOpenFullscreenImage: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const BarcodeAuditDetailsModal: React.FC<BarcodeAuditDetailsModalProps> = ({
    isOpen,
    onClose,
    record,
    employeeName,
    userRole,
    onDelete,
    onOpenFullscreenImage
}) => {
    if (!record) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Barcode Mapping Evidence & Details"
        >
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div 
                        onClick={() => {
                            if (record.image_url) {
                                onOpenFullscreenImage({
                                    url: record.image_url,
                                    title: record.product?.name || 'Product Evidence Photo',
                                    subtitle: `Barcode: ${record.barcode} • SKU: ${record.product?.sku || 'N/A'}`
                                });
                            }
                        }}
                        className={`w-24 h-24 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shrink-0 relative group/img ${record.image_url ? 'cursor-zoom-in' : ''}`}
                        title={record.image_url ? 'Click to view full photo' : ''}
                    >
                        {record.image_url ? (
                            <img src={record.image_url} alt="Evidence" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Barcode className="opacity-20" size={32} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--theme-text-primary)] font-sans">{record.product?.name || 'Catalog Product'}</h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-xs font-mono">
                                {record.product?.sku || 'NO SKU'}
                            </span>
                            <span className="px-2 py-1 rounded-xl bg-[var(--theme-pill-bg)] text-[var(--theme-text-primary)] border border-[var(--theme-pill-border)] text-xs font-mono font-bold flex items-center gap-1">
                                <Barcode size={12} /> {record.barcode}
                            </span>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--theme-text-muted)]">
                            <div className="flex items-center gap-1 font-medium text-[var(--theme-text-secondary)]">
                                <User size={12} /> {employeeName}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={12} /> {formatDateTime(record.created_at || record.createdAt || '', { showTime: true })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-sm space-y-2">
                    <h4 className="font-bold text-[var(--theme-text-primary)] uppercase text-[10px] tracking-wider mb-1">Audit Summary</h4>
                    <p className="text-[var(--theme-text-secondary)]">
                        Barcode <b className="font-mono text-[var(--theme-text-primary)]">{record.barcode}</b> was registered by <b>{employeeName}</b> and mapped to <b>"{record.product?.name || 'Product'}"</b>.
                    </p>
                    <p className="text-[var(--theme-text-muted)] text-xs">
                        Automatically synced across all store POS checkout registers and WMS pick/pack scanners.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors text-sm font-medium cursor-pointer"
                    >
                        Close
                    </button>
                    {['super_admin', 'admin', 'warehouse_manager', 'operations_manager', 'regional_manager'].includes(userRole || '') && (
                        <button
                            type="button"
                            onClick={() => {
                                onDelete(record);
                                onClose();
                            }}
                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                            <Trash2 size={14} /> Remove Mapping
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
export default BarcodeAuditDetailsModal;
