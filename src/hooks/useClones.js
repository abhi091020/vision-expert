import { useState, useEffect, useCallback, useRef } from "react";
import {
  getClones,
  startClone,
  stopClone,
  deleteClone,
  getCloneStatus,
} from "../api/clones";

// ─── Mode inference ───────────────────────────────────────────────────────────
const NAME_TO_MODE = {
  // ── Direct single-word / shorthand names (FIX: "crowd" was missing) ──────
  crowd: "crowd",
  animal: "animal",
  railway: "railway",
  vehicle: "vehicle",
  fall: "fall",
  fire: "fire",
  ppe: "ppe",
  headcount: "headcount",
  secure_area: "secure_area",
  // ── Full phrase names ─────────────────────────────────────────────────────
  "animal detection": "animal",
  "fire detection": "fire",
  "ppe kit detection": "ppe",
  "head count": "headcount",
  "secure area": "secure_area",
  "crowd monitoring": "crowd",
  "crowd detection": "crowd",
  "number plate": "vehicle",
  "vehicle detection": "vehicle",
  "railway detection": "railway",
  "fall detection": "fall",
};

function inferMode(clone) {
  if (clone.mode) return clone.mode;
  return NAME_TO_MODE[clone.name?.toLowerCase().trim()] ?? "ppe";
}

// ─────────────────────────────────────────────────────────────────────────────

export function useClones(pollInterval = 5000) {
  const [clones, setClones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const inflightIds = useRef(new Set());

  const fetchClones = useCallback(async () => {
    try {
      const data = await getClones();
      if (!Array.isArray(data)) return;

      // Fetch status for ALL clones every poll cycle
      const statusResults = await Promise.allSettled(
        data.map((c) => getCloneStatus(c.id).then((s) => ({ id: c.id, s }))),
      );

      const statusMap = {};
      statusResults.forEach((r) => {
        if (r.status === "fulfilled") {
          statusMap[r.value.id] = r.value.s;
        }
      });

      setClones((prev) =>
        data.map((serverClone) => {
          const local = prev.find((c) => c.id === serverClone.id);

          // If a start/stop is in-flight, keep optimistic local state
          if (local && inflightIds.current.has(serverClone.id)) {
            return {
              ...serverClone,
              running: local.running ?? false,
              status: local.status ?? "stopped",
              mode: inferMode(serverClone),
              latest_payload: local.latest_payload ?? null,
            };
          }

          // Use fresh status from API
          const s = statusMap[serverClone.id];
          if (s !== undefined) {
            const running = s.running ?? false;
            return {
              ...serverClone,
              running,
              status: running ? "running" : "stopped",
              mode: inferMode(serverClone),
              latest_payload: s.latest_payload ?? null, // ← FIX: store payload
            };
          }

          // Status call failed — fall back to enabled flag
          return {
            ...serverClone,
            running: serverClone.enabled ?? false,
            status: serverClone.enabled ? "running" : "stopped",
            mode: inferMode(serverClone),
            latest_payload: null,
          };
        }),
      );

      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClones();
    const interval = setInterval(fetchClones, pollInterval);
    return () => clearInterval(interval);
  }, [fetchClones, pollInterval]);

  const handleStart = useCallback(async (id) => {
    inflightIds.current.add(id);
    setClones((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, running: true, status: "running" } : c,
      ),
    );
    try {
      await startClone(id);
      await new Promise((r) => setTimeout(r, 500));
      const s = await getCloneStatus(id);
      setClones((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                running: s.running ?? true,
                status: s.running ? "running" : "stopped",
                latest_payload: s.latest_payload ?? null,
              }
            : c,
        ),
      );
    } catch (e) {
      setClones((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, running: false, status: "stopped" } : c,
        ),
      );
      throw e;
    } finally {
      inflightIds.current.delete(id);
    }
  }, []);

  const handleStop = useCallback(async (id) => {
    inflightIds.current.add(id);
    setClones((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, running: false, status: "stopped" } : c,
      ),
    );
    try {
      await stopClone(id);
      await new Promise((r) => setTimeout(r, 500));
      const s = await getCloneStatus(id);
      setClones((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                running: s.running ?? false,
                status: s.running ? "running" : "stopped",
                latest_payload: s.latest_payload ?? null,
              }
            : c,
        ),
      );
    } catch (e) {
      setClones((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, running: true, status: "running" } : c,
        ),
      );
      throw e;
    } finally {
      inflightIds.current.delete(id);
    }
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      await deleteClone(id);
      inflightIds.current.delete(id);
      await fetchClones();
    },
    [fetchClones],
  );

  return {
    clones,
    loading,
    error,
    refetch: fetchClones,
    handleStart,
    handleStop,
    handleDelete,
  };
}
