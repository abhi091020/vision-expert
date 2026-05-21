import { apiGet } from "./client";

function buildQuery(params) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)),
  ).toString();
  return q ? `?${q}` : "";
}

/**
 * GET /api/analytics/summary → summary object
 * Optional params: camera_id, start, end
 *
 * Expected shape (adapt to actual API response):
 * {
 *   total_cameras, active_cameras,
 *   total_alerts, critical_alerts,
 *   people_today, vehicles_today,
 *   events_today
 * }
 */
export const getAnalyticsSummary = (params = {}) =>
  apiGet(`/api/analytics/summary${buildQuery(params)}`);

/**
 * GET /api/analytics/timeseries → timeseries data
 * Optional params: camera_id, metric, interval, start, end
 *
 * Expected shape: { labels: string[], datasets: { label, data }[] }
 * or array of { date, value } — adapt in useAnalytics hook.
 */
export const getAnalyticsTimeseries = (params = {}) =>
  apiGet(`/api/analytics/timeseries${buildQuery(params)}`);

/**
 * GET /api/analytics/ai → AI-generated analytics
 * Optional params: camera_id, start, end
 */
export const getAIAnalytics = (params = {}) =>
  apiGet(`/api/analytics/ai${buildQuery(params)}`);
