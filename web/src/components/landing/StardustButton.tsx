"use client";

import React from "react";
import { Play } from "lucide-react";

export interface StardustButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  showPlayIcon?: boolean;
}

export const StardustButton: React.FC<StardustButtonProps> = ({ 
  children = "See How It Works", 
  onClick, 
  className = "",
  showPlayIcon = true,
  ...props 
}) => {
  const buttonStyle: React.CSSProperties = {
    outline: 'none',
    cursor: 'pointer',
    border: '1px solid rgba(226, 232, 240, 0.85)',
    position: 'relative',
    borderRadius: '100px',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    transition: 'all 0.2s ease',
    height: '50px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `
      inset 0 0.25rem 0.5rem rgba(255, 255, 255, 0.95),
      inset 0 -0.1rem 0.25rem rgba(124, 58, 237, 0.15),
      inset 0 -0.3rem 0.6rem rgba(255, 255, 255, 0.8),
      0 1.2rem 2rem rgba(124, 58, 237, 0.08),
      0 0.5rem 0.8rem -0.3rem rgba(0, 0, 0, 0.06)
    `,
  };

  const wrapStyle: React.CSSProperties = {
    fontSize: '14.5px',
    fontWeight: 600,
    color: '#0f172a', // Dark, crisp, high-contrast font color
    padding: '0 24px',
    borderRadius: 'inherit',
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const pStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    margin: 0,
    transition: 'all 0.2s ease',
    transform: 'translateY(1%)',
    position: 'relative',
    zIndex: 2,
  };

  const beforeAfterStyles = `
    .pearl-button .wrap::before,
    .pearl-button .wrap::after {
      content: "";
      position: absolute;
      transition: all 0.3s ease;
      pointer-events: none;
    }
    
    /* Translucent light purple ambient dome */
    .pearl-button .wrap::before {
      left: -15%;
      right: -15%;
      bottom: 25%;
      top: -100%;
      border-radius: 50%;
      background-color: rgba(168, 85, 247, 0.12);
    }
    
    /* White specular crescent shine */
    .pearl-button .wrap::after {
      left: 6%;
      right: 6%;
      top: 10%;
      bottom: 40%;
      border-radius: 20px 20px 0 0;
      box-shadow: inset 0 8px 8px -8px rgba(255, 255, 255, 1);
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.85) 0%,
        rgba(243, 232, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%
      );
    }
    
    .pearl-button:hover {
      background-color: rgba(255, 255, 255, 0.94);
      border-color: rgba(147, 51, 234, 0.35);
      box-shadow:
        inset 0 0.25rem 0.5rem rgba(255, 255, 255, 1),
        inset 0 -0.1rem 0.25rem rgba(124, 58, 237, 0.2),
        inset 0 -0.3rem 0.6rem rgba(168, 85, 247, 0.2),
        0 1.5rem 2.2rem rgba(124, 58, 237, 0.14),
        0 0.6rem 1rem -0.3rem rgba(0, 0, 0, 0.08);
    }
    
    .pearl-button:hover .wrap::before {
      transform: translateY(-5%);
      background-color: rgba(168, 85, 247, 0.18);
    }
    
    .pearl-button:hover .wrap::after {
      opacity: 0.7;
      transform: translateY(4%);
    }
    
    .pearl-button:hover .wrap p {
      transform: translateY(-2%);
      color: #000000;
    }

    .pearl-button:hover .pearl-play-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 0 6px rgba(124, 58, 237, 0.5));
    }
    
    .pearl-button:active {
      transform: translateY(2px) scale(0.985);
      box-shadow:
        inset 0 0.2rem 0.4rem rgba(255, 255, 255, 0.95),
        inset 0 -0.1rem 0.25rem rgba(124, 58, 237, 0.25),
        inset 0 -0.25rem 0.5rem rgba(168, 85, 247, 0.15),
        0 0.8rem 1.2rem rgba(124, 58, 237, 0.1),
        0 0.4rem 0.6rem -0.2rem rgba(0, 0, 0, 0.08);
    }
  `;

  return (
    <>
      <style>{beforeAfterStyles}</style>
      <button
        className={`pearl-button ${className}`}
        style={buttonStyle}
        onClick={onClick}
        type="button"
        {...props}
      >
        <div className="wrap" style={wrapStyle}>
          <p style={pStyle}>
            {showPlayIcon && (
              <span className="pearl-play-icon inline-flex items-center text-purple-600 transition-transform duration-200">
                <Play className="w-3.5 h-3.5 fill-current" />
              </span>
            )}
            <span>{children}</span>
          </p>
        </div>
      </button>
    </>
  );
};

export default StardustButton;
