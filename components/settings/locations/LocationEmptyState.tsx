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
        <div className="bg-[#FAF8F5] dark:bg-black/20 border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-950/30">
                <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-[#1E3F27] dark:text-white mb-1.5">No Locations in {countryName} Yet</h3>
            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] max-w-md mx-auto mb-6">
                Start by registering your sovereign national distribution hub, warehouse, or retail store.
            </p>
            <button
                type="button"
                onClick={onAddLocation}
                className="bg-[#2C5E3B] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#1E3F27] shadow-sm transition-all cursor-pointer"
            >
                <Plus size={16} /> Add First Location
            </button>
        </div>
    );
};
