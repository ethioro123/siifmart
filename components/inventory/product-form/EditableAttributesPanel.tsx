import React, { useState } from 'react';
import { Box, Layers, Archive, Snowflake, ShoppingBag } from 'lucide-react';

interface EditableAttributesPanelProps {
    customAttributes: any;
    onUpdateAttributes: (attrs: any) => void;
    unit?: string;
}

// ── Compact Attribute Badge ──
const AttrBadge = ({ label, value, color }: { label: string; value?: string | number | boolean | null; color?: string }) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'boolean' && !value) return null;

    const displayValue = typeof value === 'boolean' ? label : value;
    const displayLabel = typeof value === 'boolean' ? '' : label;

    const colorMap: Record<string, string> = {
        red: 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]',
        blue: 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]',
        cyan: 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]',
        green: 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]',
        yellow: 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
        orange: 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
        purple: 'bg-[var(--theme-accent-muted)] border-[var(--theme-border-accent)] text-[var(--theme-accent)] text-[var(--theme-accent)]',
        pink: 'bg-[var(--theme-accent-muted)] border-[var(--theme-border-accent)] text-[var(--theme-accent)] text-[var(--theme-accent)]',
    };
    const colorClasses = color && colorMap[color] ? colorMap[color] : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]';

    return (
        <div className={`flex items-center gap-1.5 ${colorClasses} border rounded-lg px-2.5 py-1 min-w-0 font-medium`}>
            {displayLabel && <span className="text-[11px] opacity-75 uppercase tracking-tight font-semibold">{displayLabel}</span>}
            <span className="text-[11px] font-bold leading-none truncate font-mono">{displayValue}</span>
        </div>
    );
};

