import React from 'react';
import { Monitor, CreditCard, Printer, ShoppingBag, UserCheck, AlertTriangle, Receipt, Smartphone, Lock, ShieldAlert } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS (Reusing for consistency) ---
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
                value={value}
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
    const { settings, updateSettings } = useData();

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
                    <SectionHeader title="Terminal & Workflow" desc="Checkout logic and permissions" />

                    <div className="space-y-6">
                        <InputGroup
                            label="Terminal Identifier"
                            value={settings.posTerminalId}
                            onChange={(e: any) => updateSettings({ posTerminalId: e.target.value }, user?.name || 'Admin')}
                            icon={Monitor}
                            placeholder="TERM-001"
                            sub="Unique ID printed on every receipt"
                        />

                        <div className="space-y-3">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Register Mode</label>
                            <RadioCard
                                value={settings.posRegisterMode || 'cashier'}
                                onChange={(val: string) => updateSettings({ posRegisterMode: val }, user?.name || 'Admin')}
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
                                checked={settings.posGuestCheckout}
                                onChange={() => updateSettings({ posGuestCheckout: !settings.posGuestCheckout }, user?.name || 'Admin')}
                                icon={UserCheck}
                            />
                            <ToggleRow
                                label="Block Negative Inventory"
                                sub="Prevent sale if item stock is <= 0"
                                checked={settings.posBlockNegativeStock}
                                onChange={() => updateSettings({ posBlockNegativeStock: !settings.posBlockNegativeStock }, user?.name || 'Admin')}
                                warning="May disrupt sales during busy hours"
                                icon={ShieldAlert}
                            />
                            <ToggleRow
                                label="Require Shift Closure"
                                sub="Force Z-Report generation before logout"
                                checked={settings.requireShiftClosure}
                                onChange={() => updateSettings({ requireShiftClosure: !settings.requireShiftClosure }, user?.name || 'Admin')}
                                icon={Lock}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* PAYMENTS & RECEIPT */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <SectionHeader title="Payments & Receipts" desc="Transactional settings" />

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                    <CreditCard size={14} /> Active Payment Methods
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Cash', 'Card', 'Mobile Money', 'Store Credit'].map(method => {
                                        const methodKey = `payment_${method.toLowerCase().replace(' ', '_')}`;
                                        const isActive = settings[methodKey];
                                        return (
                                            <button
                                                key={method}
                                                onClick={() => updateSettings({ [methodKey]: !isActive }, user?.name || 'Admin')}
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
                                    value={settings.posReceiptHeader}
                                    onChange={(e: any) => updateSettings({ posReceiptHeader: e.target.value }, user?.name || 'Admin')}
                                    icon={Receipt}
                                    placeholder="*** SIIFMART RETAIL ***"
                                />
                                <InputGroup
                                    label="Receipt Footer"
                                    value={settings.posReceiptFooter}
                                    onChange={(e: any) => updateSettings({ posReceiptFooter: e.target.value }, user?.name || 'Admin')}
                                    placeholder="Thank you for shopping with us!"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ToggleRow
                                    label="Digital Receipts"
                                    sub="Email/SMS options"
                                    checked={settings.posDigitalReceipts}
                                    onChange={() => updateSettings({ posDigitalReceipts: !settings.posDigitalReceipts }, user?.name || 'Admin')}
                                    icon={Smartphone}
                                />
                                <ToggleRow
                                    label="Auto-Print"
                                    sub="Print immediately"
                                    checked={settings.posAutoPrint}
                                    onChange={() => updateSettings({ posAutoPrint: !settings.posAutoPrint }, user?.name || 'Admin')}
                                    icon={Printer}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
