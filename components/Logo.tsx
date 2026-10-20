import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  logoUrl?: string;
  storeName?: string;
  accentColor?: string;
  variant?: 'horizontal' | 'stacked' | 'emblem' | 'wordmark';
  showTagline?: boolean;
}

/**
 * Pure Black & White Vector S-Cart & Twin Organic Leaves Emblem.
 * Faithfully renders SIIFMART's iconic ribbon-'S' grocery cart, twin wheels,
 * and asymmetric organic leaves in a crisp monochrome vector for light and dark mode.
 */
function SiifGroceryEmblem({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-[#09090B] dark:text-[#FFFFFF] transition-colors duration-200"
      aria-hidden="true"
    >
      {/* Left Organic Leaf (Tilting Up-Left) with Subtle Midrib Cutout */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.5 34.2C48.8 28.0 41.8 18.8 40.0 7.8C51.8 13.0 58.8 22.2 59.5 34.2ZM57.8 31.4C54.0 24.8 49.6 19.0 45.2 14.0C49.0 19.6 53.2 25.4 56.8 31.8L57.8 31.4Z"
        fill="currentColor"
      />

      {/* Right Signature Leaf (Sweeping Up-Right) with Sculpted Vein Cutout */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M62.8 35.0C61.0 18.6 72.8 5.8 95.8 0.8C89.8 19.2 78.8 30.2 62.8 35.0ZM64.8 33.4C68.6 23.6 75.4 14.8 85.0 7.6C74.0 16.2 67.4 24.8 63.6 33.6L64.8 33.4Z"
        fill="currentColor"
      />

      {/* Calligraphic Ribbon 'S' Forming the Upper & Inner Grocery Cart Body */}
      <path
        d="M57.0 34.0C44.2 23.0 24.2 19.8 11.4 25.8C3.2 29.8 3.0 40.8 14.2 46.2C26.4 52.0 48.0 58.0 56.2 64.0C63.0 69.0 61.2 76.8 52.0 80.0C65.8 79.0 72.8 70.2 71.0 60.0C69.2 50.0 50.2 44.0 31.0 37.8C19.0 33.8 16.2 27.8 26.2 25.0C36.0 22.2 48.0 26.8 57.0 34.0Z"
        fill="currentColor"
      />

      {/* Grocery Cart Basket Frame, Angled Front Wall & Tapered Handlebar */}
      <path
        d="M11.0 53.8C6.2 69.2 12.2 83.2 29.0 83.2H65.0C72.0 83.2 76.2 80.2 79.2 74.0L98.2 38.0L52.0 39.0V40.4L82.0 42.0C86.0 42.3 87.0 44.5 85.4 48.2L71.0 76.0C68.6 79.6 64.0 80.4 58.0 80.4H33.0C19.2 80.4 12.2 70.0 11.0 53.8Z"
        fill="currentColor"
      />

      {/* Twin Grocery Cart Wheels */}
      <circle cx="30.0" cy="92.0" r="6.2" fill="currentColor" />
      <circle cx="63.0" cy="92.0" r="6.2" fill="currentColor" />
    </svg>
  );
}

/**
 * Bespoke SIIFMART Grocery Brand Wordmark — Pure Black & White.
 * - 'SIIF' is set in bold, commanding modern letterforms where the twin 'II' stems
 *   blossom with SIIFMART's signature pair of fresh organic grocery leaves.
 * - 'MART' is set in airy, elegant modern contrast and cradled by a sleek
 *   tapered market-basket smile arc.
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

      {/* PART 1: SIIF — Bold Modern Core with Twin Organic Leaf-Crowned 'II' Stems */}
      <span
        aria-hidden="true"
        className="inline-flex items-baseline font-black tracking-[-0.03em]"
      >
        <span>S</span>

        {/* Custom Twin 'II' Pillars Crowned with Fresh Organic Grocery Leaves */}
        <svg
          viewBox="0 0 18 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block self-baseline mx-[0.025em] overflow-visible"
          style={{ height: '0.95em', width: 'auto' }}
        >
          {/* Left Sprouting Leaf above First 'I' */}
          <path
            d="M6.8 6.4C3.8 6.0 1.6 3.8 1.0 0.8C4.2 1.2 6.4 3.2 6.8 6.4Z"
            fill="currentColor"
          />
          {/* Right Signature Leaf with Vein Cutout above Second 'I' */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.6 6.4C9.4 2.4 12.6 -0.2 17.6 0.2C16.6 4.2 13.6 6.2 9.6 6.4ZM10.6 5.2C12.2 3.4 14.0 2.0 15.8 1.0C13.6 2.0 11.8 3.4 10.2 5.0L10.6 5.2Z"
            fill="currentColor"
          />
          {/* First 'I' Stem with Soft Organic Top Bevel */}
          <path
            d="M2.0 8.2C2.0 7.4 2.6 6.8 3.4 6.8H6.6V25H2.0V8.2Z"
            fill="currentColor"
          />
          {/* Second 'I' Stem with Soft Organic Top Bevel */}
          <path
            d="M9.8 6.8H13.0C13.8 6.8 14.4 7.4 14.4 8.2V25H9.8V6.8Z"
            fill="currentColor"
          />
        </svg>

        <span>F</span>
      </span>

      {/* Refined Editorial Breath Space */}
      <span aria-hidden="true" className="inline-block w-[0.11em]" />

      {/* PART 2: MART — Elegant Modern Market Typography with Basket Smile Arc */}
      <span
        aria-hidden="true"
        className="relative inline-flex items-baseline font-bold tracking-[0.14em] text-[0.88em]"
      >
        <span>M</span>
        <span>A</span>
        <span>R</span>
        <span className="tracking-[0.02em]">T</span>

        {/* Tapered Organic Market-Basket Cradle Arc beneath MART */}
        <svg
          viewBox="0 0 80 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -bottom-[0.22em] left-0 w-full h-[0.22em] overflow-visible"
        >
          <path
            d="M2 1.8C22 6.8 58 6.8 78 1.8C58 4.8 22 4.8 2 1.8Z"
            fill="currentColor"
          />
        </svg>
      </span>
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

  // Wordmark-only variant: brand name without the emblem (e.g. top bar)
  if (variant === 'wordmark') {
    return (
      <div className={containerClass}>
        <SiifWordmark fontSize={fontSize} storeName={effectiveStoreName} />
      </div>
    );
  }

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

  // Stacked variant: Centered Monochrome S-Cart Emblem + Botanical SIIFMART Wordmark
  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center gap-2 select-none ${className}`.trim()}>
        <SiifGroceryEmblem size={Math.round(size * 1.5)} />
        <SiifWordmark fontSize={fontSize} storeName={effectiveStoreName} />
        {showTagline && (
          <span className="text-[9px] text-[#09090B]/65 dark:text-white/65 tracking-[0.28em] uppercase font-semibold mt-1">
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
        <SiifGroceryEmblem size={size} />
      </div>
    );
  }

  // Standard horizontal lockup: Monochrome S-Cart & Leaves Emblem + Magical SIIFMART Brand Wordmark
  return (
    <div className={`${containerClass} gap-2.5`}>
      <SiifGroceryEmblem size={size} />
      <SiifWordmark fontSize={fontSize} storeName={effectiveStoreName} />
      {showTagline && (
        <span className="text-[10px] text-[#09090B]/65 dark:text-white/65 tracking-[0.24em] uppercase font-semibold ml-1.5">
          Little Grocery • Big Care
        </span>
      )}
    </div>
  );
}
