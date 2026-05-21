import { apiGet, apiPost } from "./client";

/**
 * GET /api/alerts → Alert[]
 * Optional query params: camera_id, acknowledged, limit, skip
 */
export const getAlerts = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)),
  ).toString();
  return apiGet(`/api/alerts${q ? `?${q}` : ""}`);
};

/** POST /api/alerts/{alertId}/ack — Acknowledge an alert */
export const acknowledgeAlert = (alertId) =>
  apiPost(`/api/alerts/${alertId}/ack`);
