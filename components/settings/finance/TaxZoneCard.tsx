import React from 'react';
import { Globe, Trash2, MapPin, Plus, Layers, X } from 'lucide-react';
import type { TaxJurisdiction, Site } from '../../../types';

interface TaxZoneCardProps {
    zone: TaxJurisdiction;
    onDelete: () => void;
    onAddRule: () => void;
    onDeleteRule: (zoneId: string, ruleIndex: number) => void;
    sites: Site[];
    onAssignSite: (siteId: string, zoneId: string | null) => void;
    onUnassignSite: (siteId: string) => void;
    isAuthorized?: boolean;
}

export const TaxZoneCard: React.FC<TaxZoneCardProps> = ({
    zone,
    onDelete,
    onAddRule,
    onDeleteRule,
    sites,
    onAssignSite,
    onUnassignSite,
    isAuthorized = true,
}) => {
    const assignedSites = sites.filter((s) => s.taxJurisdictionId === zone.id);
    const availableSites = sites.filter((s) => !s.taxJurisdictionId);

    const effectiveRate = (zone.rules || []).reduce((sum: number, r) => sum + (r.rate || 0), 0);

    return (
        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4.5 hover:border-[var(--theme-accent)]/30 transition-all group shadow-xs">
            <div className="flex justify-between items-start mb-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                        <Globe size={16} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-xs text-[var(--theme-text-primary)]">{zone.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] uppercase font-semibold tracking-wider text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full">
                                {zone.type}
                            </span>
                            {(zone.rules || []).length > 0 && (
                                <span className="text-[10px] font-mono font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 border border-[var(--theme-accent)]/20 px-2 py-0.5 rounded-full">
                                    {effectiveRate.toFixed(1)}% Total
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {isAuthorized && (
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Delete Jurisdiction"
                        className="text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg cursor-pointer"
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>

            {/* Assigned Sites */}
            <div className="mb-3.5">
                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin size={10} /> Assigned Locations ({assignedSites.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {assignedSites.length === 0 && (
                        <span className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] italic">No locations linked</span>
                    )}
                    {assignedSites.map((s) => (
                        <span key={s.id} className="text-[11px] font-medium bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-2.5 py-1 rounded-lg text-[var(--theme-text-primary)] flex items-center gap-1.5 shadow-2xs">
                            {s.name}
                            {isAuthorized && (
                                <button
                                    type="button"
                                    onClick={() => onUnassignSite(s.id)}
                                    className="text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] cursor-pointer ml-0.5 p-0.5 rounded transition-colors"
                                    title="Unassign"
                                >
                                    <X size={11} />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            </div>

            {/* Rules */}
            <div className="space-y-2 mb-3.5">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider flex items-center gap-1">
                        <Layers size={10} /> Tax Rules ({(zone.rules || []).length})
                    </p>
                    {isAuthorized && (
                        <button
                            type="button"
                            onClick={onAddRule}
                            className="text-[10px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold uppercase tracking-wider flex items-center gap-1 hover:opacity-80 cursor-pointer"
                        >
                            <Plus size={10} /> Add Rule
                        </button>
                    )}
                </div>

                <div className="space-y-1.5">
                    {(zone.rules || []).map((rule, idx) => (
                        <div key={idx} className="flex justify-between items-center px-2.5 py-1.5 bg-[var(--theme-bg-card)] rounded-lg border border-[var(--theme-border)] text-xs">
                            <span className="text-[var(--theme-text-primary)] font-medium">{rule.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">{rule.rate}%</span>
                                {isAuthorized && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteRule(zone.id, idx)}
                                        className="text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] cursor-pointer p-0.5 rounded transition-colors"
                                        title="Delete rule"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Assign Dropdown */}
            {isAuthorized && availableSites.length > 0 && (
                <div className="pt-2.5 border-t border-[var(--theme-border)] flex items-center gap-2">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                onAssignSite(e.target.value, zone.id);
                                e.target.value = '';
                            }
                        }}
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]/20"
                        defaultValue=""
                    >
                        <option value="" disabled>+ Assign Location...</option>
                        {availableSites.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
