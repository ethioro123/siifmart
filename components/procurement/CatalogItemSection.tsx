import React from 'react';
import { Product } from '../../types';
import { CatalogSearch } from './CatalogSearch';
import { POItemOrderDetails } from './POItemOrderDetails';
import { CategorySpecificAttributes } from './CategorySpecificAttributes';

export interface CatalogItemSectionProps {
    products: Product[];
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (v: boolean) => void;
    currentProductToAdd: string;
    setCurrentProductToAdd: (v: string) => void;
    selectedCatalogProduct?: Product | null;
    selectedMainCategory: string;
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;
    currentQty: number;
    setCurrentQty: (v: number) => void;
    currentCost: number;
    setCurrentCost: (v: number) => void;
    currentRetailPrice: number;
    setCurrentRetailPrice: (v: number) => void;
    setCustomItemUnit: (v: string) => void;
    onSelectProduct: (p: Product) => void;
    unitsPerOrderUnit: number;
    totalUnits: number;
    showConversion: boolean;
    unitSuffix: string;
    orderUnitName: string;
    sellUnit: string;
    currencySymbol: string;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const CatalogItemSection: React.FC<CatalogItemSectionProps> = ({
    products,
    searchTerm,
    setSearchTerm,
    isSearchOpen,
    setIsSearchOpen,
    currentProductToAdd,
    setCurrentProductToAdd,
    selectedCatalogProduct,
    selectedMainCategory,
    customAttributes,
    setCustomAttributes,
    currentQty,
    setCurrentQty,
    currentCost,
    setCurrentCost,
    currentRetailPrice,
    setCurrentRetailPrice,
    setCustomItemUnit,
    onSelectProduct,
    unitsPerOrderUnit,
    totalUnits,
    showConversion,
    unitSuffix,
    orderUnitName,
    sellUnit,
    currencySymbol,
    errors,
    setErrors
}) => {
    const effectiveCategory = selectedCatalogProduct?.category || selectedMainCategory;

    return (
        <div className="space-y-5">
            <CatalogSearch
                products={products}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSearchOpen={isSearchOpen}
                setIsSearchOpen={setIsSearchOpen}
                currentProductToAdd={currentProductToAdd}
                setCurrentProductToAdd={setCurrentProductToAdd}
                setCurrentCost={setCurrentCost}
                setCurrentRetailPrice={setCurrentRetailPrice}
                setCustomItemUnit={setCustomItemUnit}
                onSelectProduct={onSelectProduct}
                errors={errors}
                setErrors={setErrors}
            />

            {/* Dynamic Category Attributes for Selected Catalog Product */}
            {selectedCatalogProduct && effectiveCategory && (
                <div className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-4 space-y-2.5 shadow-sm">
                    <CategorySpecificAttributes
                        category={effectiveCategory}
                        subcategory={selectedCatalogProduct?.customAttributes?.identity?.subcategory || customAttributes.identity?.subcategory}
                        customAttributes={customAttributes}
                        setCustomAttributes={setCustomAttributes}
                        errors={errors}
                    />
                </div>
            )}

            <POItemOrderDetails
                currentQty={currentQty}
                setCurrentQty={setCurrentQty}
                currentCost={currentCost}
                setCurrentCost={setCurrentCost}
                currentRetailPrice={currentRetailPrice}
                setCurrentRetailPrice={setCurrentRetailPrice}
                unitsPerOrderUnit={unitsPerOrderUnit}
                totalUnits={totalUnits}
                showConversion={showConversion}
                unitSuffix={unitSuffix}
                orderUnitName={orderUnitName}
                sellUnit={sellUnit}
                currencySymbol={currencySymbol}
                showRetailInput={true}
                errors={errors}
                setErrors={setErrors}
            />
        </div>
    );
};
