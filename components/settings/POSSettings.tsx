import React, { useState, useEffect } from 'react';
import {
    Monitor, Receipt, Plus, Globe, Sparkles, Shield
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { SystemConfig } from '../../types';
import { ReceiptPreview } from './ReceiptPreview';
import { POSStationTab } from './POSStationTab';
import { POSConnectivityTab } from './POSConnectivityTab';
import { POSIdentityTab } from './POSIdentityTab';
import { logger } from '../../utils/logger';

export default function POSSettings() {
    const { user, showToast } = useStore();
    const { settings, updateSettings } = useData();

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

    const handleSaveSection = async (section: 'workflow' | 'payments' | 'branding') => {
        const setSaving = section === 'workflow' ? setIsSavingWorkflow : section === 'payments' ? setIsSavingPayments : setIsSavingBranding;
        const data = section === 'workflow' ? workflow : section === 'payments' ? payments : receiptBranding;

        setSaving(true);
        try {
            await updateSettings(data as Partial<SystemConfig>, user?.name || 'Admin');
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`, 'success');
        } catch (err) {
            logger.error('POSSettings', `Failed to save ${section} settings:`, err);
            showToast(`Failed to save ${section} settings.`, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 relative">

            {/* Top Tab Bar */}
            <div className="flex items-center gap-2 p-1.5 bg-[#FAF8F5] dark:bg-black/40 rounded-2xl border border-[#E2DCCE] dark:border-white/10">
                {[
                    { id: 'station', label: 'Retail Station', icon: Monitor },
                    { id: 'connectivity', label: 'Tender & Connectivity', icon: Globe },
                    { id: 'identity', label: 'Receipt Branding', icon: Sparkles },
                ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${active
                                ? 'bg-[#2C5E3B] text-white shadow-md'
                                : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Floating Live Preview Toggle */}
            {activeTab === 'identity' && (
                <button
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    title="Toggle Receipt Preview"
                    className="fixed bottom-8 right-8 p-3.5 px-5 rounded-2xl z-[60] bg-[#2C5E3B] text-white shadow-2xl flex items-center gap-2.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                    <Receipt size={20} />
                    <span className="text-xs font-black uppercase tracking-wider">{isPreviewOpen ? 'Hide Preview' : 'Live Receipt Preview'}</span>
                </button>
            )}

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

            {/* Floating Side Preview Panel */}
            <div className={`
                fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white dark:bg-[#18201B] z-[70] border-l border-[#E2DCCE] dark:border-white/10
                transform transition-transform duration-500 ease-out shadow-2xl
                ${isPreviewOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-6 sm:p-8 pt-16 overflow-y-auto relative">
                    <button
                        onClick={() => setIsPreviewOpen(false)}
                        title="Close Live Preview"
                        className="absolute top-6 right-6 p-2.5 bg-stone-100 dark:bg-white/10 rounded-2xl text-stone-500 hover:text-[#1E3F27] dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Plus className="rotate-45" size={22} />
                    </button>

                    <div className="mb-6 text-center space-y-1">
                        <h2 className="text-xl font-black text-[#1E3F27] dark:text-white uppercase tracking-tight">Thermal Slip Preview</h2>
                        <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest">{receiptBranding.posReceiptWidth} Standard ESC/POS</p>
                    </div>

                    <div className="relative mx-auto w-full flex justify-center py-2">
                        <div className="relative z-20 max-w-full flex-1 w-full flex justify-center overflow-visible">
                            <div className="relative z-30 antialiased">
                                <ReceiptPreview settings={receiptBranding} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
