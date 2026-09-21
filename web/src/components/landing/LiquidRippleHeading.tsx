"use client";

import React, { useState, useRef } from "react";

export function LiquidRippleHeading() {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="inline cursor-pointer select-none transition-all duration-300"
    >
      {/* Hidden SVG Filter Definition for Physical Liquid Ripple */}
      <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter
            id="liquidMercuryRipple"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.016 0.022"
              numOctaves="2"
              result="waterNoise"
            >
              <animate
                attributeName="baseFrequency"
                dur="4.5s"
                values="0.014 0.020; 0.024 0.032; 0.018 0.024; 0.014 0.020"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="waterNoise"
              scale="6.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Heading Text Content */}
      <span
        style={{
          filter: isHovered ? "url(#liquidMercuryRipple)" : "none",
          transition: "filter 0.25s ease",
          display: "inline",
        }}
      >
        <span className="text-slate-900 transition-colors duration-200">
          Run Your Entire Event Business{" "}
        </span>
        <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent inline-block transition-transform duration-200">
          From One Place.
        </span>
      </span>
    </span>
  );
}
