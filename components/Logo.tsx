import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  logoUrl?: string;
  storeName?: string;
  accentColor?: string;
  variant?: 'horizontal' | 'stacked' | 'emblem';
  showTagline?: boolean;
}

/**
 * Pure Black & White Architectural Monolith Emblem.
 * Combines a bold geometric 'S' silhouette with the signature twin 'II' pillars in negative space.
 */
function SiifMonochromeEmblem({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-[#09090B] dark:text-[#FFFFFF] transition-colors duration-200"
      aria-hidden="true"
    >
      {/* Solid Monochrome Squircle Monolith */}
      <rect width="40" height="40" rx="10" fill="currentColor" />

      {/* Crisp Subtle Inner Architectural Frame */}
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="8.5"
        className="stroke-white/15 dark:stroke-black/15"
        strokeWidth="1"
      />

      {/* Negative-Space Geometric 'S' + Twin 'II' Pillar Lockup */}
      <g className="fill-[#FFFFFF] dark:fill-[#09090B]">
        {/* Upper Cantilevered Crown (Top of S) */}
        <path d="M11 9.5H29L26.2 14H15.5V17.5H11V9.5Z" />
        {/* Signature Twin 'II' Center Pillars (Angled Architectural Cut) */}
        <polygon points="15.5,16.2 19.3,14.8 19.3,25.2 15.5,23.8" />
        <polygon points="20.7,14.8 24.5,16.2 24.5,23.8 20.7,25.2" />
        {/* Lower Cantilevered Base (Bottom of S) */}
        <path d="M29 30.5H11L13.8 26H24.5V22.5H29V30.5Z" />
      </g>
    </svg>
  );
}

/**
 * Bespoke SIIFMART Wordmark — Pure Black & White Editorial Typography.
 * Pairs ultra-heavy 'SIIF' (with sculpted twin 'II' monolith pillars)
 * against wide-tracked architectural 'M Λ R T' with a custom apex 'A' and square terminal point.
 */
function SiifWordmark({
  fontSize,
  storeName,
}: {
  fontSize: string;
  storeName: string;
}) {
  const isDefaultBrand = storeName.trim().toUpperCase() === 'SIIFMART';

  if (!isDefaultBrand) {
    return (
      <span
        style={{ fontSize }}
        className="brand-wordmark font-black uppercase tracking-[0.04em] text-[#09090B] dark:text-[#FFFFFF] leading-none"
      >
        {storeName}
      </span>
    );
  }

  return (
    <span
      style={{ fontSize }}
      aria-label="SIIFMART"
      className="brand-wordmark leading-none inline-flex items-baseline text-[#09090B] dark:text-[#FFFFFF] select-none"
    >
      <span className="sr-only">SIIFMART</span>

      {/* PART 1: SIIF — Ultra-Bold Monumental Core with Sculpted Twin 'II' Pillars */}
      <span
        aria-hidden="true"
        className="inline-flex items-baseline font-black tracking-[-0.03em]"
      >
        <span>S</span>
        {/* Custom Twin 'II' Architectural Pillars with Diagonal Crown Cut */}
        <svg
          viewBox="0 0 13 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block self-baseline mx-[0.03em] overflow-visible"
          style={{ height: '0.73em', width: 'auto' }}
        >
          {/* Left Pillar I with diagonal ascending bevel */}
          <polygon points="0.8,2.4 5.2,0.4 5.2,18 0.8,18" fill="currentColor" />
          {/* Right Pillar I with diagonal crown & precision negative-space notch */}
          <polygon points="7.8,0.4 12.2,2.4 12.2,18 7.8,18" fill="currentColor" />
        </svg>
        <span>F</span>
      </span>

      {/* Micro-Architectural Divider Space */}
      <span aria-hidden="true" className="inline-block w-[0.14em]" />

      {/* PART 2: MART — Ultra-Modern High-Contrast Architectural Lockup */}
      <span
        aria-hidden="true"
        className="relative inline-flex items-baseline font-medium tracking-[0.16em] text-[0.86em]"
      >
        <span>M</span>
        {/* Custom Crossbar-Free Architectural Apex 'A' (Λ) */}
        <svg
          viewBox="0 0 15 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block self-baseline mr-[0.14em] overflow-visible"
          style={{ height: '0.72em', width: 'auto' }}
        >
          <path
            d="M7.5 0.6L14.4 18H11.2L7.5 8.1L3.8 18H0.6L7.5 0.6Z"
            fill="currentColor"
          />
          {/* Floating Precision Keystone Dot inside the Apex */}
          <rect x="6.35" y="13.2" width="2.3" height="2.3" fill="currentColor" />
        </svg>
        <span>R</span>
        <span className="tracking-[0.04em]">T</span>

        {/* Signature Architectural Under-Rule */}
        <span className="absolute -bottom-[0.13em] left-0 right-[0.04em] h-[1.5px] bg-[#09090B] dark:bg-[#FFFFFF] opacity-90" />
      </span>

      {/* Precision Monochrome Square Terminal Point */}
      <span
        aria-hidden="true"
        className="inline-block w-[0.15em] h-[0.15em] bg-[#09090B] dark:bg-[#FFFFFF] ml-[0.12em] self-baseline mb-[0.04em]"
      />
    </span>
  );
}

export default function Logo({
  className = '',
  size = 32,
  showText = true,
  logoUrl: propLogoUrl,
  storeName: propStoreName,
  variant = 'horizontal',
  showTagline = false,
}: LogoProps) {
  let settings: any = null;
  try {
    const data = useData();
    settings = data?.settings;
  } catch {
    // Graceful fallback if rendered outside DataProvider
  }

  const [imgError, setImgError] = useState(false);

  const effectiveLogoUrl =
    propLogoUrl !== undefined ? propLogoUrl : settings?.logoUrl || settings?.posReceiptLogo;
  const effectiveStoreName = propStoreName || settings?.storeName || 'SIIFMART';

  const scale = size / 32;
  const fontSize = `${Math.round(1.18 * scale * 16)}px`;

  const hasDisplayOverride = /\b(hidden|block|inline-block|flex|inline-flex)\b/.test(className);
  const containerClass = `${hasDisplayOverride ? '' : 'inline-flex '}items-center select-none ${className}`.trim();

  // If a custom image logo is uploaded by the user and loads successfully, display it in monochrome
  if (effectiveLogoUrl && !imgError) {
    return (
      <div className={containerClass}>
        <img
          src={effectiveLogoUrl}
          alt={effectiveStoreName}
          style={{ height: `${size}px` }}
          className="object-contain grayscale contrast-125"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Stacked variant: Centered Monochrome Emblem + Sculpted Brand Wordmark
  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center gap-2.5 select-none ${className}`.trim()}>
        <SiifMonochromeEmblem size={Math.round(size * 1.35)} />
        <SiifWordmark fontSize={fontSize} storeName={effectiveStoreName} />
        {showTagline && (
          <span className="text-[9px] text-[#09090B]/60 dark:text-white/60 tracking-[0.28em] uppercase font-semibold">
            Little Grocery • Big Care
          </span>
        )}
      </div>
    );
  }

  // Emblem-only variant or icon mode
  if (variant === 'emblem' || !showText) {
    return (
      <div className={containerClass}>
        <SiifMonochromeEmblem size={size} />
      </div>
    );
  }

  // Standard horizontal lockup: Monochrome architectural emblem + SIIFMART bespoke wordmark
  return (
    <div className={`${containerClass} gap-2.5`}>
      <SiifMonochromeEmblem size={size} />
      <SiifWordmark fontSize={fontSize} storeName={effectiveStoreName} />
      {showTagline && (
        <span className="text-[10px] text-[#09090B]/60 dark:text-white/60 tracking-[0.24em] uppercase font-semibold ml-1.5">
          Little Grocery • Big Care
        </span>
      )}
    </div>
  );
}
