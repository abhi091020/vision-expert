import { useState, useEffect, useRef, useCallback } from "react";
import { apiGet } from "../api/client";
import { getCloneStatus } from "../api/clones";

// ─── useCrowdClones ───────────────────────────────────────────────────────────
// Fetches all clones from port 8000 and filters by mode === "crowd".
// Crowd detection runs through the main backend clone system — not port 9005 directly.
export function useCrowdClones(pollInterval = 4000) {
  const [clones, setClones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClones = useCallback(async () => {
    try {
      const all = await apiGet("/api/clones");
      const crowd = (all ?? []).filter((c) => c.mode === "crowd");
      setClones(crowd);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClones();
    const id = setInterval(fetchClones, pollInterval);
    return () => clearInterval(id);
  }, [fetchClones, pollInterval]);

  return { clones, loading, error, refetch: fetchClones };
}

// ─── useCrowdCloneStatus ──────────────────────────────────────────────────────
// Polls /api/clones/{id}/status every `pollInterval` ms.
// Extracts crowd_alert from latest_payload — this is where the backend
// stores: person_count, crowd_limit, confirmed, active, image.
export function useCrowdCloneStatus(cloneId, pollInterval = 2000) {
  const [crowdData, setCrowdData] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cloneId) {
      setCrowdData(null);
      setImgSrc(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setCrowdData(null);
    setImgSrc(null);

    async function poll() {
      try {
        const res = await getCloneStatus(cloneId);
        if (!mounted) return;
        const payload = res?.latest_payload;
        if (payload?.crowd_alert) setCrowdData(payload.crowd_alert);
        if (payload?.image)
          setImgSrc(`data:image/jpeg;base64,${payload.image}`);
      } catch (_) {
      } finally {
        if (mounted) setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, pollInterval);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [cloneId, pollInterval]);

  return { crowdData, imgSrc, loading };
}
