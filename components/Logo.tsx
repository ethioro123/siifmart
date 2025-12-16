import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = "", size = 32, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center justify-center select-none text-black dark:text-white transition-colors duration-300 ${className}`} style={{ height: size }}>
      <svg
        height="100%"
        viewBox={showText ? "0 0 200 55" : "0 0 35 55"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <g id="sign-icon">
            {/* Right Turn Arrow 
                 Bounds: approx x=5 to x=29, y=12 to y=38
             */}
            <path
              d="M 5 38 L 5 26 Q 5 17 16 17 L 19 17 L 19 12 L 29 21.5 L 19 31 L 19 26 L 16 26 Q 11 26 11 38 Z"
              fill="currentColor"
              stroke="#00cc7d"
              strokeWidth="4"
              strokeLinejoin="round"
              style={{ paintOrder: 'stroke' }}
              className="transition-colors duration-300"
            />
          </g>
        </defs>

        {showText ? (
          <g transform="translate(0, 0)">
            <use href="#sign-icon" />

            {/* Main Text - Adapts to theme: black in light mode, white in dark mode */}
            {/* Main Text - Rounded Font with Grey Border & Tight Spacing */}
            <text
              x="34"
              y="42"
              textAnchor="start"
              fontFamily="'Fredoka', 'Arial Rounded MT Bold', 'Nunito', 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="700"
              fontSize="46"
              fill="currentColor"
              stroke="#00cc7d"
              strokeWidth="4"
              strokeLinejoin="round"
              style={{ paintOrder: 'stroke' }}
              letterSpacing="0.5"
              className="transition-colors duration-300"
            >
              SiifMart
            </text>
          </g>
        ) : (
          <g>
            {/* Used in avatars/settings - arrow only */}
            <use href="#sign-icon" />
          </g>
        )}
      </svg>
    </div>
  );
}
