import { useState, useEffect, useCallback } from "react";
import { getAnalyticsSummary, getAnalyticsTimeseries } from "../api/analytics";

// ─── useAnalyticsSummary ──────────────────────────────────────────────────────
/**
 * Polls GET /api/analytics/summary
 *
 * Returns normalised summary with fallback values so StatCards never crash.
 * Maps common field name variants from different backend versions.
 *
 * Expected API shape (any of these field names work):
 * {
 *   total_cameras | cameras_total,
 *   active_cameras | cameras_active | cameras_online,
 *   total_alerts  | alerts_total,
 *   critical_alerts | alerts_critical,
 *   people_today  | people_detected | people_count,
 *   vehicles_today | vehicles_detected | vehicle_count,
 * }
 */
export function useAnalyticsSummary(params = {}, pollInterval = 15000) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const raw = await getAnalyticsSummary(params);

      // Normalise field names so components don't care about API shape
      setSummary({
        totalCameras:
          raw.total_cameras ?? raw.cameras_total ?? raw.camera_count ?? 0,
        activeCameras:
          raw.active_cameras ??
          raw.cameras_active ??
          raw.cameras_online ??
          raw.running_cameras ??
          0,
        totalAlerts:
          raw.total_alerts ?? raw.alerts_total ?? raw.alert_count ?? 0,
        criticalAlerts:
          raw.critical_alerts ?? raw.alerts_critical ?? raw.critical_count ?? 0,
        peopleToday:
          raw.people_today ??
          raw.people_detected ??
          raw.people_count ??
          raw.total_people ??
          0,
        vehiclesToday:
          raw.vehicles_today ??
          raw.vehicles_detected ??
          raw.vehicle_count ??
          raw.total_vehicles ??
          0,
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, pollInterval);
    return () => clearInterval(interval);
  }, [fetchSummary, pollInterval]);

  return { summary, loading, error, refetch: fetchSummary };
}

// ─── useAnalyticsTimeseries ───────────────────────────────────────────────────
/**
 * Polls GET /api/analytics/timeseries
 *
 * Returns { people, vehicles } each as [{ date, value }]
 * ready to drop into AnalyticsLineChart.
 *
 * Expected API shape (flexible — handles both formats):
 *   Array format: [{ timestamp, people, vehicles, alerts }]
 *   Object format: { people: [...], vehicles: [...] }
 */
export function useAnalyticsTimeseries(params = {}, pollInterval = 60000) {
  const [people, setPeople] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeseries = useCallback(async () => {
    try {
      const raw = await getAnalyticsTimeseries(params);

      function formatLabel(ts) {
        try {
          const d = new Date(ts);
          return d.toLocaleDateString([], { day: "numeric", month: "short" });
        } catch {
          return String(ts);
        }
      }

      // Handle array-of-rows format
      if (Array.isArray(raw)) {
        const toSeries = (key) =>
          raw.map((row) => ({
            date: formatLabel(row.timestamp ?? row.date ?? row.time),
            value: row[key] ?? 0,
          }));
        setPeople(toSeries("people"));
        setVehicles(toSeries("vehicles"));
        setAlerts(toSeries("alerts"));
      }
      // Handle object-of-series format
      else if (raw && typeof raw === "object") {
        const toSeries = (arr = []) =>
          arr.map((row) => ({
            date: formatLabel(row.timestamp ?? row.date ?? row.time),
            value: row.value ?? row.count ?? 0,
          }));
        setPeople(toSeries(raw.people ?? raw.people_count ?? []));
        setVehicles(toSeries(raw.vehicles ?? raw.vehicle_count ?? []));
        setAlerts(toSeries(raw.alerts ?? raw.alert_count ?? []));
      }

      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchTimeseries();
    const interval = setInterval(fetchTimeseries, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTimeseries, pollInterval]);

  return { people, vehicles, alerts, loading, error, refetch: fetchTimeseries };
}
