import { useState, useEffect } from "react";
import { checkBackendHealth } from "../api/client";

export function useBackendStatus() {
  const [status, setStatus] = useState("checking"); // "checking" | "online" | "offline"

  useEffect(() => {
    async function check() {
      const ok = await checkBackendHealth();
      setStatus(ok ? "online" : "offline");
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
