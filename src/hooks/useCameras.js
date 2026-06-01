import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCameras,
  startCamera,
  stopCamera,
  deleteCamera,
  getCameraStatus,
} from "../api/cameras";

export function useCameras(pollInterval = 5000) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ids with in-flight start/stop — status callbacks won't override these
  const inflightIds = useRef(new Set());

  const fetchCameras = useCallback(async () => {
    try {
      const data = await getCameras();
      if (!Array.isArray(data)) return;

      setCameras((prev) =>
        data.map((serverCam) => {
          const local = prev.find((c) => c.id === serverCam.id);

          // In-flight action — keep optimistic state
          if (local && inflightIds.current.has(serverCam.id)) {
            return {
              ...serverCam,
              running: local.running ?? false,
              status: local.status ?? "stopped",
            };
          }

          if (local) {
            // Known camera — preserve local running state
            return {
              ...serverCam,
              running: local.running ?? false,
              status: local.status ?? "stopped",
            };
          }

          // Brand-new camera — fetch real status async
          getCameraStatus(serverCam.id)
            .then((s) => {
              if (!s) return;
              setCameras((prev2) =>
                prev2.map((c) => {
                  // Skip if a start/stop fired while we were fetching
                  if (c.id === serverCam.id && !inflightIds.current.has(c.id)) {
                    return {
                      ...c,
                      running: s.running ?? false,
                      status: s.running ? "running" : "stopped",
                    };
                  }
                  return c;
                }),
              );
            })
            .catch(() => {});

          return { ...serverCam, running: false, status: "stopped" };
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
    fetchCameras();
    const interval = setInterval(fetchCameras, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCameras, pollInterval]);

  const handleStart = useCallback(async (id) => {
    inflightIds.current.add(id);
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, running: true, status: "running" } : c,
      ),
    );
    try {
      const res = await startCamera(id);
      setCameras((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                running: res.running ?? true,
                status: res.running ? "running" : "stopped",
              }
            : c,
        ),
      );
    } catch (e) {
      setCameras((prev) =>
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
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, running: false, status: "stopped" } : c,
      ),
    );
    try {
      const res = await stopCamera(id);
      setCameras((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                running: res.running ?? false,
                status: res.running ? "running" : "stopped",
              }
            : c,
        ),
      );
    } catch (e) {
      setCameras((prev) =>
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
      await deleteCamera(id);
      inflightIds.current.delete(id);
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
