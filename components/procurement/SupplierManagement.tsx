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
            <div className="flex justify-between items-center glass-panel p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-lg">
                        <Building size={24} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Supplier Directory</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{suppliers.length} Active Partners</p>
                    </div>
                </div>
                <Protected permission="MANAGE_SUPPLIERS">
                    <button
                        onClick={() => setIsAddSupplierOpen(true)}
                        className="woody-btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Add New Supplier
                    </button>
                </Protected>
            </div>

            {/* Suppliers Table */}
            <div className="glass-panel overflow-x-auto">
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                        <tr className="glass-panel-pushed border-b border-[#E2DCCE]/50 dark:border-emerald-950/20 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">
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
                                    className="border-b border-[#E2DCCE]/30 dark:border-emerald-950/10 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group last:border-0"
                                >
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] group-hover:bg-[#2C5E3B]/10 dark:group-hover:bg-[#A9CBA2]/10 transition-colors border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.06]">
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{sup.name}</h3>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-500 font-mono font-bold uppercase">Terms: {sup.paymentTerms || 'Net 30'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-black uppercase tracking-wide">{sup.category}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold italic">{sup.type}</span>
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
                                                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm text-gray-900 dark:text-white font-black">{sup.rating}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-600 font-bold">/ 5.0</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] w-[98%]"></div>
                                            </div>
                                            <span className="text-[9px] text-emerald-600 dark:text-green-400 font-black uppercase tracking-wider">98% OTIF Score</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            {sup.email ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors font-bold">
                                                    <Mail size={12} />
                                                    <span className="truncate max-w-[150px]">{sup.email}</span>
                                                </div>
                                            ) : null}
                                            {sup.phone ? (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors font-bold">
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
                                            className="px-3 py-1.5 glass-panel-pushed hover:bg-[#224429] dark:hover:bg-[#EAE5D9] hover:text-white dark:hover:text-[#1E3B24] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:border-[#224429] dark:hover:border-[#EAE5D9] text-gray-500 dark:text-gray-300 flex items-center gap-2 ml-auto"
                                        >
                                            <Package size={14} /> Catalog
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="block md:hidden divide-y divide-[#E2DCCE]/30 dark:divide-emerald-950/10">
                    {paginatedSuppliers.map((sup) => {
                        const Icon = getSupplierIcon(sup.type);
                        return (
                            <div
                                key={sup.id}
                                onClick={() => handleSupplierClick(sup)}
                                className="p-4 space-y-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                {/* Name, Status, rating */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] group-hover:bg-[#2C5E3B]/10 dark:group-hover:bg-[#A9CBA2]/10 transition-colors border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.06]">
                                            <Icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{sup.name}</h3>
                                            <p className="text-[10px] text-gray-500 font-mono font-bold uppercase mt-0.5">Terms: {sup.paymentTerms || 'Net 30'}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wide ${sup.status === 'Active' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                                        {sup.status}
                                    </div>
                                </div>

                                {/* Category, Rating, Performance */}
                                <div className="grid grid-cols-2 gap-2 text-left bg-gray-50/50 dark:bg-black/10 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div>
                                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Category</span>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 font-black uppercase mt-0.5">{sup.category}</p>
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold italic mt-0.5">{sup.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Performance</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-xs text-gray-900 dark:text-white font-black">{sup.rating}</span>
                                            <span className="text-[10px] text-gray-400">/ 5.0</span>
                                        </div>
                                        <span className="text-[8px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider block mt-0.5">98% OTIF</span>
                                    </div>
                                </div>

                                {/* Contacts & Quick Action */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex flex-col gap-0.5 text-left">
                                        {sup.email && (
                                            <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{sup.email}</span>
                                        )}
                                        {sup.phone && (
                                            <span className="text-[10px] text-gray-500">{sup.phone}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleCatalogClick(e, sup)}
                                        className="px-3 py-1.5 glass-panel-pushed hover:bg-[#224429] dark:hover:bg-[#EAE5D9] hover:text-white dark:hover:text-[#1E3B24] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all text-gray-500 dark:text-gray-300 flex items-center gap-1.5"
                                    >
                                        <Package size={12} /> Catalog
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
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
            <div className="flex items-center justify-between p-4 glass-panel-pushed rounded-2xl">
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                    Showing <span className="text-gray-900 dark:text-gray-300 font-black">{paginatedSuppliers.length}</span> of <span className="text-gray-900 dark:text-gray-300 font-black">{totalCount}</span> Partners
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1.5 glass-panel-pushed rounded-lg text-xs font-black text-gray-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-4 glass-panel-pushed rounded-lg">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mr-2">Page</span>
                        <span className="text-sm font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{currentPage}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mx-2">of</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-white font-black">{totalPages || 1}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages || loading}
                        className="px-3 py-1.5 glass-panel-pushed rounded-lg text-xs font-black text-gray-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
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
