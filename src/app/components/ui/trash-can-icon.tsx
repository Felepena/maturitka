"use client";

import * as React from "react";

type TrashCanIconProps = {
  size?: number; // pixel size for width/height
  color?: string; // stroke/fill color (hex or css)
  strokeWidth?: number; // stroke width for outline
  background?: string; // background color for the wrapper
  opacity?: number; // 0..1
  rotation?: number; // degrees
  shadow?: number; // px of drop-shadow blur
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  padding?: number; // px padding around the svg
  filled?: boolean; // optional: use filled style
  className?: string;
};

function normalizeColor(c?: string) {
  if (!c) return "currentColor";
  // allow hex without '#'
  if (/^[0-9a-fA-F]{3,8}$/.test(c)) return `#${c}`;
  return c;
}

export function TrashCanIcon({
  size = 16,
  color = "000000",
  strokeWidth = 2,
  background = "transparent",
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
  filled = false,
  className,
}: TrashCanIconProps) {
  const c = normalizeColor(color);
  const scaleX = flipHorizontal ? -1 : 1;
  const scaleY = flipVertical ? -1 : 1;
  const transform = `rotate(${rotation}) scale(${scaleX}, ${scaleY})`;

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    background,
    padding,
    opacity,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    filter: shadow ? `drop-shadow(0 1px ${Math.max(1, shadow)}px rgba(0,0,0,0.35))` : undefined,
  };

  return (
    <span style={wrapperStyle} className={className} aria-hidden>
      {filled ? (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform }}
          fill={c}
        >
          <path d="M3 6h18v2H3z" />
          <path d="M5 8h14l-1.3 12.1A2 2 0 0 1 15.7 22H8.3a2 2 0 0 1-2-1.9L5 8z" />
          <path d="M10 3h4a2 2 0 0 1 2 2v1H8V5a2 2 0 0 1 2-2z" />
        </svg>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform }}
          fill="none"
          stroke={c}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </span>
  );
}

export default TrashCanIcon;

