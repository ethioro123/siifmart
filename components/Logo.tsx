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

const SPEED_CART_PATH =
  'M 30.5 15.5 H 74.5 Q 88.5 15.5 93.8 28.5 L 113.5 76.8 Q 117.0 85.5 126.5 85.5 H 370.5 A 19 19 0 0 1 370.5 123.5 H 148.5 A 8 8 0 0 0 148.5 139.5 H 341.5 A 19 19 0 0 1 341.5 177.5 H 168.0 A 6.5 6.5 0 0 0 168.0 190.5 H 313.5 A 18.5 18.5 0 0 1 313.5 227.5 H 142.5 Q 129.5 227.5 124.5 215.0 L 62.5 61.5 Q 59.5 55.5 52.5 55.5 H 30.5 A 20 20 0 0 1 30.5 15.5 Z';

/**
 * SIIFMART Futuristic Speed-Bar Shopping Cart Emblem — Transparent Background,
 * Dark (#09090B) in Light Mode and Pure White (#FFFFFF) in Dark Mode.
 */
function SiifGroceryEmblem({ size }: { size: number }) {
  const width = Math.round(size * 1.25);
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-[#09090B] dark:text-[#FFFFFF] transition-colors duration-200"
      aria-hidden="true"
    >
      <path d={SPEED_CART_PATH} fill="currentColor" />
      <circle cx="166.0" cy="278.5" r="26.5" fill="currentColor" />
      <circle cx="297.5" cy="278.5" r="26.5" fill="currentColor" />
    </svg>
  );
}

/**
 * SIIFMART Brand Wordmark & SINCE 2026 Subtitle — Pure Dark (#09090B) & White (#FFFFFF)
 * with no background fill.
 */
function SiifWordmark({
  fontSize,
  storeName,
  showSince = true,
  centered = false,
}: {
  fontSize: string;
  storeName: string;
  showSince?: boolean;
  centered?: boolean;
}) {
  return (
    <span
      aria-label={storeName}
      className={`inline-flex flex-col ${centered ? 'items-center text-center' : 'items-start'} text-[#09090B] dark:text-[#FFFFFF] leading-none select-none`}
    >
      <span
        style={{
          fontSize,
          fontFamily:
            "'Nunito', 'Fredoka', 'Arial Rounded MT Bold', ui-rounded, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
        className="brand-wordmark font-black uppercase tracking-[0.14em] leading-none"
      >
        {storeName}
      </span>
      {showSince && (
        <span
          style={{
            fontSize: `calc(${fontSize} * 0.36)`,
            fontFamily: "'Quicksand', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
            marginTop: `calc(${fontSize} * 0.22)`,
          }}
          className="font-medium uppercase tracking-[0.36em] leading-none opacity-90"
        >
          SINCE 2026
        </span>
      )}
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
  showTagline = true,
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
  const fontSize = `${Math.round(1.12 * scale * 16)}px`;

  const hasDisplayOverride = /\b(hidden|block|inline-block|flex|inline-flex)\b/.test(className);
  const containerClass = `${hasDisplayOverride ? '' : 'inline-flex '}items-center select-none ${className}`.trim();

  // Wordmark-only variant: brand name without the emblem (e.g. compact top bar)
  if (variant === 'wordmark') {
    return (
      <div className={containerClass}>
        <SiifWordmark
          fontSize={fontSize}
          storeName={effectiveStoreName}
          showSince={false}
          centered={false}
        />
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

  // Stacked variant: Exact match to the uploaded SIIFMART / SINCE 2026 centered layout
  if (variant === 'stacked') {
    const stackedTitleSize = `${Math.round(1.22 * scale * 16)}px`;
    return (
      <div className={`inline-flex flex-col items-center gap-2.5 select-none ${className}`.trim()}>
        <SiifGroceryEmblem size={Math.round(size * 1.65)} />
        <SiifWordmark
          fontSize={stackedTitleSize}
          storeName={effectiveStoreName}
          showSince={showTagline}
          centered={true}
        />
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

  // Standard lockup (Sidebar, ID cards): Speed-Bar Cart + SIIFMART / SINCE 2026
  return (
    <div className={`${containerClass} gap-2.5`}>
      <SiifGroceryEmblem size={size} />
      <SiifWordmark
        fontSize={fontSize}
        storeName={effectiveStoreName}
        showSince={showTagline}
        centered={false}
      />
    </div>
  );
}
