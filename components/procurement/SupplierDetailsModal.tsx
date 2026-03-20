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
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-bold">Category</p>
                        <p className="text-white font-bold">{supplier.category}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-bold">Type</p>
                        <p className="text-white font-bold">{supplier.type}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                        <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${supplier.status === 'Active' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'
                            }`}>
                            {supplier.status}
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Performance</p>
                        <div className="flex items-center justify-center gap-1 text-yellow-400 font-bold">
                            <Star size={14} fill="currentColor" /> {supplier.rating}
                        </div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Lead Time</p>
                        <p className="text-white font-bold">{supplier.leadTime} Days</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Payment Terms</p>
                        <p className="text-white font-bold">{supplier.paymentTerms || 'Net 30'}</p>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>

                    {supplier.phone && (
                        <button
                            onClick={() => {
                                window.location.href = `tel:${supplier.phone}`;
                                showToast(`Calling ${supplier.name}...`, 'success');
                            }}
                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30">
                                <Phone className="text-green-400" size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-bold text-sm">Call</p>
                                <p className="text-xs text-gray-400">{supplier.phone}</p>
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
                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                                <Mail className="text-blue-400" size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-bold text-sm">Email</p>
                                <p className="text-xs text-gray-400">{supplier.email}</p>
                            </div>
                            <ExternalLink size={14} className="text-gray-500" />
                        </button>
                    )}

                    {supplier.location && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <MapPin className="text-purple-400" size={18} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Location</p>
                                <p className="text-xs text-gray-400">{supplier.location}</p>
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
