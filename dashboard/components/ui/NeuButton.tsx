"use client";
import React from "react";

interface NeuButtonProps {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

const SIZES = {
  sm: { padding: "6px 14px", fontSize: 11, gap: 5 },
  md: { padding: "9px 20px", fontSize: 13, gap: 7 },
  lg: { padding: "13px 28px", fontSize: 15, gap: 8 },
};

export default function NeuButton({
  variant = "default",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  style,
  children,
  type = "button",
}: NeuButtonProps) {
  const variantCls =
    variant === "primary" ? "neu-btn neu-btn-primary" :
    variant === "danger"  ? "neu-btn neu-btn-danger"  :
    "neu-btn";

  const sz = SIZES[size];

  return (
    <button
      type={type}
      className={`${variantCls} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: sz.padding,
        fontSize: sz.fontSize,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
        color: variant === "default" ? "var(--text-secondary)" : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
