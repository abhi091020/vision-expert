import { useState, useEffect } from "react";
import { checkBackendHealth } from "../api/client";

/** Returns "checking" | "online" | "offline" */
export function useBackendStatus(pollInterval = 5000) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const ok = await checkBackendHealth();
      if (!cancelled) setStatus(ok ? "online" : "offline");
    }

    check();
    const interval = setInterval(check, pollInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollInterval]);

  return status;
}