export const EditableAttributesPanel: React.FC<EditableAttributesPanelProps> = ({
    customAttributes = {},
    onUpdateAttributes,
    unit = ''
}) => {
    const [activeTab, setActiveTab] = useState<'physical' | 'packaging' | 'storage' | 'commercial'>('physical');

    const physical = customAttributes?.physical || {};
    const packaging = customAttributes?.packaging || {};
    const storage = customAttributes?.storage || {};
    const commercial = customAttributes?.commercial || {};

    const updateDomain = (domain: string, key: string, value: any) => {
        const nextAttrs = {
            ...customAttributes,
            [domain]: {
                ...(customAttributes?.[domain] || {}),
                [key]: value
            }
        };
        onUpdateAttributes(nextAttrs);
    };

    return (
        <div className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
                <div className="flex items-center gap-2">
                    <Box size={14} className="text-[var(--theme-text-secondary)]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                        Product Attributes & Specifications
                    </h3>
                </div>

                {/* Domain Selector Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                    {[
                        { id: 'physical', label: 'Physical', icon: Box },
                        { id: 'packaging', label: 'Packaging', icon: Archive },
                        { id: 'storage', label: 'Storage', icon: Snowflake },
                        { id: 'commercial', label: 'Commercial', icon: ShoppingBag }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-2.5 py-1 text-xs font-semibold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)]'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                            }`}
                        >
                            <tab.icon size={11} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Form Content */}
            <div className="pt-1">
                {activeTab === 'physical' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Net Weight / Vol</label>
                            <input
                                value={physical.netWeight || ''}
                                onChange={(e) => updateDomain('physical', 'netWeight', e.target.value)}
                                placeholder="e.g. 1kg"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Gross Weight</label>
                            <input
                                value={physical.grossWeight || ''}
                                onChange={(e) => updateDomain('physical', 'grossWeight', e.target.value)}
                                placeholder="e.g. 1.2"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Form / State</label>
                            <input
                                value={physical.form || ''}
                                onChange={(e) => updateDomain('physical', 'form', e.target.value)}
                                placeholder="e.g. Powder, Liquid, Solid"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Dimensions (L×W×H)</label>
                            <input
                                value={physical.dims || ''}
                                onChange={(e) => updateDomain('physical', 'dims', e.target.value)}
                                placeholder="e.g. 20×15×10cm"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'packaging' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Case Pack Size</label>
                            <input
                                type="number"
                                value={packaging.caseSize || ''}
                                onChange={(e) => updateDomain('packaging', 'caseSize', e.target.value ? Number(e.target.value) : '')}
                                placeholder="e.g. 24"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Package Type</label>
                            <input
                                value={packaging.packageType || ''}
                                onChange={(e) => updateDomain('packaging', 'packageType', e.target.value)}
                                placeholder="e.g. Pouch, Bottle, Carton"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Material</label>
                            <input
                                value={packaging.material || ''}
                                onChange={(e) => updateDomain('packaging', 'material', e.target.value)}
                                placeholder="e.g. Plastic, Glass, Paper"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Breakable / Fragile</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)]">{packaging.isBreakable ? 'Yes' : 'No'}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!packaging.isBreakable}
                                onChange={(e) => updateDomain('packaging', 'isBreakable', e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[var(--theme-accent)]"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Storage Temperature</label>
                            <select
                                value={storage.type || 'Ambient'}
                                onChange={(e) => updateDomain('storage', 'type', e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                            >
                                <option value="Ambient" className="bg-[var(--theme-bg-card)]">Ambient (Room Temp)</option>
                                <option value="Chilled" className="bg-[var(--theme-bg-card)]">Chilled (Refrigerated)</option>
                                <option value="Frozen" className="bg-[var(--theme-bg-card)]">Frozen (Deep Freeze)</option>
                            </select>
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Perishable</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)]">{storage.isPerishable ? 'Yes' : 'No'}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!storage.isPerishable}
                                onChange={(e) => updateDomain('storage', 'isPerishable', e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[var(--theme-accent)]"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Hazardous</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)]">{storage.isHazardous ? 'Yes' : 'No'}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!storage.isHazardous}
                                onChange={(e) => updateDomain('storage', 'isHazardous', e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[var(--theme-accent)]"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Max Stack Limit</label>
                            <input
                                type="number"
                                value={storage.stackLimit || ''}
                                onChange={(e) => updateDomain('storage', 'stackLimit', e.target.value ? Number(e.target.value) : '')}
                                placeholder="e.g. 5"
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'commercial' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Pricing Model</label>
                            <select
                                value={commercial.priceType || 'Fixed'}
                                onChange={(e) => updateDomain('commercial', 'priceType', e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none cursor-pointer"
                            >
                                <option value="Fixed" className="bg-[var(--theme-bg-card)]">Fixed Price</option>
                                <option value="Weighted" className="bg-[var(--theme-bg-card)]">By Weight (Scale)</option>
                                <option value="Dynamic" className="bg-[var(--theme-bg-card)]">Dynamic Market</option>
                            </select>
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase block">Weighted at POS</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)]">{commercial.isWeighted ? 'Yes' : 'No'}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!commercial.isWeighted}
                                onChange={(e) => updateDomain('commercial', 'isWeighted', e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[var(--theme-accent)]"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase block">Customer Returnable</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)]">{commercial.isReturnable !== false ? 'Yes' : 'No'}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={commercial.isReturnable !== false}
                                onChange={(e) => updateDomain('commercial', 'isReturnable', e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[var(--theme-accent)]"
                            />
                        </div>
                        <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase block">Bundle / Promo Eligible</span>
                                <span className="text-xs font-bold text-[var(--theme-text-primary)]">{commercial.isBundleEligible !== false ? 'Yes' : 'No'}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={commercial.isBundleEligible !== false}
                                onChange={(e) => updateDomain('commercial', 'isBundleEligible', e.target.checked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[var(--theme-accent)]"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Live Active Attributes Badge Strip */}
            <div className="pt-3 border-t border-[var(--theme-border)] space-y-2">
                <span className="text-[11px] text-[var(--theme-text-muted)] font-bold uppercase tracking-wider block">
                    Active Master Attribute Badges (Live Preview):
                </span>
                <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                    {/* Physical */}
                    <AttrBadge label="Net" value={physical.netWeight ? `${physical.netWeight}${physical.sizeType || unit || ''}` : null} />
                    <AttrBadge label="Gross" value={physical.grossWeight ? `${physical.grossWeight}kg` : null} />
                    <AttrBadge label="Form" value={physical.form} />
                    <AttrBadge label="Dims" value={physical.dims} />

                    {/* Packaging */}
                    <AttrBadge label="Case" value={packaging.caseSize ? `×${packaging.caseSize}` : null} />
                    <AttrBadge label="Type" value={packaging.packageType} />
                    <AttrBadge label="Mat" value={packaging.material} />
                    <AttrBadge label="Breakable" value={packaging.isBreakable} color="red" />

                    {/* Storage */}
                    <AttrBadge label="Storage" value={storage.type} color={storage.type === 'Frozen' ? 'blue' : storage.type === 'Chilled' ? 'cyan' : undefined} />
                    <AttrBadge label="Perishable" value={storage.isPerishable} color="orange" />
                    <AttrBadge label="Hazardous" value={storage.isHazardous} color="red" />
                    <AttrBadge label="Stack" value={storage.stackLimit ? `Max ${storage.stackLimit}` : null} />

                    {/* Commercial */}
                    <AttrBadge label="Price" value={commercial.priceType} />
                    <AttrBadge label="Weighted" value={commercial.isWeighted} color="purple" />
                    <AttrBadge label="Returnable" value={commercial.isReturnable} color="green" />
                    <AttrBadge label="Bundle" value={commercial.isBundleEligible} color="blue" />

                    {!physical.netWeight && !physical.form && !packaging.packageType && !storage.isPerishable && !commercial.isWeighted && (
                        <span className="text-[11px] text-[var(--theme-text-muted)] font-medium italic">
                            No attributes configured yet — select options above to assign specifications
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
