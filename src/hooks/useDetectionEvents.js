import { useState, useEffect, useRef } from "react";
import { fetchDetectionEvents, hasDetectionBackend } from "../api/detection";

export function useDetectionEvents(mode, active = true, pollInterval = 4000) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mode || !active || !hasDetectionBackend(mode)) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    async function poll() {
      const data = await fetchDetectionEvents(mode, 20);
      if (!mountedRef.current) return;
      setEvents(data);
      setLoading(false);
    }

    poll();
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [mode, active, pollInterval]);

  return { events, loading };
}
