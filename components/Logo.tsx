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

export default function Logo({ 
  className = "", 
  size = 32, 
  showText = true,
  logoUrl: propLogoUrl,
  storeName: propStoreName,
  accentColor: propAccentColor,
  variant = 'horizontal',
  showTagline = false
}: LogoProps) {
  let settings: any = null;
  try {
    const data = useData();
    settings = data?.settings;
  } catch {
    // Graceful fallback if rendered outside DataProvider
  }

  const [imgError, setImgError] = useState(false);

  const effectiveLogoUrl = propLogoUrl !== undefined ? propLogoUrl : (settings?.logoUrl || settings?.posReceiptLogo);
  const effectiveStoreName = propStoreName || settings?.storeName || 'SiifMart';
  const effectiveAccentColor = propAccentColor || settings?.brandColor || '#2C5E3B';

  const scale = size / 32;
  const fontSize = `${Math.round(1.2 * scale * 16)}px`;

  const hasDisplayOverride = /\b(hidden|block|inline-block|flex|inline-flex)\b/.test(className);
  const containerClass = `${hasDisplayOverride ? '' : 'inline-flex '}items-center select-none ${className}`.trim();

  // If a custom image logo is uploaded by the user and loads successfully, display it
  if (effectiveLogoUrl && !imgError) {
    return (
      <div className={containerClass}>
        <img 
          src={effectiveLogoUrl} 
          alt={effectiveStoreName} 
          style={{ height: `${size}px` }}
          className="object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Stacked variant: Full official brand mark
  if (variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`.trim()}>
        <img 
          src="/brand/siifmart-logo-light.png" 
          alt={effectiveStoreName} 
          style={{ height: `${Math.round(size * 1.8)}px` }}
          className="dark:hidden object-contain max-w-full"
        />
        <img 
          src="/brand/siifmart-logo-dark.png" 
          alt={effectiveStoreName} 
          style={{ height: `${Math.round(size * 1.8)}px` }}
          className="hidden dark:block object-contain max-w-full"
        />
      </div>
    );
  }

  // Emblem-only variant or icon mode
  if (variant === 'emblem' || !showText) {
    return (
      <div className={containerClass}>
        <img 
          src="/brand/siifmart-emblem-light.png" 
          alt={effectiveStoreName} 
          style={{ height: `${size}px`, width: 'auto' }}
          className="dark:hidden object-contain shrink-0"
        />
        <img 
          src="/brand/siifmart-emblem-dark.png" 
          alt={effectiveStoreName} 
          style={{ height: `${size}px`, width: 'auto' }}
          className="hidden dark:block object-contain shrink-0"
        />
      </div>
    );
  }

  // Standard horizontal lockup: Official brand emblem + SiifMart wordmark
  return (
    <div className={`${containerClass} gap-2`}>
      <img 
        src="/brand/siifmart-emblem-light.png" 
        alt="SiifMart" 
        style={{ height: `${size}px`, width: 'auto' }}
        className="dark:hidden object-contain shrink-0"
      />
      <img 
        src="/brand/siifmart-emblem-dark.png" 
        alt="SiifMart" 
        style={{ height: `${size}px`, width: 'auto' }}
        className="hidden dark:block object-contain shrink-0"
      />
      <span 
        style={{ fontSize }}
        className="brand-wordmark font-semibold tracking-[-0.055em] leading-none inline-flex items-baseline"
      >
        {effectiveStoreName.toUpperCase() === 'SIIFMART' ? (
          <>
            <span className="text-[#1D1D1F] dark:text-[#FFFFFF]">Siif</span>
            <span 
              style={{ color: effectiveAccentColor !== '#2C5E3B' ? effectiveAccentColor : undefined }} 
              className="text-[#2C5E3B] dark:text-[#30D158] ml-[0.5px]"
            >
              Mart
            </span>
          </>
        ) : (
          <span className="text-[#1D1D1F] dark:text-[#FFFFFF]">{effectiveStoreName}</span>
        )}
      </span>
      {showTagline && (
        <span className="text-[10px] text-[var(--theme-text-muted)] tracking-widest uppercase font-semibold">
          Little Grocery • Big Care
        </span>
      )}
    </div>
  );
}
