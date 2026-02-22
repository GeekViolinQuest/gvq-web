// src/lib/api.js

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

function getBase() {
  // remove barra final pra evitar //api/...
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

function joinUrl(base, path) {
  if (!base) return path; // fallback (útil em dev)
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return `${base}${path}`;
}

export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = joinUrl(getBase(), path);

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

export async function apiGet(path, { auth = true } = {}) {
  const headers = new Headers();

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = joinUrl(getBase(), path);

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  // mantém o mesmo padrão do apiFetch: tenta ler json e propaga erro
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}