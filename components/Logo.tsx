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
 * SIIFMART Circular Farmer Seal Emblem — Pure Black & White.
 * Renders the woodcut-engraved farmer cultivating the soil inside a double
 * concentric geometric circular medallion that stays crisp across light and dark mode.
 */
function SiifGroceryEmblem({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
      aria-hidden="true"
    >
      {/* Outer Geometric Medallion Ring (Dark Ink in Light Mode, Pure White in Dark Mode) */}
      <circle
        cx="50"
        cy="50"
        r="47.2"
        className="stroke-[#09090B] dark:stroke-[#FFFFFF]"
        strokeWidth="3.2"
      />
      {/* Inner Crisp White Medallion Disc & Delicate Inner Framing Ring */}
      <circle
        cx="50"
        cy="50"
        r="43.2"
        fill="#FFFFFF"
        stroke="#09090B"
        strokeWidth="1.1"
      />
      {/* Circular Clip Path for the Engraved Farmer Illustration */}
      <clipPath id="siif-farmer-emblem-clip">
        <circle cx="50" cy="50" r="42.4" />
      </clipPath>
      {/* Woodcut Farmer Cultivating the Soil */}
      <image
        href="/brand/siifmart-farmer-cutout.png"
        x="4"
        y="4"
        width="92"
        height="92"
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#siif-farmer-emblem-clip)"
      />
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
