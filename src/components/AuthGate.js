"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/api";

export default function AuthGate({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      clearToken();
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) return null;
  return children;
}
