import { apiGet, apiPost, apiPut, apiDelete, BASE_URL } from "./client";

// ─── Camera CRUD ──────────────────────────────────────────────────────────────

/** GET /api/cameras → Camera[] */
export const getCameras = () => apiGet("/api/cameras");

/** GET /api/cameras/{id} → Camera */
export const getCamera = (id) => apiGet(`/api/cameras/${id}`);

/**
 * POST /api/cameras → Camera
 * body: CameraCreate { name, source, source_type }
 *
 * source_type values: "rtsp" | "file" | "usb" | "http"
 * For RTSP cameras, build source as: rtsp://user:pass@ip:port/path
 */
export const createCamera = (body) => apiPost("/api/cameras", body);

/** PUT /api/cameras/{id} → Camera */
export const updateCamera = (id, body) => apiPut(`/api/cameras/${id}`, body);

/** DELETE /api/cameras/{id} */
export const deleteCamera = (id) => apiDelete(`/api/cameras/${id}`);

// ─── Camera lifecycle ─────────────────────────────────────────────────────────

/** POST /api/cameras/{id}/start */
export const startCamera = (id) => apiPost(`/api/cameras/${id}/start`);

/** POST /api/cameras/{id}/stop */
export const stopCamera = (id) => apiPost(`/api/cameras/${id}/stop`);

/** GET /api/cameras/{id}/status → CameraStatus */
export const getCameraStatus = (id) => apiGet(`/api/cameras/${id}/status`);

// ─── Media URLs (use directly as <img src> or <video src>) ───────────────────

/** Snapshot image URL — use as <img src={getCameraSnapshotUrl(id)}> */
export const getCameraSnapshotUrl = (id) =>
  `${BASE_URL}/api/cameras/${id}/snapshot`;

/**
 * MJPEG stream URL — use as <img src={getCameraStreamUrl(id)}>
 * Browser handles multipart/x-mixed-replace automatically.
 */
export const getCameraStreamUrl = (id) =>
  `${BASE_URL}/api/cameras/${id}/stream`;

// ─── Clones under cameras ─────────────────────────────────────────────────────

/** GET /api/cameras/{cameraId}/clones → CameraClone[] */
export const getCameraClones = (cameraId) =>
  apiGet(`/api/cameras/${cameraId}/clones`);

/**
 * POST /api/cameras/{cameraId}/clones → CameraClone
 * body: CameraCloneCreate { name, mode, send_mode, ... }
 */
export const createCameraClone = (cameraId, body) =>
  apiPost(`/api/cameras/${cameraId}/clones`, body);
