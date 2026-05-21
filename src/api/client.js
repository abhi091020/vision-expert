// ─── Base URL ─────────────────────────────────────────────────────────────────
// Update .env: VITE_API_BASE_URL=http://192.168.10.238:8010
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const WS_URL =
  import.meta.env.VITE_WS_BASE_URL || BASE_URL.replace(/^http/, "ws");

export { BASE_URL, WS_URL };

// ─── Default headers ──────────────────────────────────────────────────────────
const defaultHeaders = {
  "ngrok-skip-browser-warning": "true",
  "Content-Type": "application/json",
};

// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status === 422 || res.status === 404;
  } catch {
    return false;
  }
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
export async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(endpoint, body = null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // ← add this block
    let detail = `POST ${endpoint} failed: ${res.status}`;
    try {
      const err = await res.json();
      if (err?.detail) {
        detail = Array.isArray(err.detail)
          ? err.detail.map((d) => `${d.loc?.join(".")} — ${d.msg}`).join(", ")
          : err.detail;
      }
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

export async function apiPut(endpoint, body = null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ─── DELETE: handles 204 No Content safely ────────────────────────────────────
export async function apiDelete(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
  if (res.status === 204 || res.headers.get("content-length") === "0")
    return null;
  return res.json().catch(() => null);
}

export async function apiPostForm(endpoint, formData) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "ngrok-skip-browser-warning": "true" },
    body: formData,
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}
