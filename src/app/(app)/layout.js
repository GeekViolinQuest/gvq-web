"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import GVQTopNav from "@/components/GVQTopNav";

export default function AppLayout({ children }) {
  return (
    <AuthGate>
      <GVQShell
        title={null}
        subtitle={null}
        right={null}
      >
        <GVQTopNav />
        <div style={{ marginTop: 16 }}>{children}</div>
      </GVQShell>
    </AuthGate>
  );
}