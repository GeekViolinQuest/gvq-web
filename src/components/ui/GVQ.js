"use client";

import LoadingDots from "@/components/LoadingDots";
import { GVQ } from "@/lib/theme";

export function Row({ children, gap = 10, wrap = true, style }) {
  return (
    <div
      style={{
        display: "flex",
        gap,
        flexWrap: wrap ? "wrap" : "nowrap",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function GVQInput({
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  inputMode,
  style,
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      inputMode={inputMode}
      style={{
        width: "100%",
        marginTop: 10,
        padding: "12px 12px",
        borderRadius: GVQ.radius.md,
        border: `1px solid ${GVQ.colors.border2}`,
        background: "rgba(0,0,0,0.20)",
        color: "white",
        outline: "none",
        ...style,
      }}
    />
  );
}

export function GVQButton({
  children,
  onClick,
  disabled,
  variant = "primary", // primary | ghost
  loading = false,
  loadingLabel = "Carregando",
  full = false,
  type,
  style,
}) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: full ? "100%" : undefined,
        padding: "12px 14px",
        borderRadius: GVQ.radius.md,
        border: `1px solid ${isPrimary ? GVQ.colors.border2 : GVQ.colors.border}`,
        background: isPrimary
          ? disabled || loading
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.10)"
          : "rgba(255,255,255,0.04)",
        color: "white",
        fontWeight: 900,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* shimmer sutil quando loading */}
      {loading ? <span style={shimmerLayer} /> : null}
      <span style={{ position: "relative", zIndex: 1 }}>
        {loading ? <LoadingDots label={loadingLabel} /> : children}
      </span>

      <style jsx>{`
        @keyframes gvq-shimmer {
          0% {
            transform: translateX(-120%);
            opacity: 0.0;
          }
          15% {
            opacity: 0.25;
          }
          55% {
            opacity: 0.25;
          }
          100% {
            transform: translateX(120%);
            opacity: 0.0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gvq-shimmer {
            display: none !important;
          }
        }
      `}</style>
    </button>
  );
}

const shimmerLayer = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
  transform: "translateX(-120%)",
  animation: "gvq-shimmer 1.1s ease-in-out infinite",
  zIndex: 0,
};

export function GVQAlert({ type = "info", children, style }) {
  const border =
    type === "error"
      ? GVQ.colors.danger
      : type === "success"
      ? GVQ.colors.success
      : type === "warning"
      ? GVQ.colors.warning
      : GVQ.colors.border2;

  const bg =
    type === "error"
      ? "rgba(255,80,80,0.08)"
      : type === "success"
      ? "rgba(90,255,170,0.06)"
      : type === "warning"
      ? "rgba(255,200,90,0.06)"
      : "rgba(255,255,255,0.04)";

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: GVQ.radius.md,
        border: `1px solid ${border}`,
        background: bg,
        fontSize: 13,
        lineHeight: 1.45,
        ...style,
      }}
    >
      {children}
    </div>
  );
}