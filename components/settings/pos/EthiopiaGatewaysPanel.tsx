import React from 'react';
import { ToggleRow, InputGroup } from '../POSSettingsUI';
import { MobileGatewaysFormState } from './KenyaGatewaysPanel';

interface EthiopiaGatewaysPanelProps {
    form: MobileGatewaysFormState;
    setForm: React.Dispatch<React.SetStateAction<MobileGatewaysFormState>>;
}

export function EthiopiaGatewaysPanel({
    form,
    setForm
}: EthiopiaGatewaysPanelProps) {
    return (
        <div className="space-y-6">
            {/* TELEBIRR */}
            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-3xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black text-xs">
                            TB
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">
                                Ethio Telecom Telebirr
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">
                                Ethiopia's primary digital wallet for retail QR payments.
                            </p>
                        </div>
                    </div>
                    <ToggleRow
                        checked={form.telebirrEnabled}
                        onChange={() => setForm(p => ({ ...p, telebirrEnabled: !p.telebirrEnabled }))}
                        label=""
                        sub=""
                    />
                </div>

                {form.telebirrEnabled && (
                    <div className="pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <InputGroup
                            label="Telebirr Merchant Code / Shortcode"
                            value={form.telebirrMerchantId}
                            onChange={(e: any) => setForm(p => ({ ...p, telebirrMerchantId: e.target.value }))}
                            placeholder="e.g. TB-998811"
                        />
                    </div>
                )}
            </div>

            {/* CBE BIRR */}
            <div className="p-5 bg-[#FAF8F5] dark:bg-black/20 rounded-3xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-black text-xs">
                            CBE
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">
                                Commercial Bank of Ethiopia (CBE Birr)
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">
                                CBE Birr merchant settlement and cashier QR code.
                            </p>
                        </div>
                    </div>
                    <ToggleRow
                        checked={form.cbeBirrEnabled}
                        onChange={() => setForm(p => ({ ...p, cbeBirrEnabled: !p.cbeBirrEnabled }))}
                        label=""
                        sub=""
                    />
                </div>

                {form.cbeBirrEnabled && (
                    <div className="pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5">
                        <InputGroup
                            label="CBE Birr Merchant Code"
                            value={form.cbeBirrMerchantCode}
                            onChange={(e: any) => setForm(p => ({ ...p, cbeBirrMerchantCode: e.target.value }))}
                            placeholder="e.g. CBE-445566"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
