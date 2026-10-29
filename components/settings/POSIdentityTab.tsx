import React from 'react';
import {
  Sparkles, Image, Type, FileText, MapPin, Phone,
  Shield, Printer, Smartphone, QrCode, Globe, Save
} from 'lucide-react';
import { GlassCard, SectionHeader, InputGroup, RadioCard, ToggleRow } from './POSSettingsUI';
import type { Country } from '../../utils/localization';
import { getCountryProfile } from '../../utils/localization';

export interface ReceiptBrandingState {
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
}

interface POSIdentityTabProps {
  receiptBranding: ReceiptBrandingState;
  setReceiptBranding: React.Dispatch<React.SetStateAction<ReceiptBrandingState>>;
  isSavingBranding: boolean;
  handleSaveSection: (section: 'workflow' | 'payments' | 'branding') => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (val: boolean) => void;
  isNavOpen: boolean;
  setIsNavOpen: (val: boolean) => void;
  selectedCountry?: Country;
}

export function POSIdentityTab({
  receiptBranding,
  setReceiptBranding,
  isSavingBranding,
  handleSaveSection,
  selectedCountry = 'ET',
}: POSIdentityTabProps) {
  const countryProfile = getCountryProfile({ country: selectedCountry });
  const isKenya = selectedCountry === 'KE';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <GlassCard className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--theme-border)] mb-6">
          <SectionHeader
            title="Receipt Layout & Thermal Branding"
            desc="Configure how your brand appears on printed slips and digital invoices."
            icon={Sparkles}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl self-start sm:self-auto">
            <span className="w-5 h-5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center font-bold text-[10px] text-[var(--theme-text-primary)]">
              {selectedCountry}
            </span>
            <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
              {countryProfile.name}
            </span>
            <span className="text-[10px] font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] uppercase px-2 py-0.5 bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 rounded-full">
              {countryProfile.currency} ({countryProfile.currencySymbol})
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Visual Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <InputGroup
                label="Receipt Logo URL"
                value={receiptBranding.posReceiptLogo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReceiptBranding(prev => ({ ...prev, posReceiptLogo: e.target.value }))
                }
                icon={Image}
                placeholder="https://assets.siifmart.com/logo.png"
                sub="Transparent monochrome or high-contrast PNG"
              />
            </div>
            <ToggleRow
              label="Print Logo"
              sub="Include in slip header"
              checked={receiptBranding.posReceiptShowLogo}
              onChange={() =>
                setReceiptBranding(prev => ({ ...prev, posReceiptShowLogo: !prev.posReceiptShowLogo }))
              }
              icon={Image}
              help="When active, the terminal logo will be centered at the top of the slip."
            />
          </div>

          {/* Messaging */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputGroup
              label="Receipt Header"
              value={receiptBranding.posReceiptHeader}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReceiptBranding(prev => ({ ...prev, posReceiptHeader: e.target.value }))
              }
              icon={Type}
              placeholder={isKenya ? 'SIIFMART KENYA RETAIL' : 'SIIFMART RETAIL'}
            />
            <InputGroup
              label="Receipt Footer Note"
              value={receiptBranding.posReceiptFooter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReceiptBranding(prev => ({ ...prev, posReceiptFooter: e.target.value }))
              }
              icon={FileText}
              placeholder={isKenya ? 'Asante kwa ununuzi wako!' : 'Thank you for shopping with us!'}
            />
            <div className="md:col-span-2 lg:col-span-1 space-y-1.5">
              <label className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">
                Return Policy Text
              </label>
              <textarea
                title="Legal Context"
                value={receiptBranding.posReceiptPolicy}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReceiptBranding(prev => ({ ...prev, posReceiptPolicy: e.target.value }))
                }
                placeholder="Items may be returned within 7 days with valid receipt."
                className="w-full h-24 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-xs text-[var(--theme-text-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-colors resize-none placeholder:text-[var(--theme-text-secondary)]/40"
              />
            </div>
          </div>

          {/* Address & Tax */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputGroup
              label="Store Address"
              value={receiptBranding.posReceiptAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReceiptBranding(prev => ({ ...prev, posReceiptAddress: e.target.value }))
              }
              icon={MapPin}
              placeholder={isKenya ? 'Westlands Commercial Centre, Nairobi' : 'Bole, Addis Ababa'}
            />
            <InputGroup
              label="Support Phone"
              value={receiptBranding.posReceiptPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReceiptBranding(prev => ({ ...prev, posReceiptPhone: e.target.value }))
              }
              icon={Phone}
              placeholder={isKenya ? '+254 712 345 678' : '+251 911 234 567'}
            />
            <InputGroup
              label={isKenya ? 'KRA PIN / eTIMS ID' : 'TIN / VAT Identifier'}
              value={receiptBranding.posReceiptTaxId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReceiptBranding(prev => ({ ...prev, posReceiptTaxId: e.target.value }))
              }
              icon={Shield}
              placeholder={isKenya ? 'P051234567Z' : '0001234567'}
            />
          </div>

          {/* Hardware geometry */}
          <div className="space-y-3 pt-4 border-t border-[var(--theme-border)]">
            <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
              Thermal Paper Dimensions & Font
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioCard
                value={receiptBranding.posReceiptWidth}
                onChange={(val: string) =>
                  setReceiptBranding(prev => ({
                    ...prev,
                    posReceiptWidth: val === '58mm' ? '58mm' : '80mm'
                  }))
                }
                options={[
                  { value: '80mm', label: '80mm Thermal', desc: 'Standard desktop POS roll', icon: Printer },
                  { value: '58mm', label: '58mm Mobile', desc: 'Compact handheld roll', icon: Smartphone },
                ]}
              />
              <RadioCard
                value={receiptBranding.posReceiptFont}
                onChange={(val: string) =>
                  setReceiptBranding(prev => ({
                    ...prev,
                    posReceiptFont: val === 'monospace' ? 'monospace' : 'sans-serif'
                  }))
                }
                options={[
                  { value: 'sans-serif', label: 'Modern Sans', desc: 'High-contrast typography', icon: Type },
                  { value: 'monospace', label: 'Thermal Mono', desc: 'Classic receipt grid font', icon: FileText },
                ]}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--theme-border)] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ToggleRow
              label="Customer Feedback QR"
              sub="Print survey code on slip bottom"
              checked={receiptBranding.posReceiptEnableQR}
              onChange={() =>
                setReceiptBranding(prev => ({ ...prev, posReceiptEnableQR: !prev.posReceiptEnableQR }))
              }
              icon={QrCode}
              help="Generates an auto-scannable QR code at the bottom of the slip for customer ratings."
            />
            {receiptBranding.posReceiptEnableQR && (
              <InputGroup
                label="Destination Feedback URL"
                value={receiptBranding.posReceiptQRLink}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReceiptBranding(prev => ({ ...prev, posReceiptQRLink: e.target.value }))
                }
                placeholder={isKenya ? 'https://siifmart.com/feedback/ke' : 'https://siifmart.com/feedback'}
                icon={Globe}
              />
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--theme-border)] flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSection('branding')}
            disabled={isSavingBranding}
            className="h-10 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
          >
            {isSavingBranding ? (
              <span className="w-4 h-4 border-2 border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)] border-t-[var(--theme-border)] rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Update Receipt Branding ({selectedCountry})
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
