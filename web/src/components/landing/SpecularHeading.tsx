"use client";

import React, { useEffect } from "react";

export function SpecularHeading() {
  useEffect(() => {
    const styleId = "hero-specular-sheen-styles";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes specularSweepDark {
          0% {
            background-position: -150% 0;
          }
          40% {
            background-position: 150% 0;
          }
          100% {
            background-position: 150% 0;
          }
        }

        @keyframes specularSweepPurple {
          0%, 16% {
            background-position: -200% 0;
          }
          54% {
            background-position: 150% 0;
          }
          100% {
            background-position: 150% 0;
          }
        }

        .specular-sheen-dark {
          background: linear-gradient(
            105deg,
            #0F172A 0%,
            #0F172A 28%,
            #475569 40%,
            #FFFFFF 48%,
            #94A3B8 54%,
            #0F172A 66%,
            #0F172A 100%
          );
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline;
          animation: specularSweepDark 4.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .specular-sheen-purple {
          background: linear-gradient(
            105deg,
            #7C3AED 0%,
            #9333EA 22%,
            #C084FC 36%,
            #FFFFFF 48%,
            #F472B6 56%,
            #7C3AED 68%,
            #9333EA 100%
          );
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          animation: specularSweepPurple 4.2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          filter: drop-shadow(0 2px 10px rgba(147, 51, 234, 0.22));
        }

        .specular-sheen-container:hover .specular-sheen-dark {
          animation-duration: 2.8s;
        }

        .specular-sheen-container:hover .specular-sheen-purple {
          animation-duration: 2.8s;
          filter: drop-shadow(0 4px 18px rgba(168, 85, 247, 0.45));
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <span className="specular-sheen-container inline cursor-default select-none">
      <span className="specular-sheen-dark">Run Your Entire Event Business </span>
      <span className="specular-sheen-purple">From One Place.</span>
    </span>
  );
}
