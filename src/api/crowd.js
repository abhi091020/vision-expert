import { apiGet, apiPost, apiDelete, CROWD_URL } from "./client";

// ─── Crowd Detection Service (Port 9005) ─────────────────────────────────────

/** GET /health → { status, crowd_limit, active_cameras, model_loaded, ... } */
export const getCrowdHealth = () => apiGet("/health", CROWD_URL);

/** GET /settings → full model / camera / crowd_detection settings */
export const getCrowdSettings = () => apiGet("/settings", CROWD_URL);

/** POST /settings → update settings */
export const updateCrowdSettings = (body) =>
  apiPost("/settings", body, CROWD_URL);

/** GET /cameras → CameraInfo[] registered in crowd service */
export const getCrowdServiceCameras = () => apiGet("/cameras", CROWD_URL);

/** POST /cameras → add camera to crowd service (body: CameraCreate) */
export const addCrowdServiceCamera = (body) =>
  apiPost("/cameras", body, CROWD_URL);

/** POST /cameras/{id}/start */
export const startCrowdServiceCamera = (id) =>
  apiPost(`/cameras/${id}/start`, null, CROWD_URL);

/** POST /cameras/{id}/stop */
export const stopCrowdServiceCamera = (id) =>
  apiPost(`/cameras/${id}/stop`, null, CROWD_URL);

/** DELETE /cameras/{id} */
export const deleteCrowdServiceCamera = (id) =>
  apiDelete(`/cameras/${id}`, CROWD_URL);

/** MJPEG stream URL — use directly as <img src> */
export const getCrowdServiceStreamUrl = (id) =>
  `${CROWD_URL}/cameras/${id}/stream`;

/** GET /events → CrowdEventResponse[] */
export const getCrowdEvents = () => apiGet("/events", CROWD_URL);

/** GET /api/analytics/crowd */
export const getCrowdAnalytics = () =>
  apiGet("/api/analytics/crowd", CROWD_URL);
