import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  logoUrl?: string;
  storeName?: string;
  accentColor?: string;
}

export default function Logo({ 
  className = "", 
  size = 32, 
  showText = true,
  logoUrl: propLogoUrl,
  storeName: propStoreName,
  accentColor: propAccentColor
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
  const effectiveStoreName = propStoreName || settings?.storeName || 'SIIFMART';
  const effectiveAccentColor = propAccentColor || settings?.brandColor || '#2C5E3B';

  const scale = size / 32;
  const fontSize = `${Math.round(1.25 * scale * 16)}px`;

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

  // The system logo is the name itself: two-tone Apple neutral + signature Green
  return (
    <div className={containerClass}>
      <span 
        style={{ fontSize }}
        className="font-black tracking-tight leading-none"
      >
        {effectiveStoreName.toUpperCase() === 'SIIFMART' ? (
          <>
            <span className="text-[#1D1D1F] dark:text-[#FFFFFF]">SIIF</span>
            <span 
              style={{ color: effectiveAccentColor !== '#2C5E3B' ? effectiveAccentColor : undefined }} 
              className="text-[#2C5E3B] dark:text-[#00FF9D]"
            >
              MART
            </span>
          </>
        ) : (
          <span className="text-[#1D1D1F] dark:text-[#FFFFFF]">{effectiveStoreName}</span>
        )}
      </span>
    </div>
  );
}
