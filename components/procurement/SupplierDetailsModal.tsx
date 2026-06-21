import React from 'react';
import Modal from '../../components/Modal';
import { Supplier } from '../../types';
import { Star, Phone, Mail, MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';

interface SupplierDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({ isOpen, onClose, supplier }) => {
    const { showToast } = useStore();

    if (!supplier) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Supplier Details: ${supplier.name || ''}`} size="lg">
            <div className="space-y-6">
                {/* Status & Overview */}
                <div className="flex items-center gap-4 glass-panel p-4">
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Category</p>
                        <p className="text-gray-900 dark:text-white font-black">{supplier.category}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Type</p>
                        <p className="text-gray-900 dark:text-white font-black">{supplier.type}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Status</p>
                        <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${supplier.status === 'Active' ? 'text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/5' : 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5'
                            }`}>
                            {supplier.status}
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="glass-panel p-3 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Performance</p>
                        <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold">
                            <Star size={14} fill="currentColor" /> {supplier.rating}
                        </div>
                    </div>
                    <div className="glass-panel p-3 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Lead Time</p>
                        <p className="text-gray-900 dark:text-white font-bold">{supplier.leadTime} Days</p>
                    </div>
                    <div className="glass-panel p-3 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Payment Terms</p>
                        <p className="text-gray-900 dark:text-white font-bold">{supplier.paymentTerms || 'Net 30'}</p>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest text-xs">Contact Information</h3>

                    {supplier.phone && (
                        <button
                            onClick={() => {
                                window.location.href = `tel:${supplier.phone}`;
                                showToast(`Calling ${supplier.name}...`, 'success');
                            }}
                            className="w-full flex items-center gap-3 p-3 glass-panel glass-panel-hover transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Phone className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-gray-900 dark:text-white font-bold text-sm">Call</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{supplier.phone}</p>
                            </div>
                            <ExternalLink size={14} className="text-gray-500" />
                        </button>
                    )}

                    {supplier.email && (
                        <button
                            onClick={() => {
                                window.location.href = `mailto:${supplier.email}?subject=Inquiry&body=Hello...`;
                                showToast(`Opening email...`, 'success');
                            }}
                            className="w-full flex items-center gap-3 p-3 glass-panel glass-panel-hover transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#8C6239]/10 dark:bg-[#E2C899]/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Mail className="text-[#8C6239] dark:text-[#E2C899]" size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-gray-900 dark:text-white font-bold text-sm">Email</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{supplier.email}</p>
                            </div>
                            <ExternalLink size={14} className="text-gray-500" />
                        </button>
                    )}

                    {supplier.location && (
                        <div className="w-full flex items-center gap-3 p-3 glass-panel transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center">
                                <MapPin className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-gray-900 dark:text-white font-bold text-sm">Location</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{supplier.location}</p>
                            </div>
                        </div>
                    )}

                    {!supplier.phone && !supplier.email && !supplier.location && (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No specific contact details available</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
