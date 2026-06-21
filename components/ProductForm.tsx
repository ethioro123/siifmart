import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema } from '../schemas/inventory.schema';
import { Product } from '../types';
import Button from './shared/Button';
import {
    Box, Package, RefreshCw, Barcode, CheckCircle, Plus, Scan, Info,
    MapPin, Calendar, Tag, DollarSign, Layers, Scale, Archive, AlertTriangle,
    Truck, Image as ImageIcon, TrendingDown, TrendingUp, Lock
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import { CURRENCY_SYMBOL, COMMON_UNITS, GROCERY_CATEGORIES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../contexts/CentralStore';

interface ProductFormProps {
    initialData?: Partial<Product>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    isReadOnly?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting, isReadOnly = false }: ProductFormProps) {
    const { user } = useStore();
    const canEditThresholds = user?.role === 'super_admin' || user?.role === 'store_manager';

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            id: initialData?.id || '', name: initialData?.name || '', brand: initialData?.brand || '',
            category: initialData?.category || '', size: initialData?.size || '', unit: initialData?.unit || 'piece',
            packQuantity: initialData?.packQuantity || 1, price: initialData?.price || 0, costPrice: initialData?.costPrice || 0,
            stock: initialData?.stock || 0, sku: initialData?.sku || '', barcode: initialData?.barcode || '',
            barcodes: initialData?.barcodes || [], location: initialData?.location || '', expiryDate: initialData?.expiryDate || '',
            image: initialData?.image || '', status: (initialData?.status as any) || 'active',
            minStock: initialData?.minStock ?? null, maxStock: initialData?.maxStock ?? null,
            ...initialData
        }
    });

    const formData = watch();
    const [activeSection, setActiveSection] = useState<'details' | 'inventory' | 'logistics'>('details');
    const previewName = `${formData.brand ? formData.brand + ' ' : ''}${formData.name || 'New Product'} ${formData.size ? formData.size + (formData.unit !== 'piece' ? formData.unit : '') : ''}`;
    const categories = Object.keys(GROCERY_CATEGORIES);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[80vh] bg-white dark:bg-[#0f0f0f]" noValidate>
            {isReadOnly && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 p-2 text-center text-[10px] text-amber-500 font-black uppercase tracking-widest">
                    READ ONLY MODE • EDITING DISABLED
                </div>
            )}

            {/* --- HEADER PREVIEW --- */}
            <div className="flex-shrink-0 p-6 bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                    {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <Package className="text-gray-400 dark:text-gray-700" size={28} />}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded border border-cyber-primary/20">{initialData?.id ? 'Editing Schema' : 'New SKU'}</span>
                        {formData.sku && <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{formData.sku}</span>}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{previewName}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1.5"><Layers size={11} className="text-blue-500" /> {formData.category || 'Uncategorized'}</span>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-mono font-bold"><DollarSign size={11} /> {formData.price}</span>
                    </p>
                </div>
            </div>

            {/* --- NAVIGATION TABS --- */}
            <div className="flex bg-white dark:bg-[#111] border-b border-gray-100 dark:border-white/5 px-6">
                {[
                    { id: 'details', label: 'Product Identity', icon: StarIcon, color: 'cyber-primary' },
                    { id: 'inventory', label: 'Pricing & Stock', icon: DollarSign, color: 'green-500' },
                    { id: 'logistics', label: 'Logistics', icon: Truck, color: 'blue-500' }
                ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveSection(tab.id as any)} className={`px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeSection === tab.id ? `border-${tab.color} text-${tab.color}` : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                        <tab.icon size={13} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white dark:bg-[#0f0f0f]">
                <AnimatePresence mode="wait">
                    {activeSection === 'details' && (
                        <motion.div key="details" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                            <div className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] flex gap-8 items-start">
                                <div className="flex-1">
                                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-2"><ImageIcon size={14} className="text-purple-400" /> Visual Identification</h3>
                                    <p className="text-[10px] text-gray-500 mb-6 font-medium">High-fidelity product imagery is critical for POS efficiency.</p>
                                    <ImageUpload value={formData.image || undefined} onChange={(val) => setValue('image', val)} placeholder="Drag & Drop Product Image" size="lg" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1 space-y-5">
                                    <FormGroup label="Brand / Manufacturer" icon={Tag}><input {...register('brand')} className="form-input" placeholder="e.g. Coca-Cola, Nike" /></FormGroup>
                                    <FormGroup label="Product Name *" icon={Package} error={errors.name?.message as string}><input {...register('name')} className={`form-input ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g. Zero Sugar Can 330ml" /></FormGroup>
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-5">
                                    <FormGroup label="Category *" icon={Layers}><select {...register('category')} className="form-input appearance-none cursor-pointer"><option value="">Select Category...</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></FormGroup>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormGroup label="Size / Vol" icon={Scale}><input {...register('size')} className="form-input" placeholder="500" /></FormGroup>
                                        <FormGroup label="Unit"><select {...register('unit')} className="form-input appearance-none">{COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></FormGroup>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeSection === 'inventory' && (
                        <motion.div key="inventory" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-2 gap-8">
                            <FinancialCard register={register} /> <QuantitativeCard register={register} watch={watch} thresholdsDisabled={isReadOnly || !canEditThresholds} />
                        </motion.div>
                    )}
                    {activeSection === 'logistics' && (
                        <motion.div key="logistics" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6"><LogisticsSection register={register} /></motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- FOOTER ACTIONS --- */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#0f0f0f] flex gap-4">
                <Button type="button" onClick={onCancel} disabled={isSubmitting} variant="ghost" className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/5 rounded-xl transition-all">Close</Button>
                {!isReadOnly && <Button type="submit" disabled={isSubmitting} loading={isSubmitting} icon={<CheckCircle size={18} />} className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]">{initialData?.id ? 'Save Updates' : 'Initialize Product'}</Button>}
            </div >
            <style>{`
                .form-input { @apply w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyber-primary/50 transition-all font-medium placeholder:text-gray-400; }
            `}</style>
        </form >
    );
}

const FormGroup = ({ label, icon: Icon, children, error }: any) => (
    <div className="group">
        <label className="text-[10px] text-gray-500 dark:text-cyber-primary font-black uppercase mb-2 flex items-center gap-2">{label}</label>
        <div className="relative">{Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-cyber-primary transition-colors" size={14} />}{children}</div>
        {error && <p className="text-red-500 text-[9px] mt-1.5 font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={10} /> {error}</p>}
    </div>
);

const FinancialCard = ({ register }: any) => (
    <div className="col-span-2 md:col-span-1 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 space-y-6">
        <h3 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em] flex items-center gap-2"><DollarSign size={14} /> Financials</h3>
        <div className="space-y-4">
            <FormGroup label="Retail Price"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-mono font-black">{CURRENCY_SYMBOL}</span><input {...register('price', { valueAsNumber: true })} type="number" step="0.01" className="form-input pl-10 text-lg font-mono font-black text-right" placeholder="0.00" /></div></FormGroup>
            <FormGroup label="Cost Price"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">{CURRENCY_SYMBOL}</span><input {...register('costPrice', { valueAsNumber: true })} type="number" step="0.01" className="form-input pl-10 text-sm font-mono text-gray-500 dark:text-gray-300 text-right" placeholder="0.00" /></div></FormGroup>
        </div>
    </div>
);

const QuantitativeCard = ({ register, watch, thresholdsDisabled }: any) => {
    const stock = watch('stock') || 0;
    const minStock = watch('minStock') || 0;
    const maxStock = watch('maxStock') || 0;
    const stockPct = maxStock > 0 ? Math.min(100, (stock / maxStock) * 100) : null;
    const isLow = minStock > 0 && stock < minStock;
    const isOptimal = minStock > 0 && maxStock > 0 && stock >= minStock && stock <= maxStock;

    return (
        <div className="col-span-2 md:col-span-1 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 space-y-6">
            <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2"><Box size={14} /> Quantitative</h3>
            <div className="space-y-4">
                <FormGroup label="Current Stock Level">
                    <div className="relative">
                        <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                        <input {...register('stock', { valueAsNumber: true })} type="number" className="form-input pl-12 text-lg font-mono font-black placeholder:opacity-30" placeholder="0" />
                    </div>
                    <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase tracking-wider flex items-center gap-1"><Info size={10} /> Auto-triggers putaway job</p>
                </FormGroup>
                <FormGroup label="Pack Qty">
                    <div className="relative">
                        <Archive className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                        <input {...register('packQuantity', { valueAsNumber: true })} type="number" className="form-input pl-12 text-sm font-mono text-gray-500" placeholder="1" />
                    </div>
                </FormGroup>

                {/* ── Stock Thresholds ── */}
                <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <TrendingDown size={12} /> Stock Thresholds
                        </p>
                        {thresholdsDisabled && (
                            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Lock size={10} /> Manager & CEO Only
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Min Stock (Reorder Point)">
                            <div className="relative">
                                <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={14} />
                                <input
                                    {...register('minStock', { valueAsNumber: true })}
                                    type="number"
                                    min="0"
                                    className={`form-input pl-10 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 placeholder:text-gray-400 ${
                                        thresholdsDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-black/20' : ''
                                    }`}
                                    placeholder="e.g. 10"
                                    aria-label="Minimum stock reorder point"
                                    readOnly={thresholdsDisabled}
                                />
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1">Triggers replenishment alert</p>
                        </FormGroup>
                        <FormGroup label="Max Stock (Capacity)">
                            <div className="relative">
                                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={14} />
                                <input
                                    {...register('maxStock', { valueAsNumber: true })}
                                    type="number"
                                    min="0"
                                    className={`form-input pl-10 text-sm font-mono font-bold text-green-600 dark:text-green-400 placeholder:text-gray-400 ${
                                        thresholdsDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-black/20' : ''
                                    }`}
                                    placeholder="e.g. 100"
                                    aria-label="Maximum stock capacity"
                                    readOnly={thresholdsDisabled}
                                />
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1">Replenishment target ceiling</p>
                        </FormGroup>
                    </div>

                    {/* Live Stock Health Bar */}
                    {(minStock > 0 || maxStock > 0) && (
                        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                                <span className={isLow ? 'text-red-400' : isOptimal ? 'text-green-400' : 'text-gray-400'}>
                                    {isLow ? '⚠ Below Min — Will Trigger Replenishment' : isOptimal ? '✓ Optimal Range' : 'Stock Policy Active'}
                                </span>
                                {stockPct !== null && <span className="text-gray-500">{Math.round(stockPct)}% of max</span>}
                            </div>
                            {stockPct !== null && (
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            isLow ? 'bg-red-500' : stockPct > 80 ? 'bg-green-500' : 'bg-amber-500'
                                        }`}
                                        ref={(el) => { if (el) el.style.width = `${stockPct}%`; }}
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between text-[9px] text-gray-600 font-mono">
                                <span>Min: {minStock || '—'}</span>
                                <span>Now: <strong className="text-white">{stock}</strong></span>
                                <span>Max: {maxStock || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LogisticsSection = ({ register }: any) => (
    <div className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2rem] space-y-6">
        <FormGroup label="Primary Barcode"><div className="relative"><Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white" size={18} /><input {...register('barcode')} className="form-input pl-12 py-5 text-xl font-mono tracking-[0.2em] placeholder:opacity-20" placeholder="Scan Item..." /></div></FormGroup>
        <div className="grid grid-cols-2 gap-5">
            <FormGroup label="SKU Code" icon={Scan}><input {...register('sku')} className="form-input pl-10 font-mono text-xs" placeholder="Generates Auto" /></FormGroup>
            <FormGroup label="Bay Location" icon={MapPin}><input {...register('location')} className="form-input pl-10 font-mono text-xs" placeholder="e.g. A-04-12" /></FormGroup>
        </div>
        <FormGroup label="Batch Expiry" icon={Calendar}><input {...register('expiryDate')} type="date" className="form-input pl-10 text-xs text-gray-500 dark:text-white" /></FormGroup>
    </div>
);

const StarIcon = ({ size }: { size: number }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
