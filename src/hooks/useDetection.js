import { useState, useEffect, useRef } from "react";
import { PPE_ITEMS } from "../data/mockData";
import { apiGet } from "../api/client";

// ─── useDetection ─────────────────────────────────────────────────────────────
export function useDetection(camera, streamActive = true) {
  const [violations, setViolations] = useState(camera?.violations ?? []);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!camera) return;
    setViolations(camera.violations ?? []);
    intervalRef.current = setInterval(
      () => {
        setViolations(() => {
          const allIds = PPE_ITEMS.map((item) => item.id);
          const count = Math.floor(Math.random() * 4);
          const shuffled = [...allIds].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, count);
        });
      },
      Math.floor(Math.random() * 3000) + 4000,
    );
    return () => clearInterval(intervalRef.current);
  }, [camera?.id]);

  return { violations, muted, setMuted };
}

// ─── useStats ────────────────────────────────────────────────
export function useStats() {
  const [stats, setStats] = useState({ in: 0, out: 0, total: 0, in_frame: 0 });
  useEffect(() => {
    async function poll() {
      try {
        const data = await apiGet("/stats");
        setStats(data);
      } catch (_) {}
    }
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, []);
  return {
    in: stats.in,
    out: stats.out,
    total: stats.total,
    inFrame: stats.in_frame,
  };
}

// ─── useTimestamp ────────────────────────────────────────────
export function useTimestamp() {
  const [time, setTime] = useState(getFormattedTime());
  useEffect(() => {
    const timer = setInterval(() => setTime(getFormattedTime()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

function getFormattedTime() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

// ─── useSafetyStatus ─────────────────────────────────────────
export function useSafetyStatus(active = true) {
  const [data, setData] = useState({ status: "SAFE", count: 0, image: null });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastAppendRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    async function poll() {
      try {
        const res = await apiGet("/safety_status");
        setData(res);

        if (res.status !== "SAFE" && res.count > 0) {
          const now = Date.now();
          if (now - lastAppendRef.current >= 3000) {
            lastAppendRef.current = now;
            setHistory((prev) => [
              {
                id: now,
                status: res.status,
                count: res.count,
                image: res.image,
                time: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 49),
            ]);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [active]);

  return { data, history, loading };
}

// ─── useAnimalStatus ─────────────────────────────────────────
export function useAnimalStatus(active = true) {
  const [data, setData] = useState({
    detected: false,
    animal: null,
    confidence: 0,
    image: null,
    dangerous: false,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastAppendRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    async function poll() {
      try {
        const res = await apiGet("/animal_status");
        setData(res);

        if (res.detected && res.animal) {
          const now = Date.now();
          if (now - lastAppendRef.current >= 3000) {
            lastAppendRef.current = now;
            setHistory((prev) => [
              {
                id: now,
                animal: res.animal,
                confidence: res.confidence,
                dangerous: res.dangerous,
                image: res.image,
                time: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 49),
            ]);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [active]);

  return { data, history, loading };
}

// ─── useDockStatus ─────────────────────────────────────────
export function useDockStatus(active = true) {
  const [data, setData] = useState({
    status: "CLEAR",
    vehicle_type: null,
    count: 0,
    authorized: true,
    image: null,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastAppendRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    async function poll() {
      try {
        const res = await apiGet("/dock_status");
        setData(res);

        if (res.status !== "CLEAR" && res.count > 0) {
          const now = Date.now();
          if (now - lastAppendRef.current >= 3000) {
            lastAppendRef.current = now;
            setHistory((prev) => [
              {
                id: now,
                status: res.status,
                vehicle_type: res.vehicle_type,
                count: res.count,
                authorized: res.authorized,
                image: res.image,
                time: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 49),
            ]);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [active]);

  return { data, history, loading };
}
