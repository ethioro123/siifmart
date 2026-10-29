import React from 'react';
import { Eye, X } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';

export function GhostModeBanner() {
    const { originalUser, user, stopImpersonation } = useStore();

    if (!originalUser) return null;

    return (
        <div className="bg-[var(--theme-status-warning-bg)] backdrop-blur-md text-[var(--theme-text-primary)] px-4 py-2 flex items-center justify-between shadow-lg relative z-[100] animate-slide-down">
            <div className="flex items-center gap-3">
                <div className="bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] p-1.5 rounded-full animate-pulse">
                    <Eye size={18} className="text-[var(--theme-text-primary)]" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <span className="font-bold uppercase tracking-wider text-xs md:text-sm">Ghost Mode Active</span>
                    <span className="hidden md:inline text-[color-mix(in_srgb,var(--theme-text-primary)_40%,transparent)]">•</span>
                    <span className="text-xs md:text-sm font-medium">
                        Viewing as <span className="font-bold underline">{user?.name}</span> ({user?.role})
                    </span>
                </div>
            </div>

            <button
                onClick={stopImpersonation}
                className="bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] transition-all flex items-center gap-2 shadow-md"
            >
                Exit Ghost Mode <X size={14} />
            </button>

            <style>{`
                @keyframes slide-down {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-down { animation: slide-down 0.3s ease-out; }
            `}</style>
        </div>
    );
}
