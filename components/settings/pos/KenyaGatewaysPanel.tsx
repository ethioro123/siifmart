import React, { useState } from 'react';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { ToggleRow, InputGroup } from '../POSSettingsUI';

export interface MobileGatewaysFormState {
    mpesaTillEnabled: boolean;
    mpesaTillNumber: string;
    mpesaTillName: string;
    mpesaStkEnabled: boolean;
    mpesaStkShortcode: string;
    mpesaPasskey: string;
    mpesaConsumerKey: string;
    mpesaConsumerSecret: string;
    mpesaEnvironment: 'sandbox' | 'production';
    mpesaPaybillEnabled: boolean;
    mpesaPaybillNumber: string;
    mpesaPaybillAccount: string;
    airtelMoneyEnabled: boolean;
    airtelTillNumber: string;
    airtelMerchantName: string;
    telebirrEnabled: boolean;
    telebirrMerchantId: string;
    cbeBirrEnabled: boolean;
    cbeBirrMerchantCode: string;
}

interface KenyaGatewaysPanelProps {
    form: MobileGatewaysFormState;
    setForm: React.Dispatch<React.SetStateAction<MobileGatewaysFormState>>;
    onPingGateway: () => void;
    pingState: 'idle' | 'pinging' | 'success';
}

export function KenyaGatewaysPanel({
    form,
    setForm,
    onPingGateway,
    pingState
}: KenyaGatewaysPanelProps) {
    const [showSecrets, setShowSecrets] = useState(false);

    return (
        <div className="space-y-6">
            {/* OPTION 1: SAFARICOM LIPA NA M-PESA BUY GOODS TILL */}
            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-3xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-[#00A859] flex items-center justify-center font-black text-xs">
                            M1
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                Lipa Na M-Pesa (Buy Goods Till)
                                <span className="text-[10px] bg-emerald-100 text-[#00A859] dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">Popular</span>
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">
                                Walk-in customers pay via M-Pesa menu; cashier enters 10-character SMS confirmation code.
                            </p>
                        </div>
                    </div>
                    <ToggleRow
                        checked={form.mpesaTillEnabled}
                        onChange={() => setForm(p => ({ ...p, mpesaTillEnabled: !p.mpesaTillEnabled }))}
                        label=""
                        sub=""
                    />
                </div>

                {form.mpesaTillEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <InputGroup
                            label="Buy Goods Till Number"
                            value={form.mpesaTillNumber}
                            onChange={(e: any) => setForm(p => ({ ...p, mpesaTillNumber: e.target.value.replace(/\D/g, '') }))}
                            placeholder="e.g. 882910"
                            sub="Displayed to cashier and on counter QR signage"
                        />
                        <InputGroup
                            label="Store / Till Display Name"
                            value={form.mpesaTillName}
                            onChange={(e: any) => setForm(p => ({ ...p, mpesaTillName: e.target.value }))}
                            placeholder="e.g. SIIFMART MAIN STORE"
                            sub="Registered business name with Safaricom"
                        />
                    </div>
                )}
            </div>

            {/* OPTION 2: M-PESA STK PUSH EXPRESS (DARAJA API) */}
            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-3xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-[#00A859] flex items-center justify-center font-black text-xs">
                            M2
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                M-Pesa STK Push Express (Daraja API)
                                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/40 px-2 py-0.5 rounded-full font-bold">API Automated</span>
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">
                                Sends interactive PIN prompt directly to customer phone handset; auto-completes transaction.
                            </p>
                        </div>
                    </div>
                    <ToggleRow
                        checked={form.mpesaStkEnabled}
                        onChange={() => setForm(p => ({ ...p, mpesaStkEnabled: !p.mpesaStkEnabled }))}
                        label=""
                        sub=""
                    />
                </div>

                {form.mpesaStkEnabled && (
                    <div className="space-y-4 pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputGroup
                                label="Business Shortcode / Till"
                                value={form.mpesaStkShortcode}
                                onChange={(e: any) => setForm(p => ({ ...p, mpesaStkShortcode: e.target.value }))}
                                placeholder="e.g. 174379 or Till"
                            />
                            <div className="space-y-2">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider block">
                                    Daraja Environment
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['sandbox', 'production'] as const).map(env => (
                                        <button
                                            key={env}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, mpesaEnvironment: env }))}
                                            className={`py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                                                form.mpesaEnvironment === env
                                                    ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                                                    : 'bg-white dark:bg-black/30 text-stone-500 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]'
                                            }`}
                                        >
                                            {env}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <InputGroup
                                label="Consumer Key"
                                type={showSecrets ? "text" : "password"}
                                value={form.mpesaConsumerKey}
                                onChange={(e: any) => setForm(p => ({ ...p, mpesaConsumerKey: e.target.value }))}
                                placeholder="Daraja App Key"
                            />
                            <InputGroup
                                label="Consumer Secret"
                                type={showSecrets ? "text" : "password"}
                                value={form.mpesaConsumerSecret}
                                onChange={(e: any) => setForm(p => ({ ...p, mpesaConsumerSecret: e.target.value }))}
                                placeholder="Daraja App Secret"
                            />
                            <InputGroup
                                label="Lipa Na M-Pesa Passkey"
                                type={showSecrets ? "text" : "password"}
                                value={form.mpesaPasskey}
                                onChange={(e: any) => setForm(p => ({ ...p, mpesaPasskey: e.target.value }))}
                                placeholder="Encrypted Passkey"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setShowSecrets(!showSecrets)}
                                className="text-xs text-stone-500 hover:text-[#2C5E3B] font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                                {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
                                {showSecrets ? 'Hide Credentials' : 'Show Credentials'}
                            </button>

                            <button
                                type="button"
                                onClick={onPingGateway}
                                disabled={pingState === 'pinging'}
                                className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-950/40 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-all"
                            >
                                <Zap size={13} />
                                {pingState === 'pinging' ? 'Testing Handshake...' : pingState === 'success' ? 'Connected (200 OK)' : 'Ping Gateway'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* OPTION 4: AIRTEL MONEY */}
            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-3xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-[#ED1C24] flex items-center justify-center font-black text-xs">
                            AM
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                Airtel Money (Lipa / Interoperable)
                                <span className="text-[10px] bg-red-100 text-[#ED1C24] dark:bg-red-950/40 px-2 py-0.5 rounded-full font-bold">0% Till Fee</span>
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">
                                Accept Airtel Money payments via dedicated Airtel Till or interoperable merchant code.
                            </p>
                        </div>
                    </div>
                    <ToggleRow
                        checked={form.airtelMoneyEnabled}
                        onChange={() => setForm(p => ({ ...p, airtelMoneyEnabled: !p.airtelMoneyEnabled }))}
                        label=""
                        sub=""
                    />
                </div>

                {form.airtelMoneyEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <InputGroup
                            label="Airtel Till / Merchant Number"
                            value={form.airtelTillNumber}
                            onChange={(e: any) => setForm(p => ({ ...p, airtelTillNumber: e.target.value.replace(/\D/g, '') }))}
                            placeholder="e.g. 554433"
                            sub="Assigned Airtel Money Till code"
                        />
                        <InputGroup
                            label="Airtel Merchant Display Name"
                            value={form.airtelMerchantName}
                            onChange={(e: any) => setForm(p => ({ ...p, airtelMerchantName: e.target.value }))}
                            placeholder="e.g. SIIFMART AIRTEL"
                            sub="Display title on Airtel customer SMS"
                        />
                    </div>
                )}
            </div>

            {/* OPTION 3: M-PESA PAYBILL */}
            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-3xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                            PB
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                M-Pesa Paybill (Business & Institutional)
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">
                                For wholesale orders and invoice settlements with explicit account numbers.
                            </p>
                        </div>
                    </div>
                    <ToggleRow
                        checked={form.mpesaPaybillEnabled}
                        onChange={() => setForm(p => ({ ...p, mpesaPaybillEnabled: !p.mpesaPaybillEnabled }))}
                        label=""
                        sub=""
                    />
                </div>

                {form.mpesaPaybillEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <InputGroup
                            label="Paybill Business Number"
                            value={form.mpesaPaybillNumber}
                            onChange={(e: any) => setForm(p => ({ ...p, mpesaPaybillNumber: e.target.value }))}
                            placeholder="e.g. 400200"
                        />
                        <InputGroup
                            label="Default Account Identifier"
                            value={form.mpesaPaybillAccount}
                            onChange={(e: any) => setForm(p => ({ ...p, mpesaPaybillAccount: e.target.value }))}
                            placeholder="e.g. SIIFMART or Invoice No"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
