// src/lib/api.js (Padrão A: sempre chama o proxy do Next em /api/*)

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gvq_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gvq_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("gvq_token");
}

export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export async function apiGet(path) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${base}${path}`;

  const token = getToken?.() || null;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.json();
}
