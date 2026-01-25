import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema } from '../schemas/inventory.schema';
import { Product } from '../types';
import Button from './shared/Button';
import {
    Box, Package, RefreshCw, Barcode, CheckCircle, Link, X, Plus, Scan, Info,
    MapPin, Calendar, Tag, DollarSign, Layers, Scale, Ruler, Archive, AlertTriangle,
    Truck, Copy, Sparkles, Image as ImageIcon
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import { CURRENCY_SYMBOL, COMMON_UNITS, GROCERY_CATEGORIES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFormProps {
    initialData?: Partial<Product>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            id: initialData?.id || '',
            name: initialData?.name || '',
            brand: initialData?.brand || '',
            category: initialData?.category || '',
            size: initialData?.size || '',
            unit: initialData?.unit || 'piece',
            packQuantity: initialData?.packQuantity || 1,
            price: initialData?.price || 0,
            costPrice: initialData?.costPrice || 0,
            stock: initialData?.stock || 0,
            sku: initialData?.sku || '',
            barcode: initialData?.barcode || '',
            barcodes: initialData?.barcodes || [],
            location: initialData?.location || '',
            expiryDate: initialData?.expiryDate || '',
            image: initialData?.image || '',
            status: (initialData?.status as any) || 'active',
            ...initialData
        }
    });

    const formData = watch();
    const [activeSection, setActiveSection] = useState<'details' | 'inventory' | 'logistics'>('details');

    // Auto-generate preview name
    const previewName = `${formData.brand ? formData.brand + ' ' : ''}${formData.name || 'New Product'} ${formData.size ? formData.size + (formData.unit !== 'piece' ? formData.unit : '') : ''}`;

    const categories = Object.keys(GROCERY_CATEGORIES);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[80vh]" noValidate>

            {/* --- HEADER PREVIEW --- */}
            <div className="flex-shrink-0 p-6 bg-[#0a0a0a] border-b border-white/10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                    {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <Package className="text-gray-700" size={28} />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded border border-cyber-primary/20">
                            {initialData?.id ? 'Editing Schema' : 'New SKU'}
                        </span>
                        {formData.sku && <span className="text-[10px] font-mono text-gray-500">{formData.sku}</span>}
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">{previewName}</h2>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Layers size={10} /> {formData.category || 'Uncategorized'}</span>
                        <span className="text-gray-600">•</span>
                        <span className="flex items-center gap-1 text-green-400 font-mono"><DollarSign size={10} /> {formData.price}</span>
                    </p>
                </div>
            </div>

            {/* --- NAVIGATION TABS --- */}
            <div className="flex bg-[#111] border-b border-white/5 px-6">
                <button
                    type="button"
                    onClick={() => setActiveSection('details')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSection === 'details' ? 'border-cyber-primary text-cyber-primary' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    <StarIcon size={14} /> Product Identity
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection('inventory')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSection === 'inventory' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    <DollarSign size={14} /> Pricing & Stock
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection('logistics')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSection === 'logistics' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                    <Truck size={14} /> Logistics
                </button>
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#0f0f0f]">

                <AnimatePresence mode="wait">
                    {activeSection === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            {/* Image Section */}
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-6 items-start hover:border-white/10 transition-colors">
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                        <ImageIcon size={16} className="text-purple-400" />
                                        Visual Identification
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4">High-fidelity product imagery is critical for POS efficiency.</p>
                                    <ImageUpload
                                        value={formData.image || undefined}
                                        onChange={(val) => setValue('image', val)}
                                        placeholder="Drag & Drop Product Image"
                                        size="lg"
                                    />
                                </div>
                            </div>

                            {/* Core Fields Grid */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2 md:col-span-1 space-y-4">
                                    <div className="group">
                                        <label className="text-[10px] text-cyber-primary font-black uppercase mb-1.5 flex items-center gap-2">
                                            Brand / Manufacturer
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyber-primary transition-colors" size={14} />
                                            <input
                                                {...register('brand')}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/20 transition-all font-medium placeholder:text-gray-700"
                                                placeholder="e.g. Coca-Cola, Nike, Apple"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="text-[10px] text-cyber-primary font-black uppercase mb-1.5 flex items-center gap-2">
                                            Product Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyber-primary transition-colors" size={14} />
                                            <input
                                                {...register('name')}
                                                className={`w-full bg-black/40 border ${errors.name ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/20 transition-all font-bold placeholder:text-gray-700`}
                                                placeholder="e.g. Zero Sugar Can 330ml"
                                            />
                                        </div>
                                        {errors.name && <p className="text-red-400 text-[10px] mt-1 font-bold flex items-center gap-1"><AlertTriangle size={10} /> {errors.name.message as string}</p>}
                                    </div>
                                </div>

                                <div className="col-span-2 md:col-span-1 space-y-4">
                                    <div className="group">
                                        <label className="text-[10px] text-cyber-primary font-black uppercase mb-1.5 flex items-center gap-2">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyber-primary transition-colors" size={14} />
                                            <select
                                                {...register('category')}
                                                className={`w-full bg-black/40 border ${errors.category ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-10 pr-8 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50 transition-all appearance-none cursor-pointer`}
                                            >
                                                <option value="">Select Category...</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">▼</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="group">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Size / Vol</label>
                                            <div className="relative">
                                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                                <input
                                                    {...register('size')}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white focus:border-cyber-primary/50 focus:outline-none transition-all"
                                                    placeholder="500"
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Unit</label>
                                            <select
                                                {...register('unit')}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-cyber-primary/50 focus:outline-none transition-all appearance-none"
                                            >
                                                {COMMON_UNITS.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'inventory' && (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-6">
                                {/* Pricing Card */}
                                <div className="col-span-2 md:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-green-500/20 transition-all group">
                                    <h3 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
                                        <DollarSign size={16} /> Financials
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Retail Price (Inc. Tax) <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono font-bold">{CURRENCY_SYMBOL}</span>
                                                <input
                                                    {...register('price', { valueAsNumber: true })}
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-lg font-mono font-bold text-white focus:border-green-500/50 focus:outline-none transition-all text-right"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Cost Price (Ex. Tax)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono">{CURRENCY_SYMBOL}</span>
                                                <input
                                                    {...register('costPrice', { valueAsNumber: true })}
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-gray-300 focus:border-cyber-primary/50 focus:outline-none transition-all text-right"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Inventory Card */}
                                <div className="col-span-2 md:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all">
                                    <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                                        <Box size={16} /> Quantitative
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Initial Stock Level</label>
                                            <div className="relative">
                                                <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                                <input
                                                    {...register('stock', { valueAsNumber: true })}
                                                    type="number"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-lg font-mono font-bold text-white focus:border-blue-500/50 focus:outline-none transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                                <Info size={10} /> Auto-triggers putaway job
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Pack Quantity</label>
                                            <div className="relative">
                                                <Archive className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                                                <input
                                                    {...register('packQuantity', { valueAsNumber: true })}
                                                    type="number"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm font-mono text-gray-300 focus:border-cyber-primary/50 focus:outline-none transition-all"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'logistics' && (
                        <motion.div
                            key="logistics"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-5">
                                <div>
                                    <label className="text-[10px] text-cyber-primary font-black uppercase mb-1.5 flex items-center gap-2">
                                        Primary Barcode
                                        <span className="bg-cyber-primary/10 text-cyber-primary px-1.5 py-0.5 rounded text-[9px] border border-cyber-primary/20">SCANNABLE</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={18} />
                                            <input
                                                {...register('barcode')}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xl font-mono text-white tracking-widest focus:border-cyber-primary/50 focus:outline-none transition-all shadow-inner"
                                                placeholder="Scan Item..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">SKU Code</label>
                                        <div className="relative">
                                            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                            <input
                                                {...register('sku')}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm font-mono text-gray-300 focus:border-cyber-primary/50 focus:outline-none transition-all"
                                                placeholder="Generates Auto if Empty"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Bin Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                            <input
                                                {...register('location')}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm font-mono text-gray-300 focus:border-cyber-primary/50 focus:outline-none transition-all"
                                                placeholder="e.g. A-04-12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-red-400 font-bold uppercase mb-1.5 block">Batch Expiry</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={14} />
                                        <input
                                            {...register('expiryDate')}
                                            type="date"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm font-mono text-white focus:border-red-500/50 focus:outline-none transition-all appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* --- FOOTER ACTIONS --- */}
            <div className="p-6 border-t border-white/10 bg-[#0f0f0f] flex gap-4">
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    variant="ghost"
                    className="flex-1 py-4 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors"
                >
                    Discard
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    icon={<CheckCircle size={18} />}
                    className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {initialData?.id ? 'Save Updates' : 'Initialize Product'}
                </Button>
            </div>
        </form>
    );
}

// Simple icon component for display
const StarIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
