import React, { useState, useEffect } from 'react';
import {
    Monitor, Receipt, Plus, Globe, Sparkles, Lock
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { isAdmin } from '../../utils/permissions';
import { usePOSSettingsMutation } from '../../hooks/usePOSSettingsMutation';
import type { SystemConfig } from '../../types';
import { ReceiptPreview } from './ReceiptPreview';
import { POSStationTab } from './POSStationTab';
import { POSConnectivityTab } from './POSConnectivityTab';
import { POSIdentityTab, ReceiptBrandingState } from './POSIdentityTab';
import { Country, getCountryProfile } from '../../utils/localization';
import { getCountryReceiptDefaults } from '../../schemas/pos-settings.schema';

export default function POSSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry } = useData();

    // ── ROLE GUARD (RULES.md §Role Hierarchy) ──
    // L4 staff (cashiers, pickers, drivers) MUST NOT configure POS settings.
    // They could disable shift enforcement, enable guest checkout, or turn off
    // stock compliance — all of which undermine zero-trust controls.
    const POS_CONFIG_ROLES = [
        'super_admin', 'CEO', 'ceo', 'country_managing_director', 'admin',
        'head_of_operations', 'operations_head', 'operations_manager', 'store_manager', 'warehouse_manager',
        'regional_manager', 'assistant_manager',
    ];
    const canConfigurePOS = POS_CONFIG_ROLES.includes(user?.role || '');
    const isHQAdmin = isAdmin(user?.role as Parameters<typeof isAdmin>[0]);

    // ── INVISIBLE MULTI-TENANCY & BACKGROUND ISOLATION (AGENTS.md Rule 8 / §6) ──
    // Country is determined exclusively by the central global switch (effectiveCountry).
    // Individual settings pages MUST NEVER render country selector chips, dropdowns,
    // or partition banners. Non-CEO users experience a native, single-nation interface.
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

    // ── MUTATION HOOK (RULES.md §Mutations) ──
    const posSettingsMutation = usePOSSettingsMutation();

    // Local States
    const [workflow, setWorkflow] = useState<{
        posTerminalId: string;
        posRegisterMode: 'cashier' | 'kiosk';
        posGuestCheckout: boolean;
        posBlockNegativeStock: boolean;
        requireShiftClosure: boolean;
        posDailyRevenueTarget?: number;
        posDailyTxTarget?: number;
        taxOnSelling: boolean;
    }>({
        posTerminalId: '',
        posRegisterMode: 'cashier',
        posGuestCheckout: false,
        posBlockNegativeStock: true,
        requireShiftClosure: true,
        posDailyRevenueTarget: 50000,
        posDailyTxTarget: 50,
        taxOnSelling: false,
    });

    const [payments, setPayments] = useState({
        payment_cash: true,
        payment_card: true,
        payment_mobile_money: true,
        payment_store_credit: false,
        posDigitalReceipts: true,
        posAutoPrint: false
    });

    const [receiptBranding, setReceiptBranding] = useState<ReceiptBrandingState>({
        posReceiptLogo: '',
        posReceiptShowLogo: true,
        posReceiptHeader: 'SIIFMART RETAIL',
        posReceiptFooter: 'Thank you for shopping with us!',
        posReceiptAddress: 'Bole Sub-City, Addis Ababa',
        posReceiptPhone: '+251 911 234 567',
        posReceiptEmail: 'support.et@siifmart.com',
        posReceiptTaxId: '0001234567',
        posReceiptPolicy: 'Items may be returned within 7 days with valid receipt.',
        posReceiptSocialHandle: '',
        posReceiptEnableQR: true,
        posReceiptQRLink: 'https://siifmart.com/feedback',
        posReceiptWidth: '80mm',
        posReceiptFont: 'sans-serif'
    });

    const [activeTab, setActiveTab] = useState<'station' | 'connectivity' | 'identity'>('station');
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Sync from settings partition whenever activeCountry or settings change
    useEffect(() => {
        if (settings) {
            const countryPartition = settings.countryConfigs?.[activeCountry];
            const isCountryActive = settings.country === activeCountry;
            const receiptDefaults = getCountryReceiptDefaults(activeCountry);

            setWorkflow({
                posTerminalId: countryPartition?.posTerminalId ?? (isCountryActive ? settings.posTerminalId : undefined) ?? '',
                posRegisterMode: countryPartition?.posRegisterMode ?? (isCountryActive ? settings.posRegisterMode : undefined) ?? 'cashier',
                posGuestCheckout: countryPartition?.posGuestCheckout ?? (isCountryActive ? settings.posGuestCheckout : undefined) ?? false,
                posBlockNegativeStock: countryPartition?.posBlockNegativeStock ?? (isCountryActive ? settings.posBlockNegativeStock : undefined) ?? true,
                requireShiftClosure: countryPartition?.requireShiftClosure ?? (isCountryActive ? settings.requireShiftClosure : undefined) ?? true,
                posDailyRevenueTarget: countryPartition?.posDailyRevenueTarget ?? (isCountryActive ? settings.posDailyRevenueTarget : undefined) ?? 50000,
                posDailyTxTarget: countryPartition?.posDailyTxTarget ?? (isCountryActive ? settings.posDailyTxTarget : undefined) ?? 50,
                taxOnSelling: countryPartition?.taxOnSelling ?? (isCountryActive ? settings.taxOnSelling : undefined) ?? false
            });

            setPayments({
                payment_cash: countryPartition?.payment_cash ?? (isCountryActive ? settings.payment_cash : undefined) ?? true,
                payment_card: countryPartition?.payment_card ?? (isCountryActive ? settings.payment_card : undefined) ?? true,
                payment_mobile_money: countryPartition?.payment_mobile_money ?? (isCountryActive ? settings.payment_mobile_money : undefined) ?? true,
                payment_store_credit: countryPartition?.payment_store_credit ?? (isCountryActive ? settings.payment_store_credit : undefined) ?? false,
                posDigitalReceipts: countryPartition?.posDigitalReceipts ?? (isCountryActive ? settings.posDigitalReceipts : undefined) ?? true,
                posAutoPrint: countryPartition?.posAutoPrint ?? (isCountryActive ? settings.posAutoPrint : undefined) ?? false
            });

            setReceiptBranding({
                posReceiptLogo: countryPartition?.posReceiptLogo ?? (isCountryActive ? settings.posReceiptLogo : undefined) ?? '',
                posReceiptShowLogo: countryPartition?.posReceiptShowLogo ?? (isCountryActive ? settings.posReceiptShowLogo : undefined) ?? receiptDefaults.showLogo,
                posReceiptHeader: countryPartition?.posReceiptHeader ?? (isCountryActive ? settings.posReceiptHeader : undefined) ?? receiptDefaults.header,
                posReceiptFooter: countryPartition?.posReceiptFooter ?? (isCountryActive ? settings.posReceiptFooter : undefined) ?? receiptDefaults.footer,
                posReceiptAddress: countryPartition?.posReceiptAddress ?? (isCountryActive ? settings.posReceiptAddress : undefined) ?? receiptDefaults.address,
                posReceiptPhone: countryPartition?.posReceiptPhone ?? (isCountryActive ? settings.posReceiptPhone : undefined) ?? receiptDefaults.phone,
                posReceiptEmail: countryPartition?.posReceiptEmail ?? (isCountryActive ? settings.posReceiptEmail : undefined) ?? receiptDefaults.email,
                posReceiptTaxId: countryPartition?.posReceiptTaxId ?? (isCountryActive ? settings.posReceiptTaxId : undefined) ?? receiptDefaults.taxIdDefault,
                posReceiptPolicy: countryPartition?.posReceiptPolicy ?? (isCountryActive ? settings.posReceiptPolicy : undefined) ?? receiptDefaults.policy,
                posReceiptSocialHandle: countryPartition?.posReceiptSocialHandle ?? (isCountryActive ? settings.posReceiptSocialHandle : undefined) ?? '',
                posReceiptEnableQR: countryPartition?.posReceiptEnableQR ?? (isCountryActive ? settings.posReceiptEnableQR : undefined) ?? receiptDefaults.enableQR,
                posReceiptQRLink: countryPartition?.posReceiptQRLink ?? (isCountryActive ? settings.posReceiptQRLink : undefined) ?? receiptDefaults.qrLink,
                posReceiptWidth: (countryPartition?.posReceiptWidth ?? (isCountryActive ? settings.posReceiptWidth : undefined) ?? receiptDefaults.width) as '80mm' | '58mm',
                posReceiptFont: (countryPartition?.posReceiptFont ?? (isCountryActive ? settings.posReceiptFont : undefined) ?? receiptDefaults.font) as 'monospace' | 'sans-serif'
            });
        }
    }, [activeCountry, settings]);

    // ── GATEWAY SAVE (routed through mutation hook with country isolation) ──
    const handleSaveGateways = async (updates: Partial<SystemConfig>) => {
        posSettingsMutation.mutate({
            section: 'gateways',
            data: updates,
            targetCountry: activeCountry,
        });
    };

    // ── SECTION SAVE (routed through mutation hook with country isolation) ──
    const handleSaveSection = (section: 'workflow' | 'payments' | 'branding') => {
        const data = section === 'workflow' ? workflow : section === 'payments' ? payments : receiptBranding;
        posSettingsMutation.mutate({
            section,
            data: data as unknown as Partial<SystemConfig>,
            targetCountry: activeCountry,
        });
    };

    const isSavingWorkflow = posSettingsMutation.isPending && posSettingsMutation.variables?.section === 'workflow';
    const isSavingPayments = posSettingsMutation.isPending && posSettingsMutation.variables?.section === 'payments';
    const isSavingBranding = posSettingsMutation.isPending && posSettingsMutation.variables?.section === 'branding';
    const isSavingGateways = posSettingsMutation.isPending && posSettingsMutation.variables?.section === 'gateways';

    return (
        <div className="w-full flex flex-col gap-6 transition-opacity duration-200 relative">

            {/* ── ROLE GATE ── */}
            {!canConfigurePOS && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center">
                        <Lock size={22} className="text-[var(--theme-text-secondary)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--theme-text-primary)] text-sm">Access Restricted</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] max-w-xs leading-relaxed">
                        POS configuration requires Store Manager or higher access.
                        Contact your HQ Operations team.
                    </p>
                </div>
            )}

            {canConfigurePOS && (
            <>
            {/* Top Tab Bar */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] mb-6">
                {([
                    { id: 'station' as const, label: 'Retail Station', icon: Monitor },
                    { id: 'connectivity' as const, label: 'Tender & Connectivity', icon: Globe },
                    { id: 'identity' as const, label: 'Receipt Branding', icon: Sparkles },
                ] as const).map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`min-h-[38px] flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${active
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]/50'
                                }`}
                        >
                            <Icon size={15} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Floating Live Preview Toggle */}
            {activeTab === 'identity' && (
                <button
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    title="Toggle Receipt Preview"
                    className="fixed bottom-8 right-8 h-10 px-4 rounded-xl z-[60] bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer font-semibold text-xs"
                >
                    <Receipt size={16} />
                    <span>{isPreviewOpen ? 'Hide Preview' : 'Live Receipt Preview'}</span>
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
                        currencySymbol={countryProfile.currencySymbol}
                        isHQAdmin={isHQAdmin}
                    />
                )}

                {activeTab === 'connectivity' && (
                    <POSConnectivityTab
                        payments={payments}
                        setPayments={setPayments}
                        isSavingPayments={isSavingPayments}
                        handleSaveSection={handleSaveSection}
                        settings={settings?.countryConfigs?.[activeCountry] || settings}
                        onSaveGateways={handleSaveGateways}
                        isSavingGateways={isSavingGateways}
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
                        selectedCountry={activeCountry}
                    />
                )}
            </div>

            {/* Floating Side Preview Panel */}
            <div className={`
                fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-[var(--theme-bg-card)] z-[70] border-l border-[var(--theme-border)]
                transform transition-transform duration-200 ease-out shadow-2xl
                ${isPreviewOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-6 sm:p-8 pt-16 overflow-y-auto relative">
                    <button
                        onClick={() => setIsPreviewOpen(false)}
                        title="Close Live Preview"
                        className="absolute top-6 right-6 p-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                        <Plus className="rotate-45" size={18} />
                    </button>

                    <div className="mb-6 text-center space-y-1">
                        <h2 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">Thermal Slip Preview</h2>
                        <p className="text-xs text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-semibold">
                            {receiptBranding.posReceiptWidth} Standard ESC/POS
                        </p>
                    </div>

                    <div className="relative mx-auto w-full flex justify-center py-2">
                        <div className="relative z-20 max-w-full flex-1 w-full flex justify-center overflow-visible">
                            <div className="relative z-30 antialiased">
                                <ReceiptPreview settings={{ ...receiptBranding, country: activeCountry, currency: countryProfile.currencySymbol }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
