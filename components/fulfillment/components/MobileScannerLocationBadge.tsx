import React from 'react';
import { MapPin } from 'lucide-react';

interface MobileScannerLocationBadgeProps {
    label: string;
    location: string;
    subLabel?: string;
    sku?: string;
    className?: string;
    icon?: React.ReactNode;
}

/**
 * High-visibility mobile scanner location badge.
 * Pinned directly with the scanner input so that the worker always sees
 * their target/current location regardless of viewport size or software keyboard.
 */
export const MobileScannerLocationBadge: React.FC<MobileScannerLocationBadgeProps> = ({
    label,
    location,
    subLabel,
    sku,
    className = '',
    icon
}) => {
    return (
        <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs select-none ${className}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[var(--theme-accent)] shrink-0 flex items-center justify-center">
                    {icon || <MapPin size={14} />}
                </span>
                <span className="font-semibold text-[var(--theme-text-secondary)] uppercase text-[10px] tracking-wider shrink-0">
                    {label}:
                </span>
                <span className="font-mono font-bold text-[var(--theme-text-primary)] truncate text-xs">
                    {location}
                </span>
                {subLabel && (
                    <span className="text-[10px] text-[var(--theme-text-muted)] truncate hidden xs:inline">
                        ({subLabel})
                    </span>
                )}
            </div>
            {sku && (
                <span className="font-mono text-[10px] text-[var(--theme-text-secondary)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    {sku}
                </span>
            )}
        </div>
    );
};
