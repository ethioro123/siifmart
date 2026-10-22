import React from 'react';
import { 
    Cpu, 
    Shirt, 
    Apple, 
    ShieldCheck, 
    Milk, 
    Coffee, 
    Layers, 
    Sparkles, 
    Baby, 
    Car, 
    Tag, 
    Cookie,
    UtensilsCrossed,
    Snowflake,
    PawPrint,
    BookOpen,
    ChevronDown, 
    SlidersHorizontal,
    Info
} from 'lucide-react';
import { getCategorySpecGroup, CategoryAttributeField } from './categoryAttributes';

export interface CategorySpecificAttributesProps {
    category: string;
    subcategory?: string;
    customAttributes: any;
    setCustomAttributes: React.Dispatch<React.SetStateAction<any>>;
    errors?: Record<string, string>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const getDomainIcon = (iconType: string) => {
    switch (iconType) {
        case 'cpu': return Cpu;
        case 'shirt': return Shirt;
        case 'apple': return Apple;
        case 'shield-check': return ShieldCheck;
        case 'milk': return Milk;
        case 'coffee': return Coffee;
        case 'layers': return Layers;
        case 'sparkles': return Sparkles;
        case 'baby': return Baby;
        case 'car': return Car;
        case 'cookie': return Cookie;
        case 'sandwich': return UtensilsCrossed;
        case 'snowflake': return Snowflake;
        case 'dog': return PawPrint;
        case 'book-open': return BookOpen;
        case 'utensils': return UtensilsCrossed;
        case 'tag':
        default: return Tag;
    }
};

export const CategorySpecificAttributes: React.FC<CategorySpecificAttributesProps> = ({
    category,
    subcategory,
    customAttributes,
    setCustomAttributes,
    errors = {},
    setErrors
}) => {
    if (!category) {
        return (
            <div className="rounded-2xl bg-[var(--theme-bg-subtle)] border border-dashed border-[var(--theme-border)] p-4 flex items-center gap-3 text-[var(--theme-text-secondary)]">
                <Info size={16} className="text-[var(--theme-accent)] shrink-0" />
                <p className="text-xs">
                    Select a product category above to automatically unlock tailored attributes (e.g. Model, Screen & Storage for Electronics; Sizing & Fabric for Apparel; Halal & Cut for Meat).
                </p>
            </div>
        );
    }

    const specGroup = getCategorySpecGroup(category, subcategory);
    const IconComponent = getDomainIcon(specGroup.iconType);
    const categoryValues = customAttributes?.categorySpecific || {};

    const handleValueChange = (field: CategoryAttributeField, value: string) => {
        if (errors[field.key] && setErrors) {
            setErrors(prev => ({ ...prev, [field.key]: '' }));
        }
        setCustomAttributes((prev: any) => {
            const nextCategorySpecific = {
                ...(prev.categorySpecific || {}),
                [field.key]: value
            };

            const nextIdentity = { ...(prev.identity || {}) };
            const nextPhysical = { ...(prev.physical || {}) };
            const nextStorage = { ...(prev.storage || {}), requirementsConfirmed: false };
            const nextDescriptive = { ...(prev.descriptive || {}) };

            // Cross-mesh dynamic synchronization with core GS1 nodes
            if (field.key === 'modelNumber') {
                nextIdentity.modelNumber = value;
            }
            if (field.key === 'deviceType' && !nextIdentity.subcategory) {
                nextIdentity.subcategory = value;
            }
            if (field.key === 'colorFinish') {
                nextPhysical.color = value;
            }
            if (field.key === 'apparelSize' && !nextIdentity.variant) {
                nextIdentity.variant = value;
            }
            if (field.key === 'variantStyle') {
                nextIdentity.variant = value;
            }
            if (field.key === 'shelfLifeDays') {
                nextStorage.shelfLifeDays = value;
                nextStorage.isPerishable = Boolean(value && parseInt(value) > 0);
            }
            if (field.key === 'scentFragrance') {
                nextDescriptive.scent = value;
            }

            return {
                ...prev,
                identity: nextIdentity,
                physical: nextPhysical,
                storage: nextStorage,
                descriptive: nextDescriptive,
                categorySpecific: nextCategorySpecific
            };
        });
    };

    return (
        <div className="space-y-3 pt-3 border-t border-[var(--theme-border-subtle)]">
            {/* Header: Domain Name & GS1 Category Standard Pill */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center">
                        <IconComponent size={13} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            <span>{specGroup.domainTitle}</span>
                        </div>
                        <p className="text-[9px] text-[var(--theme-text-secondary)] font-medium">
                            {specGroup.description}
                        </p>
                    </div>
                </div>
                <span className="text-[9px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <SlidersHorizontal size={10} className="text-[var(--theme-accent)]" /> {specGroup.badgeLabel}
                </span>
            </div>

            {/* Dynamic Grid of Category Attributes */}
            <div className="grid grid-cols-6 gap-3 pt-1">
                {specGroup.fields.map(field => {
                    const colSpanClass = field.colSpan === 1
                        ? 'col-span-1'
                        : field.colSpan === 2
                        ? 'col-span-2'
                        : field.colSpan === 3
                        ? 'col-span-3'
                        : field.colSpan === 4
                        ? 'col-span-4'
                        : 'col-span-6';

                    const currentValue = categoryValues[field.key] ?? (
                        field.key === 'modelNumber' ? customAttributes?.identity?.modelNumber || '' :
                        field.key === 'shelfLifeDays' ? customAttributes?.storage?.shelfLifeDays || '' :
                        field.key === 'variantStyle' ? customAttributes?.identity?.variant || '' :
                        field.key === 'colorFinish' ? customAttributes?.physical?.color || '' :
                        field.key === 'deviceType' ? customAttributes?.identity?.subcategory || '' :
                        ''
                    );

                    return (
                        <div key={field.key} className={`${colSpanClass} space-y-1`}>
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold ml-1 block">
                                {field.label}
                                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>

                            {field.type === 'select' ? (
                                <div className="relative">
                                    <select
                                        title={field.label}
                                        className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors[field.key] ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none appearance-none font-semibold cursor-pointer`}
                                        value={currentValue}
                                        onChange={e => handleValueChange(field, e.target.value)}
                                    >
                                        <option value="" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                            Select {field.label}...
                                        </option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                                </div>
                            ) : (
                                <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    className={`w-full h-10 bg-[var(--theme-bg-subtle)] border ${errors[field.key] ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-xl px-3 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all placeholder:text-[var(--theme-text-secondary)]/70 font-semibold`}
                                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                    value={currentValue}
                                    onChange={e => handleValueChange(field, e.target.value)}
                                />
                            )}
                            {errors[field.key] && (
                                <span className="text-[9px] text-rose-500 ml-1 font-semibold">{errors[field.key]}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
