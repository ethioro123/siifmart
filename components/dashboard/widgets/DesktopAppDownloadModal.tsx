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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl bg-[#151D18] border border-[#2C5E3B]/40 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden text-stone-100 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Gradient Top Banner */}
                <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#1E3F27]/90 via-[#151D18] to-transparent border-b border-[#2C5E3B]/30 flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C5E3B] to-[#1E3F27] border border-[#A9CBA2]/30 flex items-center justify-center shadow-lg shadow-[#2C5E3B]/20">
                            <Monitor className="text-[#A9CBA2]" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight text-white">
                                    Download SIIFMART Apps
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#A9CBA2]/20 text-[#A9CBA2] border border-[#A9CBA2]/30">
                                    v3.5.3
                                </span>
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">
                                Native desktop and mobile terminal apps with offline capability & hardware printing.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-120px)]">

                    {/* Already on Desktop Banner */}
                    {isElectron && (
                        <div className="p-3.5 rounded-2xl bg-[#2C5E3B]/20 border border-[#2C5E3B]/40 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className="text-[#A9CBA2]" size={18} />
                                <span className="text-xs font-semibold text-stone-200">
                                    You are currently running the native desktop app ({appVersion || 'v3.5.3'}).
                                </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#2C5E3B] text-white">
                                Active Desktop
                            </span>
                        </div>
                    )}

                    {/* OS Selector Tabs */}
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
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
                                        className={`relative p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-[#2C5E3B]/30 border-[#A9CBA2]/60 ring-1 ring-[#A9CBA2]/40 text-white shadow-md'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-stone-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Icon size={20} className={isSelected ? 'text-[#A9CBA2]' : 'text-stone-400'} />
                                            {isDetected && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                    Detected
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold text-xs capitalize">
                                            {osKey === 'mac' ? 'macOS' : osKey === 'windows' ? 'Windows' : osKey === 'android' ? 'Android' : 'Linux'}
                                        </div>
                                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                            {p.variants[0].format.split(' ')[0]}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active OS Card & Download CTA */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    {currentVariant.label}
                                </h3>
                                <p className="text-[11px] text-stone-400 mt-0.5">
                                    File: <span className="font-mono text-stone-300">{currentVariant.filename}</span> ({currentVariant.size})
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#2C5E3B]/40 text-[#A9CBA2] border border-[#2C5E3B]/60">
                                {currentVariant.format}
                            </span>
                        </div>

                        {/* Architecture / Package Format Variants */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                Choose Package Format:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {currentPlatform.variants.map(v => {
                                    const isVarSelected = (currentVariant.id === v.id);
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v.id)}
                                            className={`px-3 py-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                                                isVarSelected
                                                    ? 'bg-[#2C5E3B]/40 border-[#A9CBA2] text-white shadow-sm'
                                                    : 'bg-black/20 border-white/10 hover:bg-white/10 text-stone-300'
                                            }`}
                                        >
                                            <span className="font-bold text-[11px] leading-tight truncate">{v.label}</span>
                                            <span className="text-[9px] font-mono text-stone-400 mt-1">{v.size}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Download CTA Button */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2C5E3B] to-[#1E3F27] hover:from-[#357248] hover:to-[#244b2f] active:scale-[0.98] border border-[#A9CBA2]/40 text-white font-bold text-xs shadow-lg shadow-[#2C5E3B]/25 flex items-center justify-center gap-2 transition"
                            >
                                <Download size={16} />
                                Download {currentVariant.label.split(' ')[0]} ({currentVariant.format.split(' ')[0]})
                            </button>

                            <button
                                onClick={handleCopyBuildCmd}
                                className="py-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] text-stone-300 font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                                title="Copy local CLI build command"
                            >
                                {copiedCommand ? (
                                    <>
                                        <Check size={14} className="text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
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
                        <div className="pt-3 border-t border-white/10 space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                Quick Install Steps:
                            </p>
                            {currentPlatform.instructions.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                                    <span className="w-4 h-4 rounded-full bg-[#2C5E3B]/40 text-[#A9CBA2] font-mono text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hardware Capabilities Features Grid */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                            Native Desktop Advantages
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
                                <WifiOff size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-stone-200">100% Offline POS</p>
                                    <p className="text-[10px] text-stone-400">Local barcode scan, sale queue & auto-sync.</p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
                                <Printer size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-stone-200">Silent Thermal Printing</p>
                                    <p className="text-[10px] text-stone-400">Direct spooler print with zero popup dialogs.</p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
                                <Sparkles size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-stone-200">Cash Drawer Kick</p>
                                    <p className="text-[10px] text-stone-400">Automated ESC/POS pulse on cash sales.</p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
                                <Monitor size={15} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-stone-200">F11 Kiosk Mode</p>
                                    <p className="text-[10px] text-stone-400">Fullscreen dedicated POS touch interface.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="px-6 py-3.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#A9CBA2]" />
                        Signed & Verified for macOS, Windows & Linux
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 font-bold transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
