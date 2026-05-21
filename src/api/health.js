import { apiGet } from "./client";

/** GET /api/health → { status: "ok" } */
export const getHealth = () => apiGet("/api/health");

/** GET /api/config → runtime configuration object */
export const getConfig = () => apiGet("/api/config");
