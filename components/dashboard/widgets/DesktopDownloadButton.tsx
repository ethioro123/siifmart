import React, { useState, useMemo } from 'react';
import { Monitor, Download, Apple, Terminal, CheckCircle2 } from 'lucide-react';
import { useElectron } from '../../../hooks/useElectron';
import { DesktopAppDownloadModal } from './DesktopAppDownloadModal';

export const DesktopDownloadButton: React.FC = () => {
    const { isElectron, appVersion } = useElectron();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Detect user OS
    const osName = useMemo((): string => {
        if (typeof navigator === 'undefined') return 'Desktop';
        const platform = (navigator.platform || '').toLowerCase();
        const ua = navigator.userAgent.toLowerCase();
        if (platform.includes('mac') || ua.includes('macintosh')) return 'macOS';
        if (platform.includes('win') || ua.includes('windows')) return 'Windows';
        if (platform.includes('linux') || ua.includes('x11')) return 'Linux';
        return 'Desktop';
    }, []);

    const OSIcon = osName === 'macOS' ? Apple : osName === 'Windows' ? Monitor : Terminal;

    if (isElectron) {
        return (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] text-xs font-semibold shadow-xs">
                <CheckCircle2 size={15} className="text-[var(--theme-status-success-text)]" />
                <span className="font-mono">Desktop Active</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                    {appVersion || 'v3.5.3'}
                </span>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 h-[42px] rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] text-xs font-semibold shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                title={`Download native SIIFMART Desktop App for ${osName}`}
            >
                <OSIcon size={16} />
                <span>Get App</span>
                <span className="hidden lg:inline text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    {osName}
                </span>
                <Download size={14} className="opacity-80 ml-0.5" />
            </button>

            <DesktopAppDownloadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};
