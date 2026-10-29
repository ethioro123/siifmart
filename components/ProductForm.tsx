import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema } from '../schemas/inventory.schema';
import { Product } from '../types';
import Button from './shared/Button';
import { Lock, CheckCircle, Trash2 } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getRoleHierarchy, canViewCostPrice } from '../utils/roles';
import { CURRENCY_SYMBOL } from '../constants';
import { generateSKU, generateSequentialSKU } from '../utils/skuGenerator';
import { generateInternalBarcode } from '../utils/barcodeNumberGenerator';

// Modular Subcomponents
import { EditableProfileHeader } from './inventory/product-form/EditableProfileHeader';
import { EditableSpecificationsCard } from './inventory/product-form/EditableSpecificationsCard';
import { EditableFinancialsCard } from './inventory/product-form/EditableFinancialsCard';
import { EditableAttributesPanel } from './inventory/product-form/EditableAttributesPanel';
import { EditableStockPoliciesCard } from './inventory/product-form/EditableStockPoliciesCard';
import { ProductRestockLogCard } from './inventory/product-form/ProductRestockLogCard';
import { EditableCatalogSpecCard } from './inventory/product-form/EditableCatalogSpecCard';
import { ImageUploadModal } from './inventory/product-form/ImageUploadModal';
import { ProductLocationBreakdown } from './inventory/components/ProductLocationBreakdown';
import { SmartUnitConfigModal } from './inventory/modals/SmartUnitConfigModal';

interface ProductFormProps {
    initialData?: Partial<Product>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    isReadOnly?: boolean;
    currencySymbol?: string;
    onDelete?: () => void;
}

