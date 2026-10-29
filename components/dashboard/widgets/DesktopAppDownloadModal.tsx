import React, { useState, useMemo } from 'react';
import {
    Monitor, Download, Apple, Check, ShieldCheck,
    Terminal, Printer, WifiOff, Sparkles, Smartphone, X
} from 'lucide-react';
import { useElectron } from '../../../hooks/useElectron';

interface DesktopAppDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type OSPlatform = 'mac' | 'windows' | 'linux' | 'android';

export const DesktopAppDownloadModal: React.FC<DesktopAppDownloadModalProps> = ({ isOpen, onClose }) => {
    const { isElectron, appVersion } = useElectron();

    // Detect visitor OS and Architecture
    const detectedOS = useMemo((): { os: OSPlatform; arch: 'arm64' | 'x64' } => {
        if (typeof navigator === 'undefined') return { os: 'mac', arch: 'arm64' };
        const ua = navigator.userAgent.toLowerCase();
        const platform = (navigator.platform || '').toLowerCase();

        const isAndroid = ua.includes('android');
        const isMac = platform.includes('mac') || ua.includes('macintosh');
        const isWindows = platform.includes('win') || ua.includes('windows');
        const isLinux = platform.includes('linux') || ua.includes('x11');

        if (isAndroid) return { os: 'android', arch: 'arm64' };
        if (isWindows) return { os: 'windows', arch: 'x64' };
        if (isLinux) return { os: 'linux', arch: 'x64' };

        // Check Apple Silicon / ARM
        const isArm = ua.includes('arm') || (isMac && (navigator.maxTouchPoints > 0 || (window.screen && window.screen.colorDepth >= 30)));
        return { os: 'mac', arch: isArm ? 'arm64' : 'x64' };
    }, []);

    const [selectedOS, setSelectedOS] = useState<OSPlatform>(detectedOS.os);
    const [selectedVariant, setSelectedVariant] = useState<string>('default');
    const [copiedCommand, setCopiedCommand] = useState(false);

    const platforms: Record<OSPlatform, {
        label: string;
        icon: any;
        variants: Array<{
            id: string;
            label: string;
            filename: string;
            downloadUrl: string;
            format: string;
            size: string;
            recommended?: boolean;
        }>;
        instructions: string[];
    }> = {
        mac: {
            label: 'macOS',
            icon: Apple,
            variants: [
                {
                    id: 'arm64',
                    label: 'Apple Silicon (M1/M2/M3/M4)',
                    filename: 'SIIFMART WMS & POS-3.5.3-arm64.dmg',
                    downloadUrl: '/release/SIIFMART WMS & POS-3.5.3-arm64.dmg',
                    format: 'Apple Disk Image (.dmg)',
                    size: '~154 MB',
                    recommended: detectedOS.arch === 'arm64'
                },
                {
                    id: 'zip-arm64',
                    label: 'Apple Silicon (Standalone ZIP)',
                    filename: 'SIIFMART WMS & POS-3.5.3-arm64-mac.zip',
                    downloadUrl: '/release/SIIFMART WMS & POS-3.5.3-arm64-mac.zip',
                    format: 'Portable ZIP Archive (.zip)',
                    size: '~154 MB'
                },
                {
                    id: 'x64',
                    label: 'Intel Mac (x64)',
                    filename: 'SIIFMART WMS & POS-3.5.3-x64.dmg',
                    downloadUrl: '/release/SIIFMART WMS & POS-3.5.3-x64.dmg',
                    format: 'Apple Disk Image (.dmg)',
                    size: '~158 MB',
                    recommended: detectedOS.arch === 'x64'
                }
            ],
            instructions: [
                'Download the .dmg installer package for your Mac',
                'Open the DMG and drag SIIFMART into your Applications folder',
                'Launch from Launchpad or Spotlight search'
            ]
        },
        windows: {
            label: 'Windows',
            icon: Monitor,
            variants: [
                {
                    id: 'nsis-x64',
                    label: 'Windows 64-bit Installer',
                    filename: 'SIIFMART WMS & POS Setup 3.5.3.exe',
                    downloadUrl: '/release/SIIFMART WMS & POS Setup 3.5.3.exe',
                    format: 'NSIS Setup (.exe)',
                    size: '~148 MB',
                    recommended: true
                },
                {
                    id: 'portable-x64',
                    label: 'Windows Portable (No Install)',
                    filename: 'SIIFMART-WMS-POS-3.5.3-Portable.exe',
                    downloadUrl: '/release/SIIFMART-WMS-POS-3.5.3-Portable.exe',
                    format: 'Standalone (.exe)',
                    size: '~140 MB'
                },
                {
                    id: 'arm64',
                    label: 'Windows on ARM (Surface Pro)',
                    filename: 'SIIFMART WMS & POS Setup 3.5.3-arm64.exe',
                    downloadUrl: '/release/SIIFMART WMS & POS Setup 3.5.3-arm64.exe',
                    format: 'ARM64 Setup (.exe)',
                    size: '~146 MB'
                }
            ],
            instructions: [
                'Download the .exe installer',
                'Run the setup wizard to install desktop & start menu shortcuts',
                'Connects automatically to local receipt printers and COM drawers'
            ]
        },
        linux: {
            label: 'Linux',
            icon: Terminal,
            variants: [
                {
                    id: 'appimage',
                    label: 'Universal AppImage (All Distros)',
                    filename: 'SIIFMART-WMS-POS-3.5.3.AppImage',
                    downloadUrl: '/release/SIIFMART-WMS-POS-3.5.3.AppImage',
                    format: 'Universal AppImage (.AppImage)',
                    size: '~142 MB',
                    recommended: true
                },
                {
                    id: 'deb',
                    label: 'Debian / Ubuntu Package',
                    filename: 'siifmart-wms-pos_3.5.3_amd64.deb',
                    downloadUrl: '/release/siifmart-wms-pos_3.5.3_amd64.deb',
                    format: 'Debian Package (.deb)',
                    size: '~138 MB'
                },
                {
                    id: 'rpm',
                    label: 'RedHat / Fedora / openSUSE',
                    filename: 'siifmart-wms-pos-3.5.3.x86_64.rpm',
                    downloadUrl: '/release/siifmart-wms-pos-3.5.3.x86_64.rpm',
                    format: 'RPM Package (.rpm)',
                    size: '~140 MB'
                }
            ],
            instructions: [
                'Download the package format for your distribution',
                'For AppImage: chmod +x SIIFMART-*.AppImage && ./SIIFMART-*.AppImage',
                'For Ubuntu/Debian: sudo dpkg -i siifmart-wms-pos_*.deb'
            ]
        },
        android: {
            label: 'Android (APK)',
            icon: Smartphone,
            variants: [
                {
                    id: 'apk-universal',
                    label: 'Universal Android APK',
                    filename: 'SIIFMART-3.5.3-universal.apk',
                    downloadUrl: '/release/SIIFMART-3.5.3-universal.apk',
                    format: 'Android Package (.apk)',
                    size: '~18 MB',
                    recommended: true
                },
                {
                    id: 'apk-arm64',
                    label: 'ARM64 Phone & Tablet APK',
                    filename: 'SIIFMART-3.5.3-arm64.apk',
                    downloadUrl: '/release/SIIFMART-3.5.3-arm64.apk',
                    format: 'Android Package (.apk)',
                    size: '~14 MB'
                },
                {
                    id: 'apk-handheld',
                    label: 'Rugged Handheld Scanners',
                    filename: 'SIIFMART-3.5.3-scanner.apk',
                    downloadUrl: '/release/SIIFMART-3.5.3-scanner.apk',
                    format: 'Handheld Terminal (.apk)',
                    size: '~16 MB'
                }
            ],
            instructions: [
                'Download the .apk file directly on your Android phone, tablet, or warehouse scanner',
                'Allow "Install from Unknown Sources" if prompted in Android Settings',
                'Tap the downloaded APK notification to complete installation'
            ]
        }
    };

    const currentPlatform = platforms[selectedOS];
    const currentVariant = currentPlatform.variants.find(v => v.id === selectedVariant) || currentPlatform.variants[0];

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = currentVariant.downloadUrl;
        a.download = currentVariant.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopyBuildCmd = () => {
        const cmd = selectedOS === 'mac'
            ? 'npm run electron:build -- --mac'
            : selectedOS === 'windows'
            ? 'npm run electron:build -- --win'
            : selectedOS === 'android'
            ? 'npm run android:build'
            : 'npm run electron:build -- --linux';
        navigator.clipboard.writeText(cmd);
        setCopiedCommand(true);
        setTimeout(() => setCopiedCommand(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl shadow-2xl overflow-hidden text-[var(--theme-text-primary)] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Banner */}
                <div className="relative px-6 pt-6 pb-5 bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20 flex items-center justify-center shrink-0">
                            <Monitor size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                                    Download SIIFMART Apps
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                    v3.5.3
                                </span>
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Native desktop and mobile terminal apps with offline capability & hardware printing.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-card)] transition active:scale-[0.98] cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-120px)] custom-scrollbar">

                    {/* Already on Desktop Banner */}
                    {isElectron && (
                        <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className="text-[var(--theme-primary)]" size={18} />
                                <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                    You are currently running the native desktop app ({appVersion || 'v3.5.3'}).
                                </span>
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                Active Desktop
                            </span>
                        </div>
                    )}

                    {/* OS Selector Tabs */}
                    <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-2">
                            Select Operating System / Device
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(['mac', 'windows', 'linux', 'android'] as OSPlatform[]).map(osKey => {
                                const isSelected = selectedOS === osKey;
                                const isDetected = detectedOS.os === osKey;
                                const p = platforms[osKey];
                                const Icon = p.icon;

                                return (
                                    <button
                                        key={osKey}
                                        onClick={() => setSelectedOS(osKey)}
                                        className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                                            isSelected
                                                ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Icon size={20} className={isSelected ? 'text-[var(--theme-primary-text)]' : 'text-[var(--theme-text-secondary)]'} />
                                            {isDetected && (
                                                <span className={`text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                                    isSelected ? 'bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] text-[var(--theme-text-primary)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                                }`}>
                                                    Detected
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold text-xs capitalize">
                                            {osKey === 'mac' ? 'macOS' : osKey === 'windows' ? 'Windows' : osKey === 'android' ? 'Android' : 'Linux'}
                                        </div>
                                        <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'opacity-80' : 'text-[var(--theme-text-muted)]'}`}>
                                            {p.variants[0].format.split(' ')[0]}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active OS Card & Download CTA */}
                    <div className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                                    {currentVariant.label}
                                </h3>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                    File: <span className="font-mono text-[var(--theme-text-primary)]">{currentVariant.filename}</span> ({currentVariant.size})
                                </p>
                            </div>
                            <span className="text-[11px] font-mono font-semibold px-2 py-1 rounded bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                {currentVariant.format}
                            </span>
                        </div>

                        {/* Architecture / Package Format Variants */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Choose Package Format:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {currentPlatform.variants.map(v => {
                                    const isVarSelected = (currentVariant.id === v.id);
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v.id)}
                                            className={`px-3 py-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                                                isVarSelected
                                                    ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs font-semibold'
                                                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                            }`}
                                        >
                                            <span className="font-bold text-[11px] leading-tight truncate">{v.label}</span>
                                            <span className={`text-[11px] font-mono mt-1 ${isVarSelected ? 'opacity-80' : 'text-[var(--theme-text-muted)]'}`}>{v.size}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Download CTA Button */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-3 px-4 rounded-xl bg-[var(--theme-primary)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-primary-text)] font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <Download size={16} />
                                Download {currentVariant.label.split(' ')[0]} ({currentVariant.format.split(' ')[0]})
                            </button>

                            <button
                                onClick={handleCopyBuildCmd}
                                className="py-3 px-3.5 rounded-xl bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] active:scale-[0.98] text-[var(--theme-text-primary)] font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                                title="Copy local CLI build command"
                            >
                                {copiedCommand ? (
                                    <>
                                        <Check size={14} className="text-[var(--theme-primary)]" />
                                        <span className="text-[var(--theme-primary)]">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Terminal size={14} />
                                        <span>CLI Build</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Installation Instructions */}
                        <div className="pt-3 border-t border-[var(--theme-border)] space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Quick Install Steps:
                            </p>
                            {currentPlatform.instructions.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-[var(--theme-text-secondary)]">
                                    <span className="w-4 h-4 rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hardware Capabilities Features Grid */}
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2">
                            Native Desktop Advantages
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start gap-2">
                                <WifiOff size={15} className="text-[var(--theme-status-warning-text)] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-[var(--theme-text-primary)]">100% Offline POS</p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)]">Local barcode scan, sale queue & auto-sync.</p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start gap-2">
                                <Printer size={15} className="text-[var(--theme-primary)] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-[var(--theme-text-primary)]">Silent Thermal Printing</p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)]">Direct spooler print with zero popup dialogs.</p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start gap-2">
                                <Sparkles size={15} className="text-[var(--theme-status-info-text)] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-[var(--theme-text-primary)]">Cash Drawer Kick</p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)]">Automated ESC/POS pulse on cash sales.</p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-start gap-2">
                                <Monitor size={15} className="text-[var(--theme-accent)] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-[var(--theme-text-primary)]">F11 Kiosk Mode</p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)]">Fullscreen dedicated POS touch interface.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="px-6 py-3.5 bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[var(--theme-primary)]" />
                        Signed & Verified for macOS, Windows & Linux
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-semibold transition active:scale-[0.98] cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
