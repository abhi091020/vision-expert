import { apiGet, RAILWAY_URL } from "./client";

export const getRailwayHealth = () => apiGet("/health", RAILWAY_URL);

export const getBarrierState = () => apiGet("/api/barrier/state", RAILWAY_URL);

export const getBarrierAlerts = (limit = 100) =>
  apiGet(`/api/barrier/alerts?limit=${limit}`, RAILWAY_URL);
