"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

export default function GMGate({ children }) {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      const r = await apiGet("/api/user/me", { auth: true });
      const role = String(r?.data?.user?.role || r?.user?.role || "").toLowerCase();

      if (!alive) return;

      if (r?.ok && role === "gm") {
        setOk(true);
      } else {
        // manda pra dashboard (ou login)
        router.replace("/dashboard");
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) return <div style={{ padding: 24, color: "white" }}>Carregando...</div>;
  if (!ok) return null;

  return children;
}