import React, { useState, useEffect } from 'react';
import {
    Monitor, CreditCard, Printer, ShoppingBag, UserCheck,
    AlertTriangle, Receipt, Smartphone, Lock, ShieldAlert,
    Save, Image, MapPin, Phone, Mail, FileText, Share2,
    QrCode, Type, Sparkles, Settings, Globe, Shield, List, Plus,
    Scan, Loader2, ChevronRight, Search, Filter
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Button from '../shared/Button';
// import ReceiptPreview from './ReceiptPreview'; // Removed deleted file
import { SystemConfig } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatDateTime } from '../../utils/formatting';

// --- STYLED SUB-COMPONENTS ---

const HelpBubble = ({ text }: { text: string }) => (
    <span className="group/help relative inline-block ml-2">
        <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[8px] font-black text-gray-500 cursor-help group-hover/help:border-cyber-primary group-hover/help:text-cyber-primary transition-colors">
            ?
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-black border border-white/10 rounded-2xl text-[10px] text-gray-300 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-300 z-50 shadow-2xl pointer-events-none">
            <div className="relative z-10 font-medium leading-relaxed">
                {text}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black" />
        </div>
    </span>
);

const NavButton = ({ label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-500 relative group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-cyber-primary/50 ${active
            ? 'text-cyber-primary'
            : 'text-gray-500 hover:text-gray-300'
            }`}
    >
        {active && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyber-primary rounded-r-full shadow-[0_0_10px_rgba(0,255,157,0.5)] animate-in slide-in-from-left-2 duration-700" />
        )}
        <div className={`p-2 rounded-xl transition-all duration-500 group-hover:scale-110 ${active ? 'bg-cyber-primary/10 shadow-inner' : 'bg-transparent'}`}>
            <Icon size={18} className={active ? 'text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'} />
        </div>
        <span className={`text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${active ? 'translate-x-1' : 'group-hover:translate-x-0.5'}`}>
            {label}
        </span>
    </button>
);

const GlassCard = ({ children, className = "" }: any) => (
    <div className={`bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-700 relative overflow-hidden group ${className}`}>
        <div className="relative z-10">
            {children}
        </div>
    </div>
);

const SectionHeader = ({ title, desc, icon: Icon, compact = false }: any) => (
    <div className={`flex items-start gap-6 ${compact ? 'mb-8' : 'mb-12'} animate-in fade-in slide-in-from-left-4 duration-1000`}>
        <div className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br from-cyber-primary/20 to-transparent flex items-center justify-center border border-cyber-primary/30 shadow-[0_0_20px_rgba(0,255,157,0.1)]`}>
            <Icon size={compact ? 24 : 28} className="text-cyber-primary animate-pulse-slow" />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-white tracking-tight leading-tight mb-2 underline-offset-8 decoration-cyber-primary/30 decoration-2 underline`}>{title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ToggleRow = ({ label, sub, checked, onChange, warning, icon: Icon, help }: any) => (
    <div
        onClick={onChange}
        className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-cyber-primary/20 hover:bg-cyber-primary/[0.02] transition-all duration-500 group/row cursor-pointer active:scale-[0.98]"
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${checked ? 'bg-cyber-primary/10 text-cyber-primary shadow-inner' : 'bg-white/5 text-gray-600 grayscale group-hover/row:grayscale-0'}`}>
                {Icon && <Icon size={20} />}
            </div>
            <div className="space-y-0.5">
                <div className="text-sm font-black text-gray-200 tracking-wide uppercase flex items-center">
                    {label}
                    {help && <HelpBubble text={help} />}
                </div>
                <p className="text-[10px] text-gray-600 font-bold tracking-wider">{sub}</p>
                {warning && checked && (
                    <p className="text-[10px] text-yellow-500/80 flex items-center gap-1 mt-1 font-bold italic animate-pulse">
                        <AlertTriangle size={10} /> {warning}
                    </p>
                )}
            </div>
        </div>
        <div
            className={`w-14 h-7 shrink-0 rounded-full p-1 transition-all duration-500 relative flex items-center ${checked ? 'bg-cyber-primary' : 'bg-white/10 shadow-inner'
                }`}
        >
            {checked && (
                <div className="absolute inset-0 bg-cyber-primary rounded-full animate-ping opacity-20" />
            )}
            <div className={`z-10 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 transform ${checked ? 'translate-x-[1.75rem]' : 'translate-x-0'
                }`} />
        </div>
    </div>
);

