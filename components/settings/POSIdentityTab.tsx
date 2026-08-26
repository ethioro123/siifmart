import React from 'react';
import { Sparkles, Image, Type, FileText, MapPin, Phone, Shield, Printer, Smartphone, QrCode, Globe, Loader2, Save } from 'lucide-react';
import { GlassCard, SectionHeader, InputGroup, RadioCard, ToggleRow } from './POSSettingsUI';

interface POSIdentityTabProps {
  receiptBranding: {
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
  };
  setReceiptBranding: React.Dispatch<React.SetStateAction<{
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
  }>>;
  isSavingBranding: boolean;
  handleSaveSection: (section: 'workflow' | 'payments' | 'branding') => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (val: boolean) => void;
  isNavOpen: boolean;
  setIsNavOpen: (val: boolean) => void;
}

export function POSIdentityTab({
  receiptBranding,
  setReceiptBranding,
  isSavingBranding,
  handleSaveSection,
  isPreviewOpen,
  setIsPreviewOpen,
  isNavOpen,
  setIsNavOpen
}: POSIdentityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-6 lg:p-8">
        <SectionHeader
          title="Receipt Layout & Thermal Branding"
          desc="Configure how your brand appears on printed slips and digital invoices."
          icon={Sparkles}
        />

        <div className="space-y-10">
          {/* Visual Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <InputGroup
                label="Receipt Logo URL"
                value={receiptBranding.posReceiptLogo}
                onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptLogo: e.target.value }))}
                icon={Image}
                placeholder="https://assets.siifmart.com/logo.png"
                sub="Transparent monochrome or high-contrast PNG"
              />
            </div>
            <ToggleRow
              label="Print Logo"
              sub="Include in slip header"
              checked={receiptBranding.posReceiptShowLogo}
              onChange={() => setReceiptBranding(prev => ({ ...prev, posReceiptShowLogo: !prev.posReceiptShowLogo }))}
              icon={Image}
              help="When active, the terminal logo will be centered at the top of the slip."
            />
          </div>

          {/* Messaging */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputGroup
              label="Receipt Header"
              value={receiptBranding.posReceiptHeader}
              onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptHeader: e.target.value }))}
              icon={Type}
              placeholder="SIIFMART RETAIL"
            />
            <InputGroup
              label="Receipt Footer Note"
              value={receiptBranding.posReceiptFooter}
              onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptFooter: e.target.value }))}
              icon={FileText}
              placeholder="Thank you for shopping with us!"
            />
            <div className="md:col-span-2 lg:col-span-1 space-y-2">
              <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider block">Return Policy Text</label>
              <textarea
                title="Legal Context"
                value={receiptBranding.posReceiptPolicy}
                onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptPolicy: e.target.value }))}
                placeholder="Items may be returned within 7 days with valid receipt."
                className="w-full h-24 bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-3 text-xs text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] transition-all resize-none"
              />
            </div>
          </div>

          {/* Address & Tax */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputGroup
              label="Store Address"
              value={receiptBranding.posReceiptAddress}
              onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptAddress: e.target.value }))}
              icon={MapPin}
              placeholder="Bole, Addis Ababa"
            />
            <InputGroup
              label="Support Phone"
              value={receiptBranding.posReceiptPhone}
              onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptPhone: e.target.value }))}
              icon={Phone}
              placeholder="+251 911 234 567"
            />
            <InputGroup
              label="TIN / VAT Identifier"
              value={receiptBranding.posReceiptTaxId}
              onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptTaxId: e.target.value }))}
              icon={Shield}
              placeholder="0001234567"
            />
          </div>

          {/* Hardware geometry */}
          <div className="space-y-4 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10">
            <h4 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">
              Thermal Paper Dimensions & Font
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadioCard
                value={receiptBranding.posReceiptWidth}
                onChange={(val: any) => setReceiptBranding(prev => ({ ...prev, posReceiptWidth: val }))}
                options={[
                  { value: '80mm', label: '80mm Thermal', desc: 'Standard desktop POS roll', icon: Printer },
                  { value: '58mm', label: '58mm Mobile', desc: 'Compact handheld roll', icon: Smartphone },
                ]}
              />
              <RadioCard
                value={receiptBranding.posReceiptFont}
                onChange={(val: any) => setReceiptBranding(prev => ({ ...prev, posReceiptFont: val }))}
                options={[
                  { value: 'sans-serif', label: 'Modern Sans', desc: 'High-contrast typography', icon: Type },
                  { value: 'monospace', label: 'Thermal Mono', desc: 'Classic receipt grid font', icon: FileText },
                ]}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[#E2DCCE]/60 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ToggleRow
              label="Customer Feedback QR"
              sub="Print survey code on slip bottom"
              checked={receiptBranding.posReceiptEnableQR}
              onChange={() => setReceiptBranding(prev => ({ ...prev, posReceiptEnableQR: !prev.posReceiptEnableQR }))}
              icon={QrCode}
              help="Generates an auto-scannable QR code at the bottom of the slip for customer ratings."
            />
            {receiptBranding.posReceiptEnableQR && (
              <InputGroup
                label="Destination Feedback URL"
                value={receiptBranding.posReceiptQRLink}
                onChange={(e: any) => setReceiptBranding(prev => ({ ...prev, posReceiptQRLink: e.target.value }))}
                placeholder="https://siifmart.com/feedback"
                icon={Globe}
              />
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSection('branding')}
            disabled={isSavingBranding}
            className="px-8 py-3 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            {isSavingBranding ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Update Receipt Branding
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
