import React, { useState, useRef, useEffect } from 'react';
import { Network, ChevronDown, Check, ExternalLink, Shield, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { getCountryProfile, Country } from '../../utils/localization';
import { isSharedHqRegionalRole } from '../../utils/roleSegregation';

export function RegionBadge() {
    const { user } = useStore();
    const {
        regions = [],
        activeRegionCode,
        setActiveRegionCode,
        canSwitchRegion,
        isRegionalUser,
        effectiveCountry = 'ET',
        sites = [],
        activeSite,
        setActiveSite
    } = useData();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const countryProfile = getCountryProfile(effectiveCountry as Country);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Active region record & clean name formatting (preventing "Region Region" duplication)
    const activeRegion = activeRegionCode ? regions.find(r => r.code === activeRegionCode) : null;
    const cleanRegionName = activeRegion ? activeRegion.name.replace(/\s*(Region|Territory)$/i, '') : 'All Regions';

    // Role-based authority:
    // Only HQ Executives (who can switch regions), dedicated Regional Operations Manager, or Regional Administration
    // shared specialists see RegionBadge. Frontline branch workers (cashiers, store staff, warehouse pickers)
    // have their region cleanly unified inside LocationBadge without a duplicate static pill in the top bar.
    const isRegionalOfficer = Boolean(user && (
        user.role === 'regional_operations_manager' ||
        (typeof user.role === 'string' && user.role.startsWith('regional_')) ||
        (isRegionalUser && isSharedHqRegionalRole(user.role))
    ));

    if (!canSwitchRegion && !isRegionalOfficer) {
        return null;
    }

    const regionSubtitle = activeRegionCode
        ? (canSwitchRegion ? 'Territory Lens' : 'Regional Command')
        : 'National HQ';

    const handleSelectRegion = (code: string | null) => {
        if (!setActiveRegionCode || !canSwitchRegion) return;
        setActiveRegionCode(code);
        setIsOpen(false);

        // Dynamic bidirectional synchronization with active site
        if (setActiveSite && sites.length > 0) {
            if (code) {
                const regionalSites = sites.filter(s => s.regionCode === code || s.region_code === code);
                if (regionalSites.length > 0) {
                    const isCurrentInRegion = activeSite && (activeSite.regionCode === code || activeSite.region_code === code);
                    if (!isCurrentInRegion) {
                        const hubSite = regionalSites.find(s => s.type === 'Administration' || s.type === 'Administrative') || regionalSites[0];
                        setActiveSite(hubSite.id);
                    }
                }
            } else {
                const nationalHq = sites.find(s =>
                    (s.type === 'Administration' || s.type === 'Administrative' || s.type === 'HQ') &&
                    !s.regionCode && !s.region_code
                ) || sites.find(s => s.code?.endsWith('-HQ') || s.code === 'SITE-0001');
                if (nationalHq) {
                    setActiveSite(nationalHq.id);
                }
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => canSwitchRegion && setIsOpen(!isOpen)}
                disabled={!canSwitchRegion}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-colors text-left min-h-[44px] ${
                    canSwitchRegion
                        ? 'border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] hover:border-[var(--theme-border-focus)]/50 bg-[color-mix(in_srgb,var(--theme-bg-card)_70%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_70%,transparent)] hover:bg-[var(--theme-bg-card)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] cursor-pointer shadow-xs'
                        : 'border-[var(--theme-border)]/50 border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_40%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] cursor-default select-none'
                }`}
                aria-label={canSwitchRegion ? 'Regional jurisdiction lens switcher' : 'Assigned regional jurisdiction'}
            >
                {/* Accent icon */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    activeRegionCode
                        ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]'
                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]'
                }`}>
                    <Network size={14} />
                </div>

                <div className="flex flex-col min-w-0 max-w-[100px] sm:max-w-[150px]">
                    <span className="text-[11px] sm:text-[13px] font-bold text-[var(--theme-text-primary)] truncate leading-tight">
                        {cleanRegionName}
                    </span>
                    <span className="text-[9px] font-medium text-[var(--theme-text-secondary)] leading-none truncate">
                        {regionSubtitle}
                    </span>
                </div>

                {canSwitchRegion && (
                    <ChevronDown
                        size={14}
                        className={`text-[var(--theme-text-secondary)] transition-transform duration-200 shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                )}
            </button>

            {/* Dropdown Menu - HQ Only */}
            {canSwitchRegion && isOpen && (
                <div className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-3 py-1.5 mb-1 border-b border-[var(--theme-border)] flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                            Regional Lens ({countryProfile.name})
                        </span>
                        <button
                            type="button"
                            onClick={() => { setIsOpen(false); navigate('/settings'); }}
                            className="text-[10px] font-bold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                            <span>Manage</span>
                            <ExternalLink size={10} />
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                        {/* Option 1: All Regions (National HQ View) */}
                        <button
                            type="button"
                            onClick={() => handleSelectRegion(null)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                                activeRegionCode === null
                                    ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-bold'
                                    : 'hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Shield size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate leading-tight">All Regions (National HQ)</p>
                                    <p className="text-[9px] text-[var(--theme-text-secondary)] leading-none mt-0.5">Aggregate Country View</p>
                                </div>
                            </div>
                            {activeRegionCode === null && (
                                <Check size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                            )}
                        </button>

                        {/* Divider */}
                        {regions.length > 0 && (
                            <div className="my-1 border-t border-[var(--theme-border)]" />
                        )}

                        {/* Region Options */}
                        {regions.length === 0 ? (
                            <div className="px-3 py-3 text-center">
                                <p className="text-[11px] text-[var(--theme-text-secondary)]">
                                    No operational regions provisioned in {countryProfile.name}.
                                </p>
                            </div>
                        ) : (
                            regions.map(r => {
                                const isSelected = activeRegionCode === r.code;
                                return (
                                    <button
                                        key={r.code}
                                        type="button"
                                        onClick={() => handleSelectRegion(r.code)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-bold'
                                                : 'hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Building2 size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold truncate leading-tight">{r.name}</p>
                                                <p className="text-[9px] font-mono text-[var(--theme-text-secondary)] leading-none mt-0.5">
                                                    {r.code} • {r.status}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
