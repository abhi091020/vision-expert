import { apiGet, FALL_URL } from "./client";

export const getFallHealth = () => apiGet("/health", FALL_URL);

export const getFallCameras = () => apiGet("/cameras", FALL_URL);

export const getFallEvents = (limit = 20) =>
  apiGet(`/events?limit=${limit}`, FALL_URL);
