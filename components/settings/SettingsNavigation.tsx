import React, { useState } from 'react';
import {
    Search, Sliders, MapPin, Globe, Package, Monitor, Tag, Users,
    Award, Landmark, HardDrive, Network, Database, Key, ShieldCheck,
    FileText, Bell
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { visibleSettingsSections, type SettingsTab } from '../../utils/settingsNavigation';

interface Props {
    activeTab: SettingsTab;
    regional: boolean;
    enterprise: boolean;
    onSelect: (tab: SettingsTab) => void;
}

const TAB_ICONS: Record<SettingsTab, React.ElementType> = {
    general: Sliders,
    locations: MapPin,
    regions: Globe,
    inventory: Package,
    pos: Monitor,
    discounts: Tag,
    hr: Users,
    gamification: Award,
    finance: Landmark,
    infrastructure: HardDrive,
    integrations: Network,
    data: Database,
    roles: Key,
    security: ShieldCheck,
    audit: FileText,
    notifications: Bell,
};

export function SettingsNavigation({ activeTab, regional, enterprise, onSelect }: Props) {
    const { user } = useStore();
    const [search, setSearch] = useState('');
    const sections = visibleSettingsSections(user?.role, regional, enterprise, search);
    const groups = [...new Set(sections.map(section => section.group))];

    return (
        <div className="space-y-4">
            <label className="relative block">
                <Search aria-hidden="true" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                <input
                    type="search"
                    aria-label="Search settings"
                    placeholder="Search settings..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    className="w-full min-h-11 pl-10 pr-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-all shadow-2xs"
                />
            </label>
            {groups.map(group => (
                <section key={group} aria-label={group} className="space-y-1">
                    <h3 className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">{group}</h3>
                    {sections.filter(section => section.group === group).map(section => {
                        const Icon = TAB_ICONS[section.id] || Sliders;
                        const isActive = activeTab === section.id;
                        return (
                            <button
                                key={section.id}
                                type="button"
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => onSelect(section.id)}
                                className={`w-full min-h-11 text-left px-3 py-2 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] border touch-manipulation ${
                                    isActive
                                        ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] font-semibold border-[var(--theme-accent)]/20 shadow-2xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border-transparent'
                                }`}
                            >
                                <Icon size={15} className={`shrink-0 ${isActive ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'}`} />
                                <span className="truncate">{section.label}</span>
                            </button>
                        );
                    })}
                </section>
            ))}
            {!sections.length && (
                <p role="status" className="px-2 py-4 text-center text-xs text-[var(--theme-text-secondary)]">
                    No matching settings in your authorized sections.
                </p>
            )}
        </div>
    );
}
