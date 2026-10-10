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
        <div className="space-y-4">
            {/* TELEBIRR */}
            <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                            TB
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                Ethio Telecom Telebirr
                            </h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
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
                    <div className="pt-3 border-t border-[var(--theme-border)]">
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
            <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                            CBE
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                Commercial Bank of Ethiopia (CBE Birr)
                            </h4>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
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
                    <div className="pt-3 border-t border-[var(--theme-border)]">
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
