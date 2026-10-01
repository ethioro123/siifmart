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
  const fontSize = `${Math.round(1.125 * scale * 16)}px`;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Emblem Container */}
      <div 
        ref={(el) => {
          if (el) {
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
          }
        }}
        className="rounded-xl bg-gradient-to-tr from-[#1E3F27] via-[#2C5E3B] to-[#1E3F27] border border-[#00FF9D]/30 flex items-center justify-center shadow-[0_4px_14px_rgba(44,94,59,0.25)] transition-transform duration-300 hover:scale-105 shrink-0 overflow-hidden relative"
      >
        {effectiveLogoUrl && !imgError ? (
          <img 
            src={effectiveLogoUrl} 
            alt={effectiveStoreName} 
            className="w-full h-full object-contain p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Vector 4-Quadrant Emblem */
          <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-[72%] h-[72%]"
          >
            {/* Top-Left Cube (Emerald) */}
            <rect x="12" y="12" width="34" height="34" rx="8" fill={effectiveAccentColor || "#00FF9D"} />
            {/* Top-Right Cube (Warm Amber/Gold) */}
            <rect x="54" y="12" width="34" height="34" rx="8" fill="#F59E0B" />
            {/* Bottom-Left Cube (Forest Emerald) */}
            <rect x="12" y="54" width="34" height="34" rx="8" fill="#10B981" />
            {/* Bottom-Right Cube (Emerald) */}
            <rect x="54" y="54" width="34" height="34" rx="8" fill={effectiveAccentColor || "#00FF9D"} />
            {/* Center Nexus */}
            <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
            <circle cx="50" cy="50" r="6" fill="#1E3F27" />
            <circle cx="50" cy="50" r="3" fill={effectiveAccentColor || "#00FF9D"} />
          </svg>
        )}
      </div>

      {/* Text Branding */}
      {showText && (
        <span 
          ref={(el) => {
            if (el) el.style.fontSize = fontSize;
          }}
          className="font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight leading-none"
        >
          {effectiveStoreName.toUpperCase() === 'SIIFMART' ? (
            <>SIIF<span style={{ color: effectiveAccentColor !== '#2C5E3B' ? effectiveAccentColor : undefined }} className="text-[#2C5E3B] dark:text-[#00FF9D]">MART</span></>
          ) : (
            effectiveStoreName
          )}
        </span>
      )}
    </div>
  );
}
