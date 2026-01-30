import React from 'react';

export default function LogoSymbol({ className = "h-8 w-8" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="ZeroTime Symbol"
        >
            {/* Centered Group with Skew */}
            {/* 
                  Origin center (50 50) skewX(-6).
                  Manually adjusted to ensure centering as per app/icon.tsx logic
              */}
            <g transform="translate(50, 50) skewX(-6) translate(-50, -50)">
                <path
                    d="M20 20 H80 V32 L40 68 H80 V80 H20 V68 L60 32 H20 V20 Z"
                    fill="currentColor"
                />
                {/* Accent Dot - Blue Square. y=70 to match bottom 80 */}
                <rect
                    x="84"
                    y="70"
                    width="10"
                    height="10"
                    fill="#3B82F6"
                />
            </g>
        </svg>
    );
}
