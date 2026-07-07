import React from 'react';
import { Sparkles, Image, Type, FileText, MapPin, Phone, Shield, Printer, Smartphone, QrCode, Globe, Loader2 } from 'lucide-react';
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
  );
}
