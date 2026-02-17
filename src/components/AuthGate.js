"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/api";

export default function AuthGate({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearToken();
      router.replace("/login");
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) return null;
  return children;
}
