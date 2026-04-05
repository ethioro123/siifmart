import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = "", size = 32, showText = true }: LogoProps) {
  // Scaling factors based on standard 32px size
  const scale = size / 32;
  const iconSize = Math.round(18 * scale);
  const fontSize = `${Math.round(1.125 * scale * 16)}px`; // 1.125rem * 16px = 18px

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Icon Container */}
      <div 
        ref={(el) => {
          if (el) {
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
          }
        }}
        className="rounded-lg bg-cyber-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-transform duration-300 hover:scale-110"
      >
        <LayoutDashboard size={iconSize} className="text-black" />
      </div>

      {/* Text Branding */}
      {showText && (
        <span 
          ref={(el) => {
            if (el) el.style.fontSize = fontSize;
          }}
          className="font-black text-white tracking-tighter"
        >
          SIIF<span className="text-cyber-primary">MART</span>
        </span>
      )}
    </div>
  );
}