const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text" }: any) => (
    <div className="group space-y-3">
        <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1 block group-focus-within:text-cyber-primary transition-all duration-500 flex items-center gap-2">
            {Icon && <Icon size={14} className="opacity-50 group-focus-within:opacity-100 transition-opacity" />} {label}
        </label>
        <div className="relative group/field">
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-white/[0.02] border-b-2 border-white/5 rounded-t-xl px-5 py-4 text-white text-base font-medium focus:border-cyber-primary focus:bg-white/[0.05] outline-none transition-all duration-700 placeholder:text-gray-700 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.1em] shadow-inner"
            />
            <div className="absolute bottom-0 left-0 h-0.5 bg-cyber-primary w-0 group-focus-within:w-full transition-all duration-1000" />
            {sub && <p className="text-[10px] text-gray-600 font-bold mt-2 ml-1 italic group-focus-within:text-gray-400 transition-colors">{sub}</p>}
        </div>
    </div>
);

const RadioCard = ({ label, options, value, onChange }: any) => (
    <div className="grid grid-cols-2 gap-4">
        {options.map((opt: any) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`p-6 rounded-3xl border transition-all duration-700 text-left relative overflow-hidden group/opt ${value === opt.value
                    ? 'bg-cyber-primary/10 border-cyber-primary shadow-[0_0_30px_rgba(0,255,157,0.1)]'
                    : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
            >
                {value === opt.value && (
                    <div className="absolute top-0 right-0 p-2 animate-in zoom-in-50 duration-500">
                        <div className="bg-cyber-primary w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,255,157,1)]" />
                    </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${value === opt.value ? 'bg-cyber-primary/20 text-cyber-primary scale-110' : 'bg-white/5 text-gray-600 scale-100 group-hover/opt:scale-105'}`}>
                        {opt.icon && <opt.icon size={20} />}
                    </div>
                    <div>
                        <span className={`font-black text-xs uppercase tracking-[0.1em] transition-colors duration-500 ${value === opt.value ? 'text-white' : 'text-gray-500'}`}>{opt.label}</span>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-opacity duration-500 ${value === opt.value ? 'opacity-100 text-cyber-primary' : 'opacity-40'}`}>Selected</p>
                    </div>
                </div>
                <p className="text-[10px] font-medium leading-relaxed italic opacity-60 tracking-wide">{opt.desc}</p>
            </button>
        ))}
    </div>
);

const ReceiptPreview = ({ settings }: { settings: Partial<SystemConfig> }) => {
    const {
        storeName = 'SIIFMART',
        posReceiptLogo,
        posReceiptShowLogo = true,
        posReceiptHeader = 'SIIFMART RETAIL',
        posReceiptFooter = 'Thank you for shopping with us!',
        posReceiptAddress,
        posReceiptPhone,
        posReceiptEmail,
        posReceiptTaxId,
        posReceiptPolicy,
        posReceiptSocialHandle,
        posReceiptEnableQR = true,
        posReceiptQRLink = 'https://siifmart.com/feedback',
        posReceiptWidth = '80mm',
        posReceiptFont = 'sans-serif'
    } = settings;

    const displayStoreName = storeName || 'SIIFMART';
    const is80mm = posReceiptWidth === '80mm';
    const paperWidth = is80mm ? '80mm' : '58mm';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: ${paperWidth} auto; margin: 0; }
          body { 
            font-family: ${posReceiptFont === 'monospace' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'system-ui, -apple-system, sans-serif'}; 
            width: ${paperWidth}; 
            margin: 0; 
            padding: 24px;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            font-size: 10px;
          }
          
          /* Utilities matching Tailwind */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .gap-2 { gap: 8px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-4 { margin-bottom: 16px; }
          .pb-4 { padding-bottom: 16px; }
          .py-3 { padding-top: 12px; padding-bottom: 12px; }
          .pt-2 { padding-top: 8px; }
          .mt-2 { margin-top: 8px; }
          .space-y-05 > * + * { margin-top: 2px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-2 > * + * { margin-top: 8px; }
          
          /* Typography */
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .tracking-tighter { letter-spacing: -0.05em; }
          .tracking-widest { letter-spacing: 0.1em; }
          .italic { font-style: italic; }
          .leading-none { line-height: 1; }
          .leading-tight { line-height: 1.25; }
          
          /* Font Sizes */
          .text-[9px] { font-size: 9px; }
          .text-[10px] { font-size: 10px; }
          .text-xs { font-size: 12px; }
          .text-base { font-size: 16px; }
          .text-xl { font-size: 20px; }
          
          /* Opacity */
          .opacity-60 { opacity: 0.6; }
          .opacity-70 { opacity: 0.7; }
          .opacity-80 { opacity: 0.8; }
          
          /* Borders */
          .border-b-2-dashed { border-bottom: 2px dashed rgba(0,0,0,0.1); }
          .border-y { border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); }
          .border-t-black { border-top: 1px solid #000; }
          .border-t-dashed { border-top: 1px dashed rgba(0,0,0,0.1); }
          
          /* Images */
          .logo { max-height: 48px; object-fit: contain; margin: 0 auto; filter: grayscale(1); display: block; }
        </style>
      </head>
      <body>
          ${posReceiptShowLogo && posReceiptLogo ? `
            <div class="flex justify-center mb-4">
              <img src="${posReceiptLogo}" class="logo" />
            </div>
          ` : ''}
          
          <div class="text-center border-b-2-dashed pb-4 mb-4">
            <h2 class="text-xl font-black uppercase tracking-tighter leading-none mb-1">${displayStoreName}</h2>
            <p class="text-[10px] font-bold uppercase tracking-widest opacity-80">${posReceiptHeader}</p>
          </div>

          <div class="text-[10px] text-center space-y-05 mb-4 border-b-2-dashed pb-4">
            ${posReceiptAddress ? `<p>${posReceiptAddress}</p>` : ''}
            <div class="flex justify-center gap-2">
              ${posReceiptPhone ? `<p>Tel: ${posReceiptPhone}</p>` : ''}
              ${posReceiptEmail ? `<p>Email: ${posReceiptEmail}</p>` : ''}
            </div>
            ${posReceiptTaxId ? `<p class="font-bold">TIN: ${posReceiptTaxId}</p>` : ''}
          </div>

          <div class="text-[10px] space-y-1 mb-4">
            <div class="flex justify-between"><span class="opacity-60">DATE:</span> <span>${formatDateTime(new Date(), { showTime: true })}</span></div>
            <div class="flex justify-between"><span class="opacity-60">RECEIPT:</span> <span class="font-bold">TX-8829-1029</span></div>
            <div class="flex justify-between"><span class="opacity-60">CASHIER:</span> <span>ADMINISTRATOR</span></div>
          </div>

          <div class="border-y py-3 mb-4 space-y-2">
            <div class="flex justify-between text-[10px]">
                <div>
                    <div class="font-bold">MacBook Pro 14"</div>
                    <div class="text-[9px] opacity-60">1 x ${CURRENCY_SYMBOL}2,499.00</div>
                </div>
                <div class="font-bold">${CURRENCY_SYMBOL}2,499.00</div>
            </div>
            <div class="flex justify-between text-[10px]">
                <div>
                    <div class="font-bold">Magic Mouse</div>
                    <div class="text-[9px] opacity-60">2 x ${CURRENCY_SYMBOL}79.00</div>
                </div>
                <div class="font-bold">${CURRENCY_SYMBOL}158.00</div>
            </div>
          </div>

          <div class="space-y-1 text-right mb-4">
            <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${CURRENCY_SYMBOL}2,657.00</span></div>
            <div class="flex justify-between text-[10px] opacity-60"><span>Tax (${settings.taxRate || 0}%)</span><span>${CURRENCY_SYMBOL}${(2657 * (settings.taxRate || 0) / 100).toFixed(2)}</span></div>
            <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2"><span>TOTAL</span> <span>${CURRENCY_SYMBOL}3,055.55</span></div>
          </div>

          <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
            <div class="flex justify-between">
              <span>PAID (CARD)</span>
              <span>${CURRENCY_SYMBOL}3,055.55</span>
            </div>
          </div>

          <div class="text-center space-y-1 pt-4 border-t-dashed">
            <p class="text-xs font-bold leading-tight mb-2">${posReceiptFooter}</p>
            ${posReceiptSocialHandle ? `<p class="text-[10px] opacity-70 font-medium">${posReceiptSocialHandle}</p>` : ''}
            ${posReceiptPolicy ? `<p class="text-[9px] italic opacity-60 leading-tight">${posReceiptPolicy}</p>` : ''}

            ${posReceiptEnableQR ? `
              <div class="flex justify-center mt-4">
                 <img src="https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=${encodeURIComponent(posReceiptQRLink)}" style="width: 64px; height: 64px;" />
              </div>
            ` : ''}
          </div>
      </body>
      </html>
    `;

    return (
        <div className={`bg-white shadow-2xl rounded-lg overflow-hidden border border-black/10 flex flex-col ${is80mm ? 'w-[320px]' : 'w-[240px]'}`} style={{ height: '500px' }}>
            <iframe
                srcDoc={html}
                title="Receipt Preview"
                className="w-full h-full border-none"
            />
        </div>
    );
};

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
            console.error(`Failed to save ${section} settings:`, err);
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GlassCard className="p-8">
                            <SectionHeader
                                title="Retail Station"
                                desc="Core behavior and terminal logic"
                                icon={Monitor}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                                <InputGroup
                                    label="Terminal Identifier"
                                    value={workflow.posTerminalId}
                                    onChange={(e: any) => setWorkflow(prev => ({ ...prev, posTerminalId: e.target.value }))}
                                    icon={Monitor}
                                    placeholder="TERM-001"
                                    sub="Unique hardware ID for audit trails"
                                />

                                <div className="space-y-4 md:col-span-1 xl:col-span-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] pl-1">Operational Mode</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <RadioCard
                                            value={workflow.posRegisterMode}
                                            onChange={(val: 'cashier' | 'kiosk') => setWorkflow(prev => ({ ...prev, posRegisterMode: val }))}
                                            options={[
                                                { value: 'cashier', label: 'Cashier POS', desc: 'Managed staff interface', icon: UserCheck },
                                                { value: 'kiosk', label: 'Self Service', desc: 'Secure customer face', icon: ShoppingBag },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 pt-16 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <ToggleRow
                                    label="Guest Checkout"
                                    sub="Allow anonymous sales"
                                    checked={workflow.posGuestCheckout}
                                    onChange={() => setWorkflow(prev => ({ ...prev, posGuestCheckout: !prev.posGuestCheckout }))}
                                    icon={UserCheck}
                                    help="Enable this to process sales without requiring a customer profile. Ideal for quick retail transactions."
                                />
                                <ToggleRow
                                    label="Stock Compliance"
                                    sub="Block sales @ zero"
                                    checked={workflow.posBlockNegativeStock}
                                    onChange={() => setWorkflow(prev => ({ ...prev, posBlockNegativeStock: !prev.posBlockNegativeStock }))}
                                    warning="Strict validation"
                                    icon={ShieldAlert}
                                    help="When active, the terminal will prevent adding items to a cart if they have zero or negative inventory."
                                />
                                <ToggleRow
                                    label="Shift Enforcement"
                                    sub="Z-Report on exit"
                                    checked={workflow.requireShiftClosure}
                                    onChange={() => setWorkflow(prev => ({ ...prev, requireShiftClosure: !prev.requireShiftClosure }))}
                                    icon={Lock}
                                    help="Forces cashiers to generate a Z-Report (Shift Closure) before they can log out of the station."
                                />
                            </div>

                            <div className="mt-12 flex justify-end">
                                <Button
                                    onClick={() => handleSaveSection('workflow')}
                                    loading={isSavingWorkflow}
                                    icon={<Save size={18} />}
                                    variant="primary"
                                    className="px-10 h-12 shadow-[0_0_20px_rgba(0,255,157,0.15)] rounded-2xl"
                                >
                                    Apply Changes
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'connectivity' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GlassCard className="p-8">
                            <SectionHeader
                                title="Connectivity"
                                desc="Payments and transaction flow"
                                icon={Globe}
                            />

                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <label className="text-[10px] text-cyber-primary font-black uppercase tracking-[0.3em] pl-1 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                                        Active Payment Gateways
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
                                        {['Cash', 'Card', 'Mobile Money', 'Store Credit'].map(method => {
                                            const methodKey = `payment_${method.toLowerCase().replace(' ', '_')}` as keyof typeof payments;
                                            const isActive = payments[methodKey];
                                            return (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setPayments(prev => ({ ...prev, [methodKey]: !isActive }))}
                                                    className={`h-36 rounded-[2rem] border-2 transition-all duration-700 flex flex-col items-center justify-center gap-4 group/gate ${isActive
                                                        ? 'bg-cyber-primary/10 text-white border-cyber-primary shadow-[0_0_30px_rgba(0,255,157,0.1)]'
                                                        : 'bg-white/[0.02] text-gray-600 border-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className={`p-4 rounded-2xl transition-all duration-500 shadow-xl ${isActive ? 'bg-cyber-primary text-black scale-110' : 'bg-white/5 text-gray-600 group-hover/gate:scale-110'}`}>
                                                        {method === 'Cash' ? <Smartphone size={24} /> : method === 'Card' ? <CreditCard size={24} /> : method === 'Mobile Money' ? <Smartphone size={24} /> : <UserCheck size={24} />}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-2">{method}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pt-10 border-t border-white/[0.05]">
                                    <ToggleRow
                                        label="Cloud Receipts"
                                        sub="Digital SMS/Email delivery"
                                        checked={payments.posDigitalReceipts}
                                        onChange={() => setPayments(prev => ({ ...prev, posDigitalReceipts: !prev.posDigitalReceipts }))}
                                        icon={Smartphone}
                                        help="Automatically sends a digital copy of the receipt to the customer's phone or email after checkout."
                                    />
                                    <ToggleRow
                                        label="Auto-Print Logic"
                                        sub="Hardware-trigger on total"
                                        checked={payments.posAutoPrint}
                                        onChange={() => setPayments(prev => ({ ...prev, posAutoPrint: !prev.posAutoPrint }))}
                                        icon={Printer}
                                        help="The connected station printer will automatically start printing once the 'Complete Order' button is pressed."
                                    />
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <Button
                                    onClick={() => handleSaveSection('payments')}
                                    loading={isSavingPayments}
                                    icon={<Save size={18} />}
                                    variant="primary"
                                    className="px-10 h-12 shadow-[0_0_20px_rgba(0,255,157,0.15)] rounded-2xl"
                                >
                                    Sync Configuration
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'identity' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GlassCard className="p-10 lg:p-14 border-white/[0.05]">
                            {/* Overlay for clicking outside */}
                            <div
                                className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-700 ${isPreviewOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                onClick={() => setIsPreviewOpen(false)}
                            />
                            <div className="mb-16">
                                <SectionHeader
                                    title="Brand Identity"
                                    desc="Configure how your brand is perceived through digital and physical receipt outputs. All changes are reflected in real-time."
                                    icon={Sparkles}
                                />
                            </div>

                            <div className="space-y-16">
                                {/* Visual Assets */}
                                <div className="relative">
                                    <SectionHeader
                                        title="Visual Assets"
                                        desc="Global logo and visibility controls"
                                        icon={Sparkles}
                                        compact
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 items-end">
                                        <div className="xl:col-span-2">
                                            <InputGroup
                                                label="Logo Asset URL"
                                                value={receiptBranding.posReceiptLogo}
                                                onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptLogo: e.target.value }))}
                                                icon={Image}
                                                placeholder="https://assets.siifmart.com/logo.png"
                                                sub="SVG or transparent PNG recommended"
                                            />
                                        </div>
                                        <ToggleRow
                                            label="Logo Display"
                                            sub="Show in receipt header"
                                            checked={receiptBranding.posReceiptShowLogo}
                                            onChange={() => setReceiptBranding(prev => ({ ...prev, posReceiptShowLogo: !prev.posReceiptShowLogo }))}
                                            help="When active, the terminal logo will be centered at the top."
                                        />
                                    </div>
                                </div>

                                {/* Messaging */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                    <InputGroup
                                        label="Terminal Header"
                                        value={receiptBranding.posReceiptHeader}
                                        onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptHeader: e.target.value }))}
                                        icon={Type}
                                        placeholder="SIIFMART MEGA STORE"
                                    />
                                    <InputGroup
                                        label="Terminal Footer"
                                        value={receiptBranding.posReceiptFooter}
                                        onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptFooter: e.target.value }))}
                                        icon={FileText}
                                        placeholder="Visit us again soon"
                                    />
                                    <div className="md:col-span-2 xl:col-span-1 space-y-4">
                                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] pl-1">Refund Policy & Terms</label>
                                        <textarea
                                            title="Legal Context"
                                            value={receiptBranding.posReceiptPolicy}
                                            onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptPolicy: e.target.value }))}
                                            className="w-full h-32 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] px-8 py-6 text-white text-xs focus:border-cyber-primary outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Overlay for clicking outside */}
                                <div
                                    className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-700 ${isNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    onClick={() => setIsNavOpen(false)}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                    <div className="md:col-span-2 xl:col-span-1">
                                        <InputGroup
                                            label="HQ Physical Address"
                                            value={receiptBranding.posReceiptAddress}
                                            onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptAddress: e.target.value }))}
                                            icon={MapPin}
                                        />
                                    </div>
                                    <InputGroup
                                        label="Support Line"
                                        value={receiptBranding.posReceiptPhone}
                                        onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptPhone: e.target.value }))}
                                        icon={Phone}
                                    />
                                    <InputGroup
                                        label="VAT Identity"
                                        value={receiptBranding.posReceiptTaxId}
                                        onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptTaxId: e.target.value }))}
                                        icon={Shield}
                                    />
                                </div>

                                {/* Hardware and Feedback Controls */}
                                <div className="space-y-12">
                                    <SectionHeader
                                        title="Output Geometry"
                                        desc="Printer width and typography styles"
                                        icon={Printer}
                                        compact
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-10">
                                        <RadioCard
                                            value={receiptBranding.posReceiptWidth}
                                            onChange={(val: any) => setReceiptBranding(prev => ({ ...prev, posReceiptWidth: val }))}
                                            options={[
                                                { value: '80mm', label: '80mm Thermal', desc: 'Standard desktop', icon: Printer },
                                                { value: '58mm', label: '58mm Mobile', desc: 'Handheld unit', icon: Smartphone },
                                            ]}
                                        />
                                        <RadioCard
                                            value={receiptBranding.posReceiptFont}
                                            onChange={(val: any) => setReceiptBranding(prev => ({ ...prev, posReceiptFont: val }))}
                                            options={[
                                                { value: 'sans-serif', label: 'Modern Sans', desc: 'Clean high-res', icon: Type },
                                                { value: 'monospace', label: 'Impact Mono', desc: 'Thermal legacy', icon: FileText },
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/[0.05] grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                    <ToggleRow
                                        label="Dynamic Review QR"
                                        sub="Embed tracking link on receipt tail"
                                        checked={receiptBranding.posReceiptEnableQR}
                                        onChange={() => setReceiptBranding(prev => ({ ...prev, posReceiptEnableQR: !prev.posReceiptEnableQR }))}
                                        icon={QrCode}
                                        help="Automatically generates a QR code at the bottom of the receipt for customer feedback."
                                    />
                                    {receiptBranding.posReceiptEnableQR && (
                                        <InputGroup
                                            label="Destination URL"
                                            value={receiptBranding.posReceiptQRLink}
                                            onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptQRLink: e.target.value }))}
                                            placeholder="siifmart.com/feedback"
                                            icon={Globe}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="mt-16 flex justify-end">
                                <button
                                    onClick={() => handleSaveSection('branding')}
                                    disabled={isSavingBranding}
                                    className="bg-white text-black px-12 py-5 rounded-[2rem] font-black text-sm hover:bg-cyber-primary hover:text-black transition-all flex items-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
                                >
                                    {isSavingBranding ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                    <span>Update Brand Identity</span>
                                </button>
                            </div>
                        </GlassCard>
                    </div>
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
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

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
