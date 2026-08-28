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
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#2C5E3B]/20 border border-[#2C5E3B]/40 text-[#A9CBA2] text-xs font-bold shadow-sm">
                <CheckCircle2 size={15} className="text-[#A9CBA2]" />
                <span className="font-mono">Desktop Active</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#2C5E3B] text-white">
                    {appVersion || 'v3.5.3'}
                </span>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 h-[46px] rounded-2xl bg-gradient-to-r from-[#2C5E3B]/90 to-[#1E3F27]/90 hover:from-[#357248] hover:to-[#244b2f] active:scale-95 border border-[#A9CBA2]/40 text-white text-xs font-bold shadow-md shadow-[#2C5E3B]/20 transition-all duration-200"
                title={`Download native SIIFMART Desktop App for ${osName}`}
            >
                <OSIcon size={16} className="text-[#A9CBA2]" />
                <span>Get App</span>
                <span className="hidden lg:inline text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-black/20 text-[#A9CBA2]">
                    {osName}
                </span>
                <Download size={14} className="opacity-75 ml-0.5" />
            </button>

            <DesktopAppDownloadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};
