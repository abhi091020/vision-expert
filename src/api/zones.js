import { apiGet, apiPut } from "./client";

/** GET /api/zones → Zone[] */
export const getZones = () => apiGet("/api/zones");

/**
 * PUT /api/zones/{cameraId} → ZoneSet
 * body: ZoneSet — polygon definitions for detection zones
 */
export const updateZones = (cameraId, body) =>
  apiPut(`/api/zones/${cameraId}`, body);
