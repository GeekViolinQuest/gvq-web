"use client";

export default function LoadingDots({ label = "Carregando" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ opacity: 0.9 }}>{label}</span>
      <span style={{ display: "inline-flex", gap: 4 }}>
        <i style={dotStyle(0)} />
        <i style={dotStyle(1)} />
        <i style={dotStyle(2)} />
      </span>

      <style jsx>{`
        @keyframes gvq-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
          }
          40% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          i {
            animation: none !important;
            opacity: 0.75 !important;
          }
        }
      `}</style>
    </span>
  );
}

function dotStyle(i) {
  return {
    width: 6,
    height: 6,
    borderRadius: 999,
    display: "inline-block",
    background: "rgba(255,255,255,0.85)",
    animation: `gvq-bounce 1.1s ${i * 0.12}s infinite`,
  };
}