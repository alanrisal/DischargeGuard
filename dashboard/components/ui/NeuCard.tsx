"use client";
import React from "react";

interface NeuCardProps {
  variant?: "raised" | "inset" | "raised-sm";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function NeuCard({
  variant = "raised",
  className = "",
  style,
  children,
  onClick,
}: NeuCardProps) {
  const cls =
    variant === "inset" ? "neu-inset" :
    variant === "raised-sm" ? "neu-raised-sm" :
    "neu-raised";

  return (
    <div
      className={`${cls} ${className}`}
      style={{ padding: 24, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
