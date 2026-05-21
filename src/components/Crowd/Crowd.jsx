import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost } from "../../api/client";
import sirenSound from "../../assets/Siren1.mp3";

export default function Crowd({ active = true }) {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({ enabled: true, max_people: 10 });
  const [maxInput, setMaxInput] = useState(10);
  const [saving, setSaving] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const sessionStartRef = useRef(null);

  // Siren refs
  const sirenRef = useRef(null);
  const sirenCycleRef = useRef(null);
  const isCoolingDownRef = useRef(false);

  // Initialize audio once
  useEffect(() => {
    sirenRef.current = new Audio(sirenSound);
    sirenRef.current.loop = false;
    return () => {
      if (sirenRef.current) {
        sirenRef.current.pause();
        sirenRef.current = null;
      }
    };
  }, []);

  // Track session start
  useEffect(() => {
    if (active) {
      sessionStartRef.current = Date.now();
      setStatus(null);
    } else {
      setStatus(null);
    }
  }, [active]);

  // Poll /crowd/status every 2s
  useEffect(() => {
    if (!active) return;

    async function poll() {
      try {
        const res = await apiGet("/crowd/status");
        setStatus(res);
      } catch (_) {}
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [active]);

  // Fetch config once
  useEffect(() => {
    if (!active) return;
    apiGet("/crowd/config")
      .then((res) => {
        setConfig(res);
        setMaxInput(res.max_people ?? 10);
      })
      .catch(() => {});
  }, [active]);

  const currentCount = status?.current_count ?? 0;
  const maxPeople = status?.max_people ?? config.max_people ?? 10;
  const alertActive =
    active && currentCount > 0 && maxPeople > 0 && currentCount > maxPeople; // ✅ add active check
  const screenshot = status?.screenshot
    ? `data:image/jpeg;base64,${status.screenshot}`
    : null;
  const fillPct =
    maxPeople > 0 ? Math.min((currentCount / maxPeople) * 100, 100) : 0;

  // ── Siren cycle: play 5s → quiet 10s → repeat if still alert ────────────
  useEffect(() => {
    function stopSiren() {
      if (sirenRef.current) {
        sirenRef.current.pause();
        sirenRef.current.currentTime = 0;
      }
    }

    function clearCycle() {
      if (sirenCycleRef.current) {
        clearTimeout(sirenCycleRef.current);
        sirenCycleRef.current = null;
      }
    }

    function startCycle() {
      if (isCoolingDownRef.current) return;

      // Play siren for 5s
      if (sirenRef.current) {
        sirenRef.current.currentTime = 0;
        sirenRef.current
          .play()
          .catch((e) => console.warn("Siren play failed:", e));
      }

      // After 5s → stop and enter 10s cooldown
      sirenCycleRef.current = setTimeout(() => {
        stopSiren();
        isCoolingDownRef.current = true;

        // After 10s cooldown → if still alert, play again
        sirenCycleRef.current = setTimeout(() => {
          isCoolingDownRef.current = false;
          if (alertActive) {
            startCycle();
          }
        }, 10000);
      }, 5000);
    }

    if (alertActive) {
      startCycle();
    } else {
      clearCycle();
      stopSiren();
      isCoolingDownRef.current = false;
    }

    return () => {
      clearCycle();
      stopSiren();
      isCoolingDownRef.current = false;
    };
  }, [alertActive]);

  async function saveConfig() {
    setSaving(true);
    try {
      await apiPost("/crowd/config", {
        max_people: Number(maxInput),
        enabled: config.enabled,
      });
      setConfig((c) => ({ ...c, max_people: Number(maxInput) }));
    } catch (_) {
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled() {
    const newEnabled = !config.enabled;
    try {
      await apiPost("/crowd/config", {
        max_people: config.max_people,
        enabled: newEnabled,
      });
      setConfig((c) => ({ ...c, enabled: newEnabled }));
    } catch (_) {}
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Lightbox */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setPreviewImg(null)}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: "50vw", height: "50vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              ✕
            </button>
            <img
              src={previewImg}
              alt="Crowd Snapshot"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: "#000",
              }}
            />
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-1">
            <span className="text-gray-700">Crowd</span>
            <span style={{ color: "#0085D4" }}>Monitoring</span>
          </h2>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={
              alertActive
                ? {
                    background: "#fef2f2",
                    color: "#ef4444",
                    border: "1px solid #fca5a5",
                  }
                : {
                    background: "#f0fdf4",
                    color: "#22c55e",
                    border: "1px solid #86efac",
                  }
            }
          >
            {alertActive ? "🚨 Overcrowded!" : "✅ Normal"}
          </span>
        </div>

        {/* Count Display */}
        <div
          className="rounded-xl border-2 px-6 py-5 flex items-center gap-8"
          style={
            alertActive
              ? { background: "#fff5f5", borderColor: "#fca5a5" }
              : { background: "#f8fafc", borderColor: "#e2e8f0" }
          }
        >
          {/* Current Count */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Current
            </span>
            <span
              className="text-5xl font-black"
              style={{ color: alertActive ? "#ef4444" : "#0085D4" }}
            >
              {currentCount}
            </span>
            <span className="text-xs text-gray-400">people</span>
          </div>

          <div className="w-px h-16 bg-gray-200" />

          {/* Max Allowed */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Max Allowed
            </span>
            <span className="text-5xl font-black text-gray-500">
              {maxPeople}
            </span>
            <span className="text-xs text-gray-400">limit</span>
          </div>

          <div className="w-px h-16 bg-gray-200" />

          {/* Progress Bar + Snapshot */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>Occupancy</span>
              <span style={{ color: alertActive ? "#ef4444" : "#0085D4" }}>
                {fillPct.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPct}%`,
                  background: alertActive
                    ? "linear-gradient(90deg, #f97316, #ef4444)"
                    : "linear-gradient(90deg, #0085D4, #024167)",
                }}
              />
            </div>
            {screenshot && (
              <img
                src={screenshot}
                alt="snapshot"
                className="rounded-lg cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all object-cover mt-1"
                style={{ width: 80, height: 48 }}
                onClick={() => setPreviewImg(screenshot)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Config Card */}
      <div
        className="rounded-xl border border-black/10 p-4 flex flex-col gap-3 flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-gray-700">
            ⚙️ Configuration
          </span>
          <button
            onClick={toggleEnabled}
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all"
            style={
              config.enabled
                ? {
                    background: "#f0fdf4",
                    color: "#22c55e",
                    border: "1px solid #86efac",
                  }
                : {
                    background: "#f1f5f9",
                    color: "#94a3b8",
                    border: "1px solid #cbd5e1",
                  }
            }
          >
            {config.enabled ? "🟢 Enabled" : "⚫ Disabled"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
            Max People
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2"
          />
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-white text-xs font-bold shadow-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0085D4, #024167)" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
