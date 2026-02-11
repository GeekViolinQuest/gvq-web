const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gvq_token");
}

export function setToken(token) {
  localStorage.setItem("gvq_token", token);
}

export function clearToken() {
  localStorage.removeItem("gvq_token");
}

export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err?.message || "Network error" } };
  }
}

