import React from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
    message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-sm z-10 rounded-2xl">
        <Package className="text-[var(--theme-text-secondary)] mb-2" size={32} />
        <p className="text-[var(--theme-text-muted)] text-sm font-medium">{message}</p>
    </div>
);
