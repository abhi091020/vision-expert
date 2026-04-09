import { useRef, useEffect } from "react";
import { useDockStatus } from "../../hooks/useDetection";
import sirenSrc from "../../assets/Siren1.mp3";

// ─── Siren Hook ──────────────────────────────────────────────
function useSiren(triggered) {
  const audioRef = useRef(null);
  const inCycle = useRef(false);
  const trigRef = useRef(triggered);
  trigRef.current = triggered;

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  function runCycle() {
    if (!trigRef.current) {
      inCycle.current = false;
      return;
    }
    const el = audioRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    setTimeout(() => {
      stopAudio();
      setTimeout(() => {
        inCycle.current = false;
        if (trigRef.current) {
          inCycle.current = true;
          runCycle();
        }
      }, 10_000);
    }, 5_000);
  }

  useEffect(() => {
    if (triggered && !inCycle.current) {
      inCycle.current = true;
      runCycle();
    }
    if (!triggered) stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggered]);

  useEffect(() => () => stopAudio(), []);
  return audioRef;
}

// ─── Component ───────────────────────────────────────────────
export default function Dock({ active = true }) {
  const { data, loading } = useDockStatus(active);

  const sirenTriggered = !loading && data.status !== "CLEAR" && data.count > 0;
  const audioRef = useSiren(sirenTriggered);

  const isAlert = !loading && data.status !== "CLEAR" && data.count > 0;
  const stopperDeployed = data.stopper_deployed ?? data.authorized ?? false;

  const alertTitle = isAlert ? "Alert" : "Dock Clear";
  const alertBody = isAlert
    ? (data.alert_message ??
      `Human Detected on Dock Station ${data.station ?? 2}`)
    : "No activity detected. Dock area is clear.";

  return (
    <div className="flex flex-col h-full gap-3">
      <audio ref={audioRef} src={sirenSrc} preload="auto" />

      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col gap-3 flex-shrink-0">
        {/* Camera ID — matches PPEPanel exactly */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-1">
            <span className="text-gray-700">Camera ID:</span>
            <span style={{ color: "#0085D4" }}>009</span>
          </h2>
        </div>

        {/* Stopper row — matches PPEPanel violation chips style */}
        <div className="flex items-center gap-2 flex-shrink-0 min-h-[36px]">
          <span className="text-sm font-semibold text-gray-500">Stopper:</span>
          <span
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={
              stopperDeployed
                ? {
                    border: "1.5px solid #16a34a",
                    color: "#16a34a",
                    background: "#f0fdf4",
                  }
                : {
                    border: "1.5px solid #dc2626",
                    color: "#dc2626",
                    background: "#fff5f5",
                  }
            }
          >
            {stopperDeployed ? "Deployed" : "Not Deployed"}
          </span>
        </div>

        {/* Alert Box */}
        <div
          className="rounded-xl border-2 px-6 py-8 flex flex-col items-center text-center gap-2 mt-1"
          style={
            isAlert
              ? {
                  background: "#fff5f5",
                  borderColor: "#fca5a5",
                  boxShadow: "0 0 32px rgba(239,68,68,0.18)",
                }
              : {
                  background: "#f0fdf4",
                  borderColor: "#86efac",
                }
          }
        >
          <p
            className="text-base font-bold"
            style={{ color: isAlert ? "#dc2626" : "#16a34a" }}
          >
            {alertTitle}
          </p>
          <p
            className="text-sm font-semibold leading-relaxed"
            style={{ color: isAlert ? "#dc2626" : "#16a34a" }}
          >
            {alertBody}
          </p>
        </div>
      </div>
    </div>
  );
}
