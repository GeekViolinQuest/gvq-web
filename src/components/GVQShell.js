"use client";

export default function GVQShell({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        background:
          "radial-gradient(900px 420px at 18% 10%, rgba(126,94,255,0.26), transparent 60%)," +
          "radial-gradient(900px 420px at 78% 30%, rgba(0,255,214,0.10), transparent 60%)," +
          "linear-gradient(180deg, rgba(4,6,12,1) 0%, rgba(3,5,10,1) 100%)",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>{title}</h1>
            {subtitle ? <div style={{ opacity: 0.8 }}>{subtitle}</div> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>

        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
}