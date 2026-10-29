import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import type { DesktopUpdateStatus } from '../types/electron';

export const DesktopUpdateBanner: React.FC = () => {
    const [updateState, setUpdateState] = useState<DesktopUpdateStatus | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
        let unsubscribe: (() => void) | undefined;

        if (api?.getUpdateStatus && api?.onUpdateStatus) {
            api.getUpdateStatus().then(state => {
                if (state?.status === 'downloaded') setUpdateState(state);
            }).catch(() => {});

            unsubscribe = api.onUpdateStatus((state) => {
                if (state.status === 'downloaded') {
                    setDismissed(false);
                    setUpdateState(state);
                } else if (state.status === 'up-to-date') {
                    setUpdateState(null);
                }
            });
        }

        // Also listen for PWA Service Worker waiting/updated state in browser/PWA installs
        const onSwInstalled = () => {
            setDismissed(false);
            setUpdateState({
                status: 'downloaded',
                currentVersion: '',
                message: 'A new version of SIIFMART is ready.'
            });
        };

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg?.waiting) onSwInstalled();
                reg?.addEventListener('updatefound', () => {
                    const installing = reg.installing;
                    if (!installing) return;
                    installing.addEventListener('statechange', () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            onSwInstalled();
                        }
                    });
                });
            }).catch(() => {});
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    if (!updateState || updateState.status !== 'downloaded' || dismissed) {
        return null;
    }

    const handleApply = () => {
        if (window.electronAPI?.applyUpdate) {
            void window.electronAPI.applyUpdate();
        } else {
            window.location.reload();
        }
    };

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-lg text-xs text-[var(--theme-text-primary)]"
        >
            <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success-bg)] shrink-0" />
            <span className="font-medium">
                Update ready{updateState.availableVersion ? ` (${updateState.availableVersion})` : ''}
            </span>
            <button
                type="button"
                onClick={handleApply}
                className="min-h-[32px] px-2.5 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
                <RefreshCw size={12} />
                <span>Restart to apply</span>
            </button>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss update notification"
                className="w-6 h-6 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] flex items-center justify-center transition-colors cursor-pointer"
            >
                <X size={13} />
            </button>
        </div>
    );
};
