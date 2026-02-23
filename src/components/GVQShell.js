"use client";

import { GVQ } from "@/lib/theme";

export default function GVQShell({
  title = "Geek Violin Quest",
  subtitle = "A Jornada do Arco Místico",
  children,
  footer,
  accent = "default", // default | success | error
}) {
  const ring =
    accent === "success"
      ? "rgba(90,255,170,0.35)"
      : accent === "error"
      ? "rgba(255,80,80,0.35)"
      : "rgba(255,215,130,0.22)";

  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />

      <div style={{ ...styles.card, boxShadow: `${GVQ.shadow.card}, 0 0 0 1px ${ring}` }}>
        <div style={styles.brandRow}>
          <div style={styles.badge}>GVQ</div>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>{subtitle}</div>
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="gvq-enter">
          {children}
        </div>

        {footer ? <div style={styles.footer}>{footer}</div> : null}
      </div>

      <style jsx>{`
        .gvq-enter {
          animation: gvq-enter 220ms ease-out both;
        }
        @keyframes gvq-enter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gvq-enter {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "28px 16px",
    color: "white",
    background:
      "radial-gradient(1200px 700px at 20% 10%, rgba(120,90,255,0.18), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(0,255,220,0.10), transparent 60%), radial-gradient(700px 500px at 50% 90%, rgba(255,180,90,0.08), transparent 60%), linear-gradient(180deg, rgba(10,12,18,1) 0%, rgba(7,8,12,1) 100%)",
    overflow: "hidden",
    position: "relative",
  },
  glowA: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(120,90,255,0.22), transparent 60%)",
    left: "-120px",
    top: "-160px",
    filter: "blur(6px)",
    pointerEvents: "none",
  },
  glowB: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 999,
    background: "radial-gradient(circle, rgba(0,255,220,0.14), transparent 60%)",
    right: "-140px",
    top: "30px",
    filter: "blur(6px)",
    pointerEvents: "none",
  },
  card: {
    width: "min(540px, 100%)",
    borderRadius: 18,
    padding: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(10px)",
    position: "relative",
  },
  brandRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 1000,
    letterSpacing: 1,
    background:
      "linear-gradient(135deg, rgba(255,215,130,0.18), rgba(120,90,255,0.18))",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  title: {
    fontSize: 18,
    fontWeight: 1000,
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    opacity: 0.78,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
    opacity: 0.75,
    lineHeight: 1.45,
  },
};