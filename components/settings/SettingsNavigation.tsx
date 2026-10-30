import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { visibleSettingsSections, type SettingsTab } from '../../utils/settingsNavigation';

interface Props {
    activeTab: SettingsTab;
    regional: boolean;
    enterprise: boolean;
    onSelect: (tab: SettingsTab) => void;
}
export function SettingsNavigation({ activeTab, regional, enterprise, onSelect }: Props) {
    const { user } = useStore();
    const [search, setSearch] = useState('');
    const sections = visibleSettingsSections(user?.role, regional, enterprise, search);
    const groups = [...new Set(sections.map(section => section.group))];
    return <>
        <label className="relative block mb-4">
            <Search aria-hidden="true" size={16} className="absolute left-3 top-3 text-[var(--theme-text-secondary)]" />
            <input type="search" aria-label="Search settings" placeholder="Search settings" value={search} onChange={event => setSearch(event.target.value)} className="w-full min-h-11 pl-9 pr-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-sm text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
        </label>
        {groups.map(group => <section key={group} aria-label={group} className="mb-4">
            <h3 className="px-2 mb-1 text-xs font-semibold text-[var(--theme-text-secondary)]">{group}</h3>
            {sections.filter(section => section.group === group).map(section => <button key={section.id} type="button" aria-current={activeTab === section.id ? 'page' : undefined} onClick={() => onSelect(section.id)} className={`w-full min-h-11 text-left px-3 py-2 rounded-xl text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${activeTab === section.id ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] font-semibold' : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)]'}`}>{section.label}</button>)}
        </section>)}
        {!sections.length && <p role="status" className="px-2 text-sm text-[var(--theme-text-secondary)]">No matching settings in your authorized sections.</p>}
    </>;
}
