import React, { useState, useEffect } from 'react';
import {
    Monitor, Receipt, Lock,
    Plus, Globe, Sparkles, List, Shield, Loader2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { SystemConfig } from '../../types';
import { NavButton } from './POSSettingsUI';
import { ReceiptPreview } from './ReceiptPreview';
import { POSStationTab } from './POSStationTab';
import { POSConnectivityTab } from './POSConnectivityTab';
import { POSIdentityTab } from './POSIdentityTab';
import { logger } from '../../utils/logger';

export default function POSSettings() {
    const { user } = useStore();
    const { settings, updateSettings, addNotification } = useData();

    // Local States
    const [workflow, setWorkflow] = useState<{
        posTerminalId: string;
        posRegisterMode: 'cashier' | 'kiosk';
        posGuestCheckout: boolean;
        posBlockNegativeStock: boolean;
        requireShiftClosure: boolean;
    }>({
        posTerminalId: '',
        posRegisterMode: 'cashier',
        posGuestCheckout: true,
        posBlockNegativeStock: false,
        requireShiftClosure: true
    });

    const [payments, setPayments] = useState({
        payment_cash: true,
        payment_card: true,
        payment_mobile_money: true,
        payment_store_credit: false,
        posDigitalReceipts: true,
        posAutoPrint: false
    });

    const [receiptBranding, setReceiptBranding] = useState<{
        posReceiptLogo: string;
        posReceiptShowLogo: boolean;
        posReceiptHeader: string;
        posReceiptFooter: string;
        posReceiptAddress: string;
        posReceiptPhone: string;
        posReceiptEmail: string;
        posReceiptTaxId: string;
        posReceiptPolicy: string;
        posReceiptSocialHandle: string;
        posReceiptEnableQR: boolean;
        posReceiptQRLink: string;
        posReceiptWidth: '80mm' | '58mm';
        posReceiptFont: 'monospace' | 'sans-serif';
    }>({
        posReceiptLogo: '',
        posReceiptShowLogo: true,
        posReceiptHeader: '',
        posReceiptFooter: '',
        posReceiptAddress: '',
        posReceiptPhone: '',
        posReceiptEmail: '',
        posReceiptTaxId: '',
        posReceiptPolicy: '',
        posReceiptSocialHandle: '',
        posReceiptEnableQR: true,
        posReceiptQRLink: '',
        posReceiptWidth: '80mm',
        posReceiptFont: 'sans-serif'
    });

    const [activeTab, setActiveTab] = useState<'station' | 'connectivity' | 'identity'>('station');
    const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
    const [isSavingPayments, setIsSavingPayments] = useState(false);
    const [isSavingBranding, setIsSavingBranding] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Sync from settings
    useEffect(() => {
        if (settings) {
            setWorkflow({
                posTerminalId: settings.posTerminalId || '',
                posRegisterMode: settings.posRegisterMode || 'cashier',
                posGuestCheckout: settings.posGuestCheckout ?? true,
                posBlockNegativeStock: settings.posBlockNegativeStock ?? false,
                requireShiftClosure: settings.requireShiftClosure ?? true
            });
            setPayments({
                payment_cash: settings.payment_cash ?? true,
                payment_card: settings.payment_card ?? true,
                payment_mobile_money: settings.payment_mobile_money ?? true,
                payment_store_credit: settings.payment_store_credit ?? false,
                posDigitalReceipts: settings.posDigitalReceipts ?? true,
                posAutoPrint: settings.posAutoPrint ?? false
            });
            setReceiptBranding({
                posReceiptLogo: settings.posReceiptLogo || '',
                posReceiptShowLogo: settings.posReceiptShowLogo ?? true,
                posReceiptHeader: settings.posReceiptHeader || '',
                posReceiptFooter: settings.posReceiptFooter || '',
                posReceiptAddress: settings.posReceiptAddress || '',
                posReceiptPhone: settings.posReceiptPhone || '',
                posReceiptEmail: settings.posReceiptEmail || '',
                posReceiptTaxId: settings.posReceiptTaxId || '',
                posReceiptPolicy: settings.posReceiptPolicy || '',
                posReceiptSocialHandle: settings.posReceiptSocialHandle || '',
                posReceiptEnableQR: settings.posReceiptEnableQR ?? true,
                posReceiptQRLink: settings.posReceiptQRLink || '',
                posReceiptWidth: (settings.posReceiptWidth as '80mm' | '58mm') || '80mm',
                posReceiptFont: (settings.posReceiptFont as 'monospace' | 'sans-serif') || 'sans-serif'
            });
        }
    }, [settings]);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSaveSection(activeTab === 'station' ? 'workflow' : activeTab === 'connectivity' ? 'payments' : 'branding');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, workflow, payments, receiptBranding]);

    const handleSaveSection = async (section: 'workflow' | 'payments' | 'branding') => {
        const setSaving = section === 'workflow' ? setIsSavingWorkflow : section === 'payments' ? setIsSavingPayments : setIsSavingBranding;
        const data = section === 'workflow' ? workflow : section === 'payments' ? payments : receiptBranding;

        setSaving(true);
        try {
            await updateSettings(data as Partial<SystemConfig>, user?.name || 'Admin');
            addNotification('success', `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
        } catch (err) {
            logger.error('POSSettings', `Failed to save ${section} settings:`, err);
            addNotification('alert', `Failed to save ${section} settings.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500 relative">

            {/* Floating Live Preview Toggle (Right) */}
            {activeTab === 'identity' && (
                <button
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    title="Toggle Receipt Preview"
                    className={`fixed bottom-8 right-8 p-4 rounded-3xl z-[60] transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl flex items-center gap-3 overflow-hidden ${isPreviewOpen
                        ? 'bg-black text-white border border-white/10'
                        : 'bg-cyber-primary text-black'}`}
                >
                    <div className="relative z-10 flex items-center gap-3">
                        <Receipt size={24} className={isPreviewOpen ? 'text-cyber-primary' : 'text-black'} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isPreviewOpen ? 'Hide' : 'Live Preview'}</span>
                    </div>
                    {!isPreviewOpen && (
                        <div className="absolute inset-0 bg-cyber-primary rounded-3xl animate-pulse opacity-20" />
                    )}
                </button>
            )}

            {/* Breadcrumb Header (Non-sticky, integrated) */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.05] animate-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsNavOpen(true)}
                        title="Open POS Module Menu"
                        className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-cyber-primary hover:bg-cyber-primary/10 transition-all border border-white/5 active:scale-95"
                    >
                        <List size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cyber-primary border border-white/10">
                        <Monitor size={18} />
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-0.5">POS Module</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-bold">{activeTab === 'station' ? 'Retail Station' : activeTab === 'connectivity' ? 'Connectivity' : 'Brand Identity'}</span>
                        <div className="w-1 h-1 rounded-full bg-cyber-primary opacity-50" />
                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">{activeTab === 'station' ? 'Logic & Auth' : activeTab === 'connectivity' ? 'Network & Pay' : 'Storefront CMS'}</span>
                    </div>
                </div>
            </div>

            {/* LEFT SIDEBAR NAVIGATION */}
            <div className={`
                fixed inset-y-0 left-0 w-72 z-40
                transition-all duration-500 ease-out transform
                ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 bg-cyber-gray h-full shadow-2xl border-r border-white/5">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-cyber-gray z-10 sticky top-0">
                        <div className="flex items-center gap-3">
                            <Monitor size={20} className="text-cyber-primary" />
                            <span className="text-xs font-black text-white uppercase tracking-widest">Station Config</span>
                        </div>
                        <button onClick={() => setIsNavOpen(false)} title="Close Menu" className="text-gray-500 hover:text-white">
                            <Plus className="rotate-45" size={24} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <NavButton
                            label="Retail Station"
                            icon={Monitor}
                            active={activeTab === 'station'}
                            onClick={() => { setActiveTab('station'); setIsNavOpen(false); }}
                        />
                        <NavButton
                            label="Connectivity"
                            icon={Globe}
                            active={activeTab === 'connectivity'}
                            onClick={() => { setActiveTab('connectivity'); setIsNavOpen(false); }}
                        />
                        <NavButton
                            label="Brand Identity"
                            icon={Sparkles}
                            active={activeTab === 'identity'}
                            onClick={() => { setActiveTab('identity'); setIsNavOpen(false); }}
                        />
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="p-4 bg-cyber-primary/5 border border-cyber-primary/10 rounded-2xl flex items-start gap-3">
                            <Shield className="text-cyber-primary shrink-0 mt-0.5" size={16} />
                            <div>
                                <h5 className="text-[10px] text-cyber-primary font-black uppercase tracking-wider">Secure Station</h5>
                                <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                                    Configuration changes are logged and audited in the system logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 pb-12">
                {activeTab === 'station' && (
                    <POSStationTab
                        workflow={workflow}
                        setWorkflow={setWorkflow}
                        isSavingWorkflow={isSavingWorkflow}
                        handleSaveSection={handleSaveSection}
                    />
                )}

                {activeTab === 'connectivity' && (
                    <POSConnectivityTab
                        payments={payments}
                        setPayments={setPayments}
                        isSavingPayments={isSavingPayments}
                        handleSaveSection={handleSaveSection}
                    />
                )}

                {activeTab === 'identity' && (
                    <POSIdentityTab
                        receiptBranding={receiptBranding}
                        setReceiptBranding={setReceiptBranding}
                        isSavingBranding={isSavingBranding}
                        handleSaveSection={handleSaveSection}
                        isPreviewOpen={isPreviewOpen}
                        setIsPreviewOpen={setIsPreviewOpen}
                        isNavOpen={isNavOpen}
                        setIsNavOpen={setIsNavOpen}
                    />
                )}
            </div>

            {/* Re-integrated Floating Side Preview Panel - High Contrast Solid for Sharpness */}
            <div className={`
                                fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-cyber-dark z-[70] border-l border-white/10
                                transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]
                                ${isPreviewOpen ? 'translate-x-0' : 'translate-x-full'}
                            `}>
                <div className="h-full flex flex-col p-8 sm:p-12 pt-24 overflow-y-auto custom-scrollbar relative">
                    <button
                        onClick={() => setIsPreviewOpen(false)}
                        title="Close Live Preview"
                        className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all hover:bg-white/10 active:scale-95"
                    >
                        <Plus className="rotate-45" size={24} />
                    </button>

                    <div className="mb-12 text-center space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Live Perspective</h2>
                        <p className="text-[10px] text-cyber-primary font-black uppercase tracking-[0.4em]">High-Fidelity Perspective</p>
                        {/* Optimization: Centered Receipt without Device Frame or distracting glows */}
                        <div className="relative group/preview mx-auto w-full flex justify-center py-4">
                            {/* Glow removed for sub-pixel rendering clarity */}

                            {/* Pure Receipt Container - Vertical scrollable & Sharp Rendering */}
                            <div className="relative z-20 max-w-full flex-1 w-full flex justify-center overflow-visible translate-z-0">
                                {/* Subtle paper texture background for the preview area */}
                                {/* eslint-disable-next-line react/forbid-dom-props */}
                                <div
                                    className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl"
                                    ref={(el) => { if (el) el.style.backgroundImage = 'url("https://www.transparenttextures.com/patterns/natural-paper.png")'; }}
                                />

                                <div className="relative z-30 antialiased transform-none">
                                    <ReceiptPreview settings={receiptBranding} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">
                                Representing exact {receiptBranding.posReceiptWidth} thermal geometry.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
