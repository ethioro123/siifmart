import React from 'react';
import { BarcodeGraphic } from './BarcodeGraphic';
import { MapPin, Tag } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export interface BarcodeLabelPreviewCardProps {
    type: 'PRODUCT' | 'BAY';
    title: string;
    code: string;
    humanLabel?: string;
    format: 'BARCODE' | 'QR' | 'Both';
    size?: string;
    price?: string | number;
    currency?: string;
    category?: string;
    siteName?: string;
    siteCode?: string;
    zoneSpecialization?: string;
    aisleSpecialization?: string;
    zone?: string;
    aisle?: string;
    bay?: string;
    isModal?: boolean;
    className?: string;
}

export const BarcodeLabelPreviewCard: React.FC<BarcodeLabelPreviewCardProps> = ({
    type,
    title,
    code,
    humanLabel,
    format,
    size = 'MEDIUM',
    price,
    currency = 'KSh',
    category,
    siteName,
    siteCode,
    zoneSpecialization,
    aisleSpecialization,
    zone,
    aisle,
    bay,
    isModal = false,
    className = ''
}) => {
    const { t } = useLanguage();
    const formattedPrice = typeof price === 'number'
        ? `${currency} ${price.toFixed(2)}`
        : price
            ? `${currency} ${price}`
            : null;

    // Dimensions for barcode graphic based on context - optimized for high scannability
    const barcodeWidth = isModal ? 1.6 : 1.4;
    const barcodeHeight = isModal ? 64 : 54;
    const qrSize = isModal ? 116 : 94;

    return (
        <div
            className={`relative bg-white text-slate-900 border-2 border-slate-300 rounded-2xl shadow-md p-4 sm:p-5 select-none transition-all ${className}`}
            style={{
                maxWidth: isModal ? '440px' : '100%',
                margin: '0 auto'
            }}
        >
            {/* Thermal Sticker Header Simulation */}
            <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-300 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                    {type === 'BAY' ? (
                        <>
                            <MapPin size={13} className="text-slate-500 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">
                                {t('warehouse.warehouseLocationSuffix', { facility: siteName || siteCode || 'Warehouse' })}
                            </span>
                        </>
                    ) : (
                        <>
                            <Tag size={13} className="text-slate-500 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">
                                {category || t('warehouse.inventoryProductFallback')}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {size}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-400">
                        {format}
                    </span>
                </div>
            </div>

            {/* Label Body Content */}
            {type === 'PRODUCT' ? (
                <div className="space-y-3">
                    {/* Product Name */}
                    <div className="text-center">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2">
                            {title || 'Select or Enter Product SKU'}
                        </h4>
                    </div>

                    {/* Barcode Graphic */}
                    <div className="py-1 flex justify-center items-center bg-white min-h-[56px]">
                        <BarcodeGraphic
                            value={code}
                            format={format}
                            width={barcodeWidth}
                            height={barcodeHeight}
                            qrSize={qrSize}
                        />
                    </div>

                    {/* Human Readable Code */}
                    <div className="text-center font-mono font-extrabold text-xs sm:text-sm text-slate-800 tracking-widest tabular-nums">
                        {code || 'NO-SKU-SPECIFIED'}
                    </div>

                    {/* Price and Category Tag Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-300 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {t('warehouse.retailPriceLabel')}
                            </span>
                            <span className="block font-black text-slate-900 text-xs sm:text-sm font-mono tabular-nums">
                                {formattedPrice || `${currency} --`}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {t('warehouse.classificationLabel')}
                            </span>
                            <span className="block font-bold text-slate-800 text-xs sm:text-sm truncate">
                                {category || 'General'}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                /* BAY / LOCATION MODE */
                <div className="space-y-3">
                    {/* Big Human Location Label */}
                    <div className="text-center py-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            {t('warehouse.locationIdentifierLabel')}
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wider tabular-nums">
                            {humanLabel || title}
                        </div>
                    </div>

                    {zoneSpecialization && <p className="text-xs text-slate-900 break-words"><b>{t('warehouse.zoneSpecialization')}:</b> {zoneSpecialization}</p>}
                    {aisleSpecialization && <p className="text-xs text-slate-900 break-words"><b>{t('warehouse.aisleSpecialization')}:</b> {aisleSpecialization}</p>}
                    {/* Barcode / QR Graphic */}
                    <div className="py-2.5 px-3 flex justify-center items-center bg-white rounded-xl border border-slate-200 min-h-[72px] shadow-2xs overflow-x-auto">
                        <BarcodeGraphic
                            value={code}
                            format={format}
                            width={barcodeWidth}
                            height={barcodeHeight + 6}
                            qrSize={qrSize}
                        />
                    </div>

                    {/* 15-Digit Location Protocol String */}
                    <div className="text-center font-mono font-black text-xs sm:text-sm text-slate-800 tracking-wider tabular-nums bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 select-all">
                        {code || '----'}
                    </div>

                    {/* Coordinates breakdown */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-dashed border-slate-300 text-center">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {t('warehouse.zoneTitle')}
                            </span>
                            <span className="font-black text-sm text-slate-900 font-mono">Zone {zone || '--'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {t('warehouse.aisleTitle')}
                            </span>
                            <span className="font-black text-sm text-slate-900 font-mono">{aisle || '--'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {t('warehouse.bayTitle')}
                            </span>
                            <span className="font-black text-sm text-slate-900 font-mono">{bay || '--'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle Thermal Cut Marks / Peel Indication */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{t('warehouse.thermalDirectPaper')}</span>
                <span>{t('warehouse.scannableHighContrast')}</span>
            </div>
        </div>
    );
};
