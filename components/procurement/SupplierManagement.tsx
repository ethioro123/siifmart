import React, { useState, useMemo } from 'react';
import { Supplier, Product } from '../../types';
import { Protected } from '../../components/Protected';
import { Building, Plus, Search, Star, Mail, Phone, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import { getSupplierIcon } from './utils';
import { AddSupplierModal } from './AddSupplierModal';
import { SupplierDetailsModal } from './SupplierDetailsModal';
import { ProductCatalogModal } from './ProductCatalogModal';

interface SupplierManagementProps {
    suppliers: Supplier[];
    loading?: boolean;
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onAddSupplier: (supplier: Omit<Supplier, 'id' | 'status' | 'rating' | 'leadTime' | 'contact'>) => void;
    onOpenCreatePO: (product?: Product) => void;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
    suppliers,
    loading = false,
    totalCount,
    currentPage,
    onPageChange,
    onAddSupplier,
    onOpenCreatePO
}) => {
    const ITEMS_PER_PAGE = 20;

    // Modal States
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Use passed suppliers directly (server-side paginated)
    const paginatedSuppliers = suppliers;

    // Pagination Logic
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const handleSupplierClick = (sup: Supplier) => {
        setSelectedSupplier(sup);
        setIsContactModalOpen(true);
    };

    const handleCatalogClick = (e: React.MouseEvent, sup: Supplier) => {
        e.stopPropagation();
        setSelectedSupplier(sup);
        setIsProductCatalogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-black/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyber-primary/10 rounded-lg">
                        <Building size={24} className="text-cyber-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Supplier Directory</h2>
                        <p className="text-xs text-gray-400">{suppliers.length} Active Partners</p>
                    </div>
                </div>
                <Protected permission="MANAGE_SUPPLIERS">
                    <button
                        onClick={() => setIsAddSupplierOpen(true)}
                        className="px-4 py-2 bg-cyber-primary text-black rounded-lg font-bold flex items-center gap-2 hover:bg-cyber-accent transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] transform hover:scale-105"
                    >
                        <Plus size={18} /> Add New Supplier
                    </button>
                </Protected>
            </div>

            {/* Suppliers Table */}
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-cyber-primary/5 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="p-4 font-bold pl-6">Supplier Name</th>
                            <th className="p-4 font-bold">Category</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold">Performance</th>
                            <th className="p-4 font-bold">Contact Info</th>
                            <th className="p-4 font-bold text-right pr-6">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSuppliers.map((sup) => {
                            const Icon = getSupplierIcon(sup.type);
                            return (
                                <tr
                                    key={sup.id}
                                    onClick={() => handleSupplierClick(sup)}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group last:border-0"
                                >
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-cyber-primary group-hover:bg-cyber-primary/10 transition-colors">
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-cyber-primary transition-colors">{sup.name}</h3>
                                                <p className="text-[10px] text-gray-500 font-mono">Terms: {sup.paymentTerms || 'Net 30'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-300 font-medium">{sup.category}</span>
                                            <span className="text-[10px] text-gray-500">{sup.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${sup.status === 'Active' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sup.status === 'Active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                            {sup.status}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-sm text-white font-bold">{sup.rating}</span>
                                                <span className="text-xs text-gray-600">/ 5.0</span>
                                            </div>
                                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[98%]"></div>
                                            </div>
                                            <span className="text-[10px] text-green-400">98% OTIF Score</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            {sup.email ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                    <Mail size={12} />
                                                    <span className="truncate max-w-[150px]">{sup.email}</span>
                                                </div>
                                            ) : null}
                                            {sup.phone ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                    <Phone size={12} />
                                                    <span>{sup.phone}</span>
                                                </div>
                                            ) : null}
                                            {!sup.email && !sup.phone && <span className="text-xs text-gray-600 italic">No contact info</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <button
                                            onClick={(e) => handleCatalogClick(e, sup)}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-cyber-primary hover:text-black text-xs font-bold rounded-lg transition-all border border-white/10 hover:border-cyber-primary text-gray-300 flex items-center gap-2 ml-auto"
                                        >
                                            <Package size={14} /> Catalog
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {paginatedSuppliers.length === 0 && (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Search size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg font-bold text-gray-400">No suppliers found</p>
                        <p className="text-sm mt-1">Add a new supplier to get started.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border border-white/10 border-t-0 bg-black/20 rounded-b-2xl">
                <p className="text-xs text-gray-500 font-mono">
                    Showing <span className="text-gray-300">{paginatedSuppliers.length}</span> of <span className="text-gray-300">{totalCount}</span> Partners
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-4 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mr-2">Page</span>
                        <span className="text-sm font-mono font-bold text-yellow-500">{currentPage}</span>
                        <span className="text-[10px] text-gray-500 mx-2">of</span>
                        <span className="text-sm font-mono text-white">{totalPages || 1}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages || loading}
                        className="px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Modals */}
            <AddSupplierModal
                isOpen={isAddSupplierOpen}
                onClose={() => setIsAddSupplierOpen(false)}
                onAdd={onAddSupplier}
            />

            <SupplierDetailsModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                supplier={selectedSupplier}
            />

            <ProductCatalogModal
                isOpen={isProductCatalogOpen}
                onClose={() => setIsProductCatalogOpen(false)}
                supplier={selectedSupplier}
                onAddToPO={(product) => {
                    setIsProductCatalogOpen(false);
                    onOpenCreatePO(product);
                }}
            />
        </div>
    );
};
