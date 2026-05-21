import { apiGet, BASE_URL } from "./client";

/**
 * GET /api/events → Event[]
 * Optional query params: camera_id, type, limit, skip, start, end
 */
export const getEvents = (params = {}) => {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)),
  ).toString();
  return apiGet(`/api/events${q ? `?${q}` : ""}`);
};

/** GET /api/events/{id} → Event */
export const getEvent = (id) => apiGet(`/api/events/${id}`);

/** Event snapshot image URL — use as <img src={getEventSnapshotUrl(id)}> */
export const getEventSnapshotUrl = (id) =>
  `${BASE_URL}/api/events/${id}/snapshot`;
