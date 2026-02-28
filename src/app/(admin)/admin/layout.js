"use client";

import AuthGate from "@/components/AuthGate";
import GMGate from "@/components/GMGate";
import GVQTopNav from "@/components/GVQTopNav";

export default function AdminLayout({ children }) {
  return (
    <AuthGate>
      <GMGate>
        <GVQTopNav />
        {children}
      </GMGate>
    </AuthGate>
  );
}