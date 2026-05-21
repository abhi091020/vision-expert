import { useState, useEffect, useCallback } from "react";
import { getAlerts, acknowledgeAlert } from "../api/alerts";

/**
 * useAlerts
 *
 * Polls GET /api/alerts on mount and at pollInterval.
 *
 * Alert shape (from API):
 * { id, camera_id, type, severity, message, created_at, acknowledged }
 *
 * Severity normalisation: maps any casing to "Critical" | "High" | "Medium" | "Low"
 */

const SEVERITY_COLOR = {
  critical: "#C21807",
  high: "#D97706",
  medium: "#2563EB",
  low: "#6B7280",
};

function normaliseSeverity(raw = "") {
  const s = raw.toLowerCase();
  if (s === "critical") return "Critical";
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  return "Low";
}

function severityColor(raw = "") {
  return SEVERITY_COLOR[raw.toLowerCase()] ?? SEVERITY_COLOR.low;
}

function formatAlertDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return {
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: d.toLocaleDateString([], { day: "numeric", month: "long" }),
  };
}

export function useAlerts(params = {}, pollInterval = 5000) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAlerts(params);
      const list = Array.isArray(data) ? data : [];

      // Normalise to a consistent UI shape
      setAlerts(
        list.map((a) => ({
          ...a,
          // UI-friendly fields
          uiSeverity: normaliseSeverity(a.severity),
          uiSeverityColor: severityColor(a.severity),
          uiTime: formatAlertDate(a.created_at).time,
          uiDate: formatAlertDate(a.created_at).date,
          // Use camera_id as display id if no friendly camId field
          camId: a.camera_id ?? a.camId ?? "—",
          type: a.type ?? a.event_type ?? "Alert",
        })),
      );
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, pollInterval);
    return () => clearInterval(interval);
  }, [fetchAlerts, pollInterval]);

  const handleAck = useCallback(
    async (alertId) => {
      try {
        await acknowledgeAlert(alertId);
        await fetchAlerts();
      } catch (e) {
        console.error("Failed to acknowledge alert:", e.message);
      }
    },
    [fetchAlerts],
  );
  return { alerts, loading, error, refetch: fetchAlerts, handleAck };
}
