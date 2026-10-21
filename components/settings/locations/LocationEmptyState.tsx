import React from 'react';
import { MapPin, Plus } from 'lucide-react';

interface LocationEmptyStateProps {
    countryName: string;
    onAddLocation: () => void;
}

export const LocationEmptyState: React.FC<LocationEmptyStateProps> = ({
    countryName,
    onAddLocation
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-dashed border-[var(--theme-border)] rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight mb-1.5">No Locations in {countryName} Yet</h3>
            <p className="text-xs text-[var(--theme-text-secondary)] max-w-md mx-auto mb-6">
                Start by registering your sovereign national distribution hub, warehouse, or retail store.
            </p>
            <button
                type="button"
                onClick={onAddLocation}
                className="h-10 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white rounded-xl font-semibold text-xs inline-flex items-center gap-2 hover:opacity-95 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all active:scale-[0.98] cursor-pointer"
            >
                <Plus size={16} /> Add First Location
            </button>
        </div>
    );
};
