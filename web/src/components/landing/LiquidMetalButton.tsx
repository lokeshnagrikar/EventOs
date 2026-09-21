"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Calendar, ArrowRight, Sparkles, Play } from "lucide-react";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  width?: number;
  height?: number;
  showIcon?: boolean;
  iconType?: "calendar" | "play" | "sparkles";
  showArrow?: boolean;
  colorTheme?: "purple" | "obsidian" | "transparent";
  className?: string;
}

export function LiquidMetalButton({
  label = "Book a Demo",
  onClick,
  viewMode = "text",
  width: customWidth,
  height: customHeight = 40,
  showIcon = true,
  iconType,
  showArrow,
  colorTheme = "purple",
  className = "",
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: External library without types
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const isCompact = (customHeight || 40) <= 42;
  const isTransparent = colorTheme === "transparent";
  const isPurple = colorTheme === "purple";

  const resolvedIconType = iconType || (isTransparent ? "play" : "calendar");
  const shouldShowArrow = showArrow !== undefined ? showArrow : !isTransparent;

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      const size = customHeight || 40;
      return {
        width: size,
        height: size,
        innerWidth: size - 3,
        innerHeight: size - 3,
        shaderWidth: size,
        shaderHeight: size,
      };
    } else {
      const calcWidth = customWidth || (label.length > 14 ? (isTransparent ? 182 : 190) : 146);
      const calcHeight = customHeight || 40;
      return {
        width: calcWidth,
        height: calcHeight,
        innerWidth: calcWidth - (isCompact ? 3 : 4),
        innerHeight: calcHeight - (isCompact ? 3 : 4),
        shaderWidth: calcWidth,
        shaderHeight: calcHeight,
      };
    }
  }, [viewMode, customWidth, customHeight, label, isCompact, isTransparent]);

  useEffect(() => {
    const styleId = "shader-canvas-style-liquid-metal";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes liquid-ripple-anim {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current && typeof window !== "undefined") {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy();
          }

          // Dynamic shift parameters per color theme
          const shiftRed = isPurple ? 0.42 : isTransparent ? 0.22 : 0.35;
          const shiftBlue = isPurple ? 0.68 : isTransparent ? 0.42 : 0.45;

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: isTransparent ? 3 : 4,
              u_softness: isTransparent ? 0.7 : 0.5,
              u_shiftRed: shiftRed,
              u_shiftBlue: shiftBlue,
              u_distortion: isTransparent ? 0.03 : 0.05,
              u_contour: 0,
              u_angle: 45,
              u_scale: isTransparent ? 6 : 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            isTransparent ? 0.45 : 0.6
          );
        }
      } catch (error) {
        console.warn("[LiquidMetalButton] Shader initialization skipped:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMount.current?.destroy) {
        try {
          shaderMount.current.destroy();
        } catch {}
        shaderMount.current = null;
      }
    };
  }, [colorTheme, isPurple, isTransparent]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(1.1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(isTransparent ? 0.45 : 0.6);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(1.1);
        } else {
          shaderMount.current?.setSpeed?.(isTransparent ? 0.45 : 0.6);
        }
      }, 350);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: "preserve-3d",
            transition:
              "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
            transform: isHovered ? "translateY(-1px) scale(1.02)" : "none",
          }}
        >
          {/* Top Content Layer (Text & Icons) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isCompact ? "6px" : "8px",
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, gap 0.4s ease",
              transform: "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
              paddingLeft: isCompact ? "10px" : "14px",
              paddingRight: isCompact ? "10px" : "14px",
            }}
          >
            {viewMode === "icon" ? (
              <Sparkles
                size={isCompact ? 15 : 18}
                style={{
                  color: isTransparent ? "#7C3AED" : "#FFFFFF",
                  filter: isTransparent ? "none" : "drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.7))",
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isHovered ? "scale(1.1) rotate(6deg)" : "scale(1)",
                }}
              />
            ) : (
              <>
                {showIcon && resolvedIconType === "play" && (
                  <Play
                    size={isCompact ? 13 : 15}
                    style={{
                      color: "#7C3AED",
                      fill: "#7C3AED",
                      filter: "drop-shadow(0px 1px 2px rgba(124, 58, 237, 0.25))",
                      transition: "transform 0.3s ease",
                      transform: isHovered ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                )}
                {showIcon && resolvedIconType === "calendar" && (
                  <Calendar
                    size={isCompact ? 14 : 16}
                    style={{
                      color: isTransparent ? "#7C3AED" : isPurple ? "#E9D5FF" : "#E2E8F0",
                      filter: isTransparent ? "none" : "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.7))",
                      transition: "transform 0.3s ease",
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                )}
                {showIcon && resolvedIconType === "sparkles" && (
                  <Sparkles
                    size={isCompact ? 14 : 16}
                    style={{
                      color: isTransparent ? "#7C3AED" : "#E9D5FF",
                      transition: "transform 0.3s ease",
                      transform: isHovered ? "scale(1.1) rotate(6deg)" : "scale(1)",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: isCompact ? "12.5px" : "13.5px",
                    color: isTransparent ? "#1E293B" : "#FFFFFF",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    textShadow: isTransparent
                      ? "0px 1px 1px rgba(255, 255, 255, 0.8)"
                      : isPurple
                      ? "0px 1px 3px rgba(0, 0, 0, 0.8), 0px 0px 8px rgba(192, 132, 252, 0.4)"
                      : "0px 1px 3px rgba(0, 0, 0, 0.8), 0px 0px 8px rgba(168, 85, 247, 0.3)",
                    transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: "scale(1)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
                {shouldShowArrow && (
                  <ArrowRight
                    size={isCompact ? 13 : 15}
                    style={{
                      color: isTransparent ? "#7C3AED" : "#D8B4FE",
                      filter: isTransparent ? "none" : "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.7))",
                      transition: "transform 0.3s ease",
                      transform: isHovered ? "translateX(2px)" : "translateX(0)",
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Middle Cap / Inner Bevel (Transparent Glass / Purple / Obsidian Core) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(10px) ${
                isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"
              }`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: isCompact ? "1.5px" : "2px",
                borderRadius: "100px",
                background: isTransparent
                  ? "linear-gradient(180deg, rgba(255, 255, 255, 0.86) 0%, rgba(248, 250, 252, 0.72) 100%)"
                  : isPurple
                  ? "linear-gradient(180deg, rgba(139, 92, 246, 0.92) 0%, rgba(124, 58, 237, 0.94) 45%, rgba(91, 33, 182, 0.97) 85%, rgba(59, 7, 100, 0.99) 100%)"
                  : "linear-gradient(180deg, #1A1A22 0%, #0D0D12 60%, #050508 100%)",
                border: isTransparent
                  ? "1px solid rgba(203, 213, 225, 0.75)"
                  : isPurple
                  ? "1px solid rgba(233, 213, 255, 0.35)"
                  : "1px solid rgba(255, 255, 255, 0.09)",
                boxShadow: isPressed
                  ? isTransparent
                    ? "inset 0px 2px 4px rgba(0, 0, 0, 0.08)"
                    : "inset 0px 2px 4px rgba(0, 0, 0, 0.6), inset 0px 1px 2px rgba(0, 0, 0, 0.5)"
                  : isTransparent
                  ? "inset 0px 1px 1px rgba(255, 255, 255, 0.95), 0px 2px 6px rgba(0, 0, 0, 0.03)"
                  : isPurple
                  ? "inset 0px 1px 1px rgba(255, 255, 255, 0.45), inset 0px -2px 4px rgba(0, 0, 0, 0.35), 0 0 14px rgba(168, 85, 247, 0.35)"
                  : "inset 0px 1px 1px rgba(255, 255, 255, 0.15), inset 0px -1px 2px rgba(0, 0, 0, 0.7)",
                backdropFilter: isTransparent ? "blur(12px)" : "none",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>

          {/* Liquid Metal Shader Canvas Base */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(0px) ${
                isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"
              }`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: "100px",
                boxShadow: isPressed
                  ? isTransparent
                    ? "0px 1px 2px rgba(0, 0, 0, 0.05)"
                    : "0px 0px 0px 1px rgba(0, 0, 0, 0.6), 0px 2px 4px 0px rgba(0, 0, 0, 0.4)"
                  : isHovered
                  ? isTransparent
                    ? "0px 0px 0px 1px rgba(168, 85, 247, 0.35), 0px 10px 24px -4px rgba(124, 58, 237, 0.18), 0px 4px 10px 0px rgba(0, 0, 0, 0.04)"
                    : isPurple
                    ? "0px 0px 0px 1px rgba(216, 180, 254, 0.6), 0px 12px 32px -4px rgba(147, 51, 234, 0.65), 0px 4px 10px 0px rgba(0, 0, 0, 0.25)"
                    : "0px 0px 0px 1px rgba(168, 85, 247, 0.35), 0px 14px 28px -6px rgba(147, 51, 234, 0.35), 0px 6px 12px 0px rgba(0, 0, 0, 0.25)"
                  : isTransparent
                  ? "0px 0px 0px 1px rgba(226, 232, 240, 0.8), 0px 4px 12px -2px rgba(0, 0, 0, 0.05)"
                  : isPurple
                  ? "0px 0px 0px 1px rgba(168, 85, 247, 0.45), 0px 8px 24px -2px rgba(124, 58, 237, 0.48), 0px 2px 6px rgba(0, 0, 0, 0.2)"
                  : "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 10px 20px -4px rgba(0, 0, 0, 0.3), 0px 4px 8px 0px rgba(0, 0, 0, 0.15)",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                background: isTransparent
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(243, 232, 255, 0.6) 50%, rgba(255, 255, 255, 0.7) 100%)"
                  : isPurple
                  ? "linear-gradient(135deg, #A855F7 0%, #7C3AED 45%, #C026D3 100%)"
                  : "linear-gradient(135deg, #7C3AED 0%, #3B82F6 50%, #EC4899 100%)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: `${dimensions.shaderWidth}px`,
                  maxWidth: `${dimensions.shaderWidth}px`,
                  height: `${dimensions.shaderHeight}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                  opacity: isTransparent ? 0.75 : 1,
                }}
              />
            </div>
          </div>

          {/* Interactive Button Click Surface */}
          <button
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: "preserve-3d",
              transform: "translateZ(25px)",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              overflow: "hidden",
              borderRadius: "100px",
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isTransparent
                    ? "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(168, 85, 247, 0) 70%)"
                    : isPurple
                    ? "radial-gradient(circle, rgba(233, 213, 255, 0.6) 0%, rgba(192, 132, 252, 0) 70%)"
                    : "radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "liquid-ripple-anim 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
