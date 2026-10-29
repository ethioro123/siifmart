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
                        className={`w-24 h-24 rounded-2xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] overflow-hidden shrink-0 relative group/img shadow-xs ${record.image_url ? 'cursor-zoom-in' : ''}`}
                        title={record.image_url ? 'Click to view full photo' : ''}
                    >
                        {record.image_url ? (
                            <img src={record.image_url} alt="Evidence" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)]">
                                <Barcode className="opacity-30" size={32} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">{record.product?.name || 'Catalog Product'}</h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[12px] font-mono tabular-nums">
                                {record.product?.sku || 'NO SKU'}
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 text-[12px] font-mono tabular-nums font-semibold flex items-center gap-1">
                                <Barcode size={13} /> {record.barcode}
                            </span>
                        </div>
                        <div className="mt-3.5 flex items-center gap-4 text-[12px] text-[var(--theme-text-secondary)]">
                            <div className="flex items-center gap-1.5 font-medium">
                                <User size={13} className="text-[var(--theme-text-secondary)]" /> {employeeName}
                            </div>
                            <div className="flex items-center gap-1.5 tabular-nums">
                                <Clock size={13} className="text-[var(--theme-text-secondary)]" /> {formatDateTime(record.created_at || record.createdAt || '', { showTime: true })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-hover)]/40 border border-[var(--theme-border)] text-[13px] space-y-2">
                    <h4 className="font-semibold text-[var(--theme-text-secondary)] uppercase text-[11px] tracking-wider mb-1">Audit Summary</h4>
                    <p className="text-[var(--theme-text-primary)] leading-relaxed">
                        Barcode <b className="font-mono tabular-nums text-[var(--theme-text-primary)]">{record.barcode}</b> was registered by <b className="font-semibold">{employeeName}</b> and mapped to <b className="font-semibold">"{record.product?.name || 'Product'}"</b>.
                    </p>
                    <p className="text-[var(--theme-text-secondary)] text-[12px]">
                        Automatically synced across all store POS checkout registers and WMS pick/pack scanners.
                    </p>
                </div>

                <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                        Close
                    </button>
                    {['group_ceo', 'country_managing_director', 'warehouse_manager', 'country_operations_director', 'regional_operations_manager'].includes(userRole || '') && (
                        <button
                            type="button"
                            onClick={() => {
                                onDelete(record);
                                onClose();
                            }}
                            className="h-9 px-4 rounded-xl bg-[var(--theme-status-danger-bg)]/10 hover:bg-[var(--theme-status-danger-bg)]/15 text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]/20 shadow-xs transition-all text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                        >
                            <Trash2 size={13} />
                            <span>Remove Mapping</span>
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
export default BarcodeAuditDetailsModal;
