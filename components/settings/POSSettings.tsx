import React, { useState, useEffect } from 'react';
import { Monitor, CreditCard, Printer, ShoppingBag, UserCheck, AlertTriangle, Receipt, Smartphone, Lock, ShieldAlert, Save } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Button from '../shared/Button';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const ToggleRow = ({ label, sub, checked, onChange, warning, icon: Icon }: any) => (
    <div className="flex items-start justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex items-start gap-3">
            {Icon && <Icon size={18} className="text-gray-500 mt-0.5" />}
            <div className="space-y-1">
                <p className="text-sm font-bold text-gray-200">{label}</p>
                <p className="text-[10px] text-gray-500">{sub}</p>
                {warning && checked && (
                    <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                        <AlertTriangle size={10} /> {warning}
                    </p>
                )}
            </div>
        </div>
        <div
            onClick={onChange}
            className={`w-11 h-6 shrink-0 rounded-full p-1 cursor-pointer transition-colors relative ${checked ? 'bg-cyber-primary' : 'bg-white/10'
                }`}
        >
            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'
                }`} />
        </div>
    </div>
);

const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text" }: any) => (
    <div className="group">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div>
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all placeholder:text-gray-600"
            />
            {sub && <p className="text-[10px] text-gray-500 mt-2 ml-1">{sub}</p>}
        </div>
    </div>
);

const RadioCard = ({ label, options, value, onChange }: any) => (
    <div className="grid grid-cols-2 gap-3">
        {options.map((opt: any) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${value === opt.value
                    ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
            >
                <div className="flex items-center gap-2 mb-1">
                    {opt.icon && <opt.icon size={16} className={value === opt.value ? 'text-cyber-primary' : 'text-gray-500'} />}
                    <span className="font-bold text-sm">{opt.label}</span>
                </div>
                <p className="text-[10px] opacity-70">{opt.desc}</p>
            </button>
        ))}
    </div>
);

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
        posReceiptHeader: '',
        posReceiptFooter: '',
        posDigitalReceipts: true,
        posAutoPrint: false
    });

    const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
    const [isSavingPayments, setIsSavingPayments] = useState(false);

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
                posReceiptHeader: settings.posReceiptHeader || '',
                posReceiptFooter: settings.posReceiptFooter || '',
                posDigitalReceipts: settings.posDigitalReceipts ?? true,
                posAutoPrint: settings.posAutoPrint ?? false
            });
        }
    }, [settings]);

    const handleSaveSection = async (section: 'workflow' | 'payments') => {
        const setSaving = section === 'workflow' ? setIsSavingWorkflow : setIsSavingPayments;
        const data = section === 'workflow' ? workflow : payments;

        setSaving(true);
        try {
            await updateSettings(data, user?.name || 'Admin');
            addNotification('success', `${section === 'workflow' ? 'Workflow' : 'payment'} settings saved successfully!`);
        } catch (err) {
            console.error(`Failed to save ${section} settings:`, err);
            addNotification('alert', `Failed to save ${section} settings.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
                <Monitor className="text-purple-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-purple-400 font-bold text-sm">Retail Station Config</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure this terminal's behavior, attached hardware, and payment acceptance.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* TERMINAL & WORKFLOW */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                    <div className="mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-white">Terminal & Workflow</h3>
                        <p className="text-sm text-gray-400 mt-1">Checkout logic and permissions</p>
                    </div>

                    <div className="space-y-6">
                        <InputGroup
                            label="Terminal Identifier"
                            value={workflow.posTerminalId}
                            onChange={(e: any) => setWorkflow(prev => ({ ...prev, posTerminalId: e.target.value }))}
                            icon={Monitor}
                            placeholder="TERM-001"
                            sub="Unique ID printed on every receipt"
                        />

                        <div className="space-y-3">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Register Mode</label>
                            <RadioCard
                                value={workflow.posRegisterMode}
                                onChange={(val: 'cashier' | 'kiosk') => setWorkflow(prev => ({ ...prev, posRegisterMode: val }))}
                                options={[
                                    { value: 'cashier', label: 'Cashier POS', desc: 'Full featured staff interface', icon: UserCheck },
                                    { value: 'kiosk', label: 'Self Checkout', desc: 'Simplified customer interface', icon: ShoppingBag },
                                ]}
                            />
                        </div>

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-3">
                            <ToggleRow
                                label="Allow Guest Checkout"
                                sub="Process sales without attaching a customer profile"
                                checked={workflow.posGuestCheckout}
                                onChange={() => setWorkflow(prev => ({ ...prev, posGuestCheckout: !prev.posGuestCheckout }))}
                                icon={UserCheck}
                            />
                            <ToggleRow
                                label="Block Negative Inventory"
                                sub="Prevent sale if item stock is <= 0"
                                checked={workflow.posBlockNegativeStock}
                                onChange={() => setWorkflow(prev => ({ ...prev, posBlockNegativeStock: !prev.posBlockNegativeStock }))}
                                warning="May disrupt sales during busy hours"
                                icon={ShieldAlert}
                            />
                            <ToggleRow
                                label="Require Shift Closure"
                                sub="Force Z-Report generation before logout"
                                checked={workflow.requireShiftClosure}
                                onChange={() => setWorkflow(prev => ({ ...prev, requireShiftClosure: !prev.requireShiftClosure }))}
                                icon={Lock}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* PAYMENTS & RECEIPT */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-bold text-white">Payments & Receipts</h3>
                            <p className="text-sm text-gray-400 mt-1">Transactional settings</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                    <CreditCard size={14} /> Active Payment Methods
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Cash', 'Card', 'Mobile Money', 'Store Credit'].map(method => {
                                        const methodKey = `payment_${method.toLowerCase().replace(' ', '_')}` as keyof typeof payments;
                                        const isActive = payments[methodKey];
                                        return (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => setPayments(prev => ({ ...prev, [methodKey]: !isActive }))}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${isActive
                                                    ? 'bg-cyber-primary text-black border-cyber-primary'
                                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-black' : 'bg-gray-600'}`} />
                                                {method}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <InputGroup
                                    label="Receipt Header"
                                    value={payments.posReceiptHeader}
                                    onChange={(e: any) => setPayments(prev => ({ ...prev, posReceiptHeader: e.target.value }))}
                                    icon={Receipt}
                                    placeholder="*** SIIFMART RETAIL ***"
                                />
                                <InputGroup
                                    label="Receipt Footer"
                                    value={payments.posReceiptFooter}
                                    onChange={(e: any) => setPayments(prev => ({ ...prev, posReceiptFooter: e.target.value }))}
                                    placeholder="Thank you for shopping with us!"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ToggleRow
                                    label="Digital Receipts"
                                    sub="Email/SMS options"
                                    checked={payments.posDigitalReceipts}
                                    onChange={() => setPayments(prev => ({ ...prev, posDigitalReceipts: !prev.posDigitalReceipts }))}
                                    icon={Smartphone}
                                />
                                <ToggleRow
                                    label="Auto-Print"
                                    sub="Print immediately"
                                    checked={payments.posAutoPrint}
                                    onChange={() => setPayments(prev => ({ ...prev, posAutoPrint: !prev.posAutoPrint }))}
                                    icon={Printer}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                            <Button
                                onClick={() => handleSaveSection('payments')}
                                loading={isSavingPayments}
                                icon={<Save size={16} />}
                                variant="primary"
                                className="px-8"
                            >
                                Save Payments
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
