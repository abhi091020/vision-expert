// ─── Base URLs ────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL; // Main    :8000
const FALL_URL = import.meta.env.VITE_FALL_URL; // Fall    :9001
const VEHICLE_URL = import.meta.env.VITE_VEHICLE_URL; // Vehicle :9002
const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL; // Railway :9003
const ANIMAL_URL = import.meta.env.VITE_ANIMAL_URL; // Animal  :9004
const CROWD_URL =
  import.meta.env.VITE_CROWD_API_BASE_URL || "http://localhost:9005"; // Crowd :9005

// ─── WebSocket URLs ───────────────────────────────────────────────────────────
const WS_URL = import.meta.env.VITE_WS_URL || BASE_URL.replace(/^http/, "ws");
const WS_FALL_URL =
  import.meta.env.VITE_WS_FALL_URL || FALL_URL.replace(/^http/, "ws");
const WS_VEHICLE_URL =
  import.meta.env.VITE_WS_VEHICLE_URL || VEHICLE_URL.replace(/^http/, "ws");
const WS_RAILWAY_URL =
  import.meta.env.VITE_WS_RAILWAY_URL || RAILWAY_URL.replace(/^http/, "ws");
const WS_ANIMAL_URL =
  import.meta.env.VITE_WS_ANIMAL_URL || ANIMAL_URL.replace(/^http/, "ws");
const WS_CROWD_URL = CROWD_URL.replace(/^http/, "ws");

export {
  BASE_URL,
  FALL_URL,
  VEHICLE_URL,
  RAILWAY_URL,
  ANIMAL_URL,
  CROWD_URL,
  WS_URL,
  WS_FALL_URL,
  WS_VEHICLE_URL,
  WS_RAILWAY_URL,
  WS_ANIMAL_URL,
  WS_CROWD_URL,
};

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

// ─── Generic helpers (accept any base) ───────────────────────────────────────
export async function apiGet(endpoint, base = BASE_URL) {
  const res = await fetch(`${base}${endpoint}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(endpoint, body = null, base = BASE_URL) {
  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
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

export async function apiPut(endpoint, body = null, base = BASE_URL) {
  const res = await fetch(`${base}${endpoint}`, {
    method: "PUT",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ─── DELETE: handles 204 No Content safely ────────────────────────────────────
export async function apiDelete(endpoint, base = BASE_URL) {
  const res = await fetch(`${base}${endpoint}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
  if (res.status === 204 || res.headers.get("content-length") === "0")
    return null;
  return res.json().catch(() => null);
}

export async function apiPostForm(endpoint, formData, base = BASE_URL) {
  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: { "ngrok-skip-browser-warning": "true" },
    body: formData,
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}
