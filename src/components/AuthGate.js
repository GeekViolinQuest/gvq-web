"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getToken, clearToken } from "@/lib/api";

const VALIDATE_ON_SERVER = false; // ⭐ opcional: coloque true se tiver /api/auth/me

export default function AuthGate({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      const token = getToken();

      if (!token) {
        clearToken();
        router.replace("/login");
        return;
      }

      if (VALIDATE_ON_SERVER) {
        // ajuste o endpoint se o seu for outro
        const r = await apiRequest("/api/auth/me", { method: "GET", auth: true });

        if (!alive) return;

        if (!r.ok) {
          clearToken();
          router.replace("/login");
          return;
        }
      }

      setReady(true);
    }

    run();

    return () => {
      alive = false;
    };
  }, [router]);

  if (!ready) return null;
  return children;
}