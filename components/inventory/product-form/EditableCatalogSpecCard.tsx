import React from 'react';

interface EditableCatalogSpecCardProps {
    brand?: string | null;
    name?: string | null;
    variant?: string | null;
    size?: string | null;
    unit?: string | null;
    keyFeatures?: string | null;
    onUpdateKeyFeatures: (val: string) => void;
}

export const EditableCatalogSpecCard: React.FC<EditableCatalogSpecCardProps> = ({
    brand,
    name,
    variant,
    size,
    unit,
    keyFeatures,
    onUpdateKeyFeatures
}) => {
    const rawBrand = (brand || '').trim();
    const rawName = (name || '').trim();
    const brandAlreadyInName = rawBrand && rawName.toLowerCase().startsWith(rawBrand.toLowerCase());

    const systemDesc = [
        brandAlreadyInName ? '' : rawBrand,
        rawName,
        variant,
        size ? `${size}${unit && !['UNIT', 'PIECE', 'PACK', 'DOZEN'].includes(unit.toUpperCase().trim()) ? unit : ''}` : ''
    ].filter(Boolean).join(' ');

    return (
        <div className="p-5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] text-[11px] leading-relaxed font-mono space-y-3">
            <div>
                <span className="text-[var(--theme-text-muted)] font-bold uppercase block mb-1">
                    Catalog Description Spec (Live System Preview):
                </span>
                <span className="text-[var(--theme-text-primary)] font-bold block text-xs">
                    {systemDesc || '— Enter brand and name to generate catalog spec —'}
                </span>
            </div>

            <div className="pt-2 border-t border-[var(--theme-border)]">
                <label className="text-[9px] text-[var(--theme-text-muted)] font-bold uppercase block mb-1 font-sans">
                    Key Features / Merchandising Highlights:
                </label>
                <textarea
                    value={keyFeatures || ''}
                    onChange={(e) => onUpdateKeyFeatures(e.target.value)}
                    placeholder="e.g. Non-GMO stoneground flour, fortified with vitamins, shelf-stable seal..."
                    rows={2}
                    className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 text-xs font-sans text-[var(--theme-text-primary)] placeholder:opacity-40 focus:outline-none focus:border-[var(--theme-primary)] transition-all resize-none"
                />
            </div>
        </div>
    );
};
