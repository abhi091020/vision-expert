import { apiGet, apiPost, apiPut, apiDelete, BASE_URL } from "./client";

// ─── Clone CRUD ───────────────────────────────────────────────────────────────

/** GET /api/clones → CameraClone[] */
export const getClones = () => apiGet("/api/clones");

/** GET /api/clones/{id} → CameraClone */
export const getClone = (id) => apiGet(`/api/clones/${id}`);

/** PUT /api/clones/{id} → CameraClone */
export const updateClone = (id, body) => apiPut(`/api/clones/${id}`, body);

/** DELETE /api/clones/{id} */
export const deleteClone = (id) => apiDelete(`/api/clones/${id}`);

// ─── Clone lifecycle ──────────────────────────────────────────────────────────

/** POST /api/clones/{id}/start */
export const startClone = (id) => apiPost(`/api/clones/${id}/start`);

/** POST /api/clones/{id}/stop */
export const stopClone = (id) => apiPost(`/api/clones/${id}/stop`);

/** GET /api/clones/{id}/status → CloneStatus */
export const getCloneStatus = (id) => apiGet(`/api/clones/${id}/status`);

// ─── Fall detection ───────────────────────────────────────────────────────────

/** POST /api/clones/{id}/fall-alert/start */
export const startFallDetection = (id) =>
  apiPost(`/api/clones/${id}/fall-alert/start`);

/** POST /api/clones/{id}/fall-alert/stop */
export const stopFallDetection = (id) =>
  apiPost(`/api/clones/${id}/fall-alert/stop`);

// ─── Media URLs ───────────────────────────────────────────────────────────────

/** Snapshot image URL — use as <img src={getCloneSnapshotUrl(id)}> */
export const getCloneSnapshotUrl = (id) =>
  `${BASE_URL}/api/clones/${id}/snapshot`;

/** MJPEG stream URL — use as <img src={getCloneStreamUrl(id)}> */
export const getCloneStreamUrl = (id) => `${BASE_URL}/api/clones/${id}/stream`;
