import { useState, useEffect, useCallback } from "react";
import {
  getCameras,
  startCamera,
  stopCamera,
  deleteCamera,
  getCameraStatus,
} from "../api/cameras";

/**
 * useCameras
 *
 * Polls GET /api/cameras on mount and at pollInterval.
 * Returns cameras list, loading/error state, and action helpers.
 *
 * Camera shape (from API):
 * { id, name, source, source_type, created_at, ... }
 */
export function useCameras(pollInterval = 5000) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCameras = useCallback(async () => {
    try {
      const data = await getCameras();
      setCameras(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCameras, pollInterval]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStart = useCallback(
    async (id) => {
      await startCamera(id);
      await fetchCameras();
    },
    [fetchCameras],
  );

  const handleStop = useCallback(
    async (id) => {
      await stopCamera(id);
      await fetchCameras();
    },
    [fetchCameras],
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteCamera(id);
      await fetchCameras();
    },
    [fetchCameras],
  );

  const fetchStatus = useCallback(async (id) => {
    try {
      return await getCameraStatus(id);
    } catch {
      return null;
    }
  }, []);

  return {
    cameras,
    loading,
    error,
    refetch: fetchCameras,
    handleStart,
    handleStop,
    handleDelete,
    fetchStatus,
  };
}