export function ProductForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    isReadOnly = false,
    currencySymbol,
    onDelete
}: ProductFormProps) {
    const { user, showToast } = useStore();
    const { t } = useLanguage();
    const { movements, employees, allProducts, sites, activeSite, effectiveCountry, settings, refreshData } = useData();

    const showCostPrice = canViewCostPrice(user?.role);
    const isCEO = user?.role === 'group_ceo';
    const canEditThresholds = user?.role
        ? ['group_ceo', 'country_managing_director', 'warehouse_manager', 'store_manager', 'inventory_manager', 'country_commercial_director', 'country_operations_director', 'regional_operations_manager'].includes(user.role) || getRoleHierarchy(user.role) >= 80
        : false;
    const thresholdsDisabled = !canEditThresholds || isReadOnly;

    const activeCurrency = currencySymbol || (activeSite as any)?.currency || (effectiveCountry === 'KE' || settings?.country === 'KE' ? 'KSh' : CURRENCY_SYMBOL);

    // Modal states
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isSmartUnitModalOpen, setIsSmartUnitModalOpen] = useState(false);

    // Custom Attributes State
    const [customAttributes, setCustomAttributes] = useState<any>(
        initialData?.customAttributes || (initialData as any)?.custom_attributes || {}
    );

    // Normalize initial unit to match lowercase
    const normalizedUnit = (initialData?.unit || 'piece').toLowerCase();

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            id: initialData?.id || '',
            siteId: initialData?.siteId || '',
            name: initialData?.name || '',
            brand: initialData?.brand || '',
            category: initialData?.category || '',
            size: initialData?.size || '',
            unit: normalizedUnit,
            packQuantity: initialData?.packQuantity || 1,
            price: initialData?.price || 0,
            costPrice: initialData?.costPrice || 0,
            salePrice: initialData?.salePrice || 0,
            competitorPrice: initialData?.competitorPrice || 0,
            stock: initialData?.stock || 0,
            sku: initialData?.sku || '',
            barcode: initialData?.barcode || '',
            barcodes: initialData?.barcodes || [],
            location: initialData?.location || '',
            shelfPosition: initialData?.shelfPosition || '',
            batchNumber: initialData?.batchNumber || '',
            expiryDate: initialData?.expiryDate || '',
            salesVelocity: initialData?.salesVelocity || 'Medium',
            image: initialData?.image || '',
            status: (initialData?.status as any) || 'active',
            minStock: initialData?.minStock ?? null,
            maxStock: initialData?.maxStock ?? null,
            ...initialData
        }
    });

    const formData = watch();

    // Multi-site network stock breakdown matching ProductDetailsModal
    const locationBreakdown = useMemo(() => {
        if (!initialData?.sku || !allProducts) return [];
        const matches = allProducts.filter(p => p.sku === initialData.sku || (initialData.productId && p.productId === initialData.productId));

        const siteMap = new Map<string, typeof matches[0]>();
        matches.forEach(p => {
            const sId = p.siteId || (p as any).site_id || 'unknown';
            if (!siteMap.has(sId) || p.id === initialData.id) {
                siteMap.set(sId, p);
            }
        });

        return Array.from(siteMap.values()).map(p => {
            const sId = p.siteId || (p as any).site_id;
            const siteObj = sites?.find(s => s.id === sId);
            return {
                id: p.id,
                siteName: siteObj?.name || 'Main Location',
                location: p.location || 'General Area',
                stock: p.stock || 0,
                price: p.price,
                minStock: p.minStock,
                isCurrentSite: p.id === initialData.id || sId === (initialData.siteId || (initialData as any)?.site_id),
            };
        });
    }, [initialData, allProducts, sites]);

    const handleGenerateSKU = async () => {
        const category = formData.category || 'General';
        const newSku = await generateSequentialSKU(category, allProducts || [], effectiveCountry as any);
        setValue('sku', newSku);
        showToast(`Generated sovereign SKU: ${newSku}`, 'info');
    };

    const handleGenerateBarcode = () => {
        const newBarcode = generateInternalBarcode(allProducts || []);
        setValue('barcode', newBarcode);
        showToast(`Generated internal EAN-13: ${newBarcode}`, 'info');
    };

    const handleFormSubmit = async (data: any) => {
        const payload = {
            ...data,
            customAttributes,
            custom_attributes: customAttributes
        };
        await onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-6 text-[var(--theme-text-primary)]" noValidate>
            {isReadOnly && (
                <div className="bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] p-3 rounded-2xl text-center text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Lock size={14} /> Read Only Mode — Adjustments Disabled
                </div>
            )}

            {/* 1. Executive Hero Product Profile Header */}
            <EditableProfileHeader
                formData={formData}
                register={register}
                setValue={setValue}
                showCostPrice={showCostPrice}
                currencySymbol={activeCurrency}
                onOpenImageModal={() => setIsImageModalOpen(true)}
            />

            {/* 2. Multi-Site & Store Stock Breakdown */}
            {initialData?.id && locationBreakdown.length > 0 && (
                <ProductLocationBreakdown product={initialData as Product} locationBreakdown={locationBreakdown} />
            )}

            {/* 3. Product Specifications Grid */}
            <EditableSpecificationsCard
                register={register}
                watch={watch}
                setValue={setValue}
                onOpenSmartUnitModal={() => setIsSmartUnitModalOpen(true)}
                onGenerateSKU={handleGenerateSKU}
                onGenerateBarcode={handleGenerateBarcode}
                barcodes={formData.barcodes || []}
                onUpdateBarcodes={(updated) => setValue('barcodes', updated)}
            />

            {/* 4. Financial & Pricing Details Card */}
            <EditableFinancialsCard
                register={register}
                watch={watch}
                showCostPrice={showCostPrice}
                currencySymbol={activeCurrency}
            />

            {/* 5. Product Attributes & Master Specs */}
            <EditableAttributesPanel
                customAttributes={customAttributes}
                onUpdateAttributes={setCustomAttributes}
                unit={formData.unit}
            />

            {/* 6. Stock Policies & Restock History (2-Column Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableStockPoliciesCard
                    register={register}
                    watch={watch}
                    thresholdsDisabled={thresholdsDisabled}
                />
                <ProductRestockLogCard
                    movements={movements}
                    employees={employees}
                    productId={initialData?.id}
                    createdBy={initialData?.createdBy}
                    createdAt={initialData?.createdAt}
                />
            </div>

            {/* 7. Catalog Description Spec Preview & Key Features */}
            <EditableCatalogSpecCard
                brand={formData.brand}
                name={formData.name}
                variant={customAttributes?.identity?.variant}
                size={formData.size}
                unit={formData.unit}
                keyFeatures={customAttributes?.descriptive?.keyFeatures}
                onUpdateKeyFeatures={(val) => {
                    setCustomAttributes((prev: any) => ({
                        ...prev,
                        descriptive: {
                            ...(prev?.descriptive || {}),
                            keyFeatures: val
                        }
                    }));
                }}
            />

            {/* 8. Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]">
                <div>
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-4 py-2.5 text-xs font-black uppercase rounded-xl border bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Trash2 size={13} />
                            <span>Delete Product</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        variant="ghost"
                        className="px-5 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                        {t('common.close') || 'Close'}
                    </Button>
                    {!isReadOnly && (
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            icon={<CheckCircle size={15} />}
                            className="px-6 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-black uppercase text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                        >
                            {initialData?.id
                                ? 'Submit for 3 Regional Approvals'
                                : (isCEO ? 'Initialize Product' : 'Submit for Creation Approval')
                            }
                        </Button>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ImageUploadModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                currentImage={formData.image}
                onSaveImage={(url) => setValue('image', url)}
            />

            {initialData && (
                <SmartUnitConfigModal
                    product={initialData as Product}
                    isOpen={isSmartUnitModalOpen}
                    onClose={() => setIsSmartUnitModalOpen(false)}
                    onSaveSuccess={async () => {
                        await refreshData(['products', 'movements']);
                    }}
                />
            )}
        </form>
    );
}
