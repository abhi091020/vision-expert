import { useState, useEffect, useRef } from "react";
import { useSafetyStatus } from "../../hooks/useDetection";
import sirenSrc from "../../assets/Siren1.mp3";

const STATUS_CONFIG = {
  SAFE: {
    label: "SAFE",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
  },
  UNSAFE: {
    label: "UNSAFE",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
  },
};

function getConfig(status) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG["UNSAFE"];
}

function toSrc(image) {
  return image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
}

function broadcastSiren(active) {
  window.dispatchEvent(
    new CustomEvent("secureAreaSiren", { detail: { active } }),
  );
}

function useSiren(triggered, muted) {
  const audioRef = useRef(null);
  const inCycle = useRef(false);
  const trigRef = useRef(triggered);
  const mutedRef = useRef(muted);

  trigRef.current = triggered;
  mutedRef.current = muted;

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  function runCycle() {
    if (!trigRef.current) {
      inCycle.current = false;
      broadcastSiren(false);
      return;
    }

    broadcastSiren(true);
    const el = audioRef.current;
    if (el && !mutedRef.current) {
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
        } else {
          broadcastSiren(false);
        }
      }, 10_000);
    }, 5_000);
  }

  // Effect 1 — controls the cycle only, never reruns on mute change
  useEffect(() => {
    if (triggered && !inCycle.current) {
      inCycle.current = true;
      runCycle();
    }
    if (!triggered) {
      stopAudio();
      inCycle.current = false;
      broadcastSiren(false);
    }
  }, [triggered]);

  // Effect 2 — mute/unmute instantly, never touches the cycle
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (muted) {
      el.pause();
      el.currentTime = 0;
    } else if (trigRef.current && inCycle.current) {
      // unmuted while still triggered — play immediately
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  }, [muted]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopAudio();
      broadcastSiren(false);
    },
    [],
  );

  return audioRef;
}

export default function SecureArea({ active = true }) {
  const { data, history, loading } = useSafetyStatus(active);
  const cfg = getConfig(data.status);

  const [preview, setPreview] = useState(null);
  const [muted, setMuted] = useState(false);

  const detected = !loading && data.status !== "SAFE" && data.count > 0;
  const audioRef = useSiren(detected, muted);

  return (
    <div className="flex flex-col gap-3 h-full">
      <audio ref={audioRef} src={sirenSrc} preload="auto" />

      {/* ── Lightbox Modal ── */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setPreview(null)}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              maxWidth: "80vw",
              maxHeight: "85vh",
              background: "rgba(15,23,42,0.95)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              ✕
            </button>

            {/* Image */}
            <img
              src={preview.src}
              alt="Preview"
              style={{
                maxWidth: "80vw",
                maxHeight: "70vh",
                display: "block",
                objectFit: "contain",
              }}
            />

            {/* Meta bar */}
            <div className="flex items-center gap-6 px-5 py-3 text-xs text-gray-300">
              <span>
                <span className="text-gray-500 mr-1">Time</span>
                <span className="font-mono font-bold text-white">
                  {preview.time}
                </span>
              </span>
              <span>
                <span className="text-gray-500 mr-1">Status</span>
                <span className="font-bold text-red-400">{preview.status}</span>
              </span>
              <span>
                <span className="text-gray-500 mr-1">Intruders</span>
                <span className="font-bold text-white">{preview.count}</span>
              </span>
              <button
                onClick={() => {
                  fetch(preview.src)
                    .then((r) => r.blob())
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                    });
                }}
                className="ml-auto px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                🔍 Open Full Size
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Card ── */}
      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${cfg.dot}`}
            />
            <span className="text-gray-700">Secure Area</span>
          </h2>
          <button
            onClick={() => setMuted((m) => !m)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95"
            style={
              muted
                ? {
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#94a3b8",
                  }
                : detected
                  ? {
                      background: "#fef2f2",
                      border: "1px solid #fca5a5",
                      color: "#ef4444",
                    }
                  : {
                      background: "#f0fdf4",
                      border: "1px solid #86efac",
                      color: "#22c55e",
                    }
            }
          >
            <span className="text-base">{muted ? "🔇" : "🔊"}</span>
            {muted ? "MUTED" : detected ? "SIREN ON" : "SIREN"}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 min-h-[36px]">
          {loading ? (
            <span className="px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400 text-sm font-semibold">
              Loading…
            </span>
          ) : detected ? (
            <>
              <span className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold animate-pulse">
                {data.status}
              </span>
              <span className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold">
                {data.count} Intruder{data.count !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-600 text-sm font-semibold">
              ✅ Area Secure
            </span>
          )}

          {data.image && (
            <img
              src={toSrc(data.image)}
              alt="Live snapshot"
              className="h-8 w-14 object-cover rounded-md border border-red-300 shadow-sm cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all ml-auto"
              onClick={() =>
                setPreview({
                  src: toSrc(data.image),
                  time: new Date().toLocaleTimeString(),
                  status: data.status,
                  count: data.count,
                })
              }
            />
          )}
        </div>
      </div>

      {/* ── History Table ── */}
      <div
        className="flex-1 rounded-xl overflow-hidden border border-black/10 flex flex-col min-h-0"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="grid grid-cols-4 px-4 py-2 border-b border-black/10 bg-white/40">
          {["Time", "Status", "Count", "Snapshot"].map((h) => (
            <span
              key={h}
              className="text-xs font-black text-gray-500 uppercase tracking-wider"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-1">🛡️</span>
              <span className="text-sm font-semibold">
                No violations recorded
              </span>
            </div>
          ) : (
            history.map((row) => {
              const rc = getConfig(row.status);
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-4 px-4 py-3 items-center hover:bg-white/40 transition-colors"
                >
                  <span className="text-xs text-gray-500 font-mono">
                    {row.time}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full w-fit ${rc.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                    {row.status}
                  </span>
                  <span className="text-sm font-black text-gray-700">
                    {row.count}
                  </span>
                  <div>
                    {row.image ? (
                      <img
                        src={toSrc(row.image)}
                        alt="snapshot"
                        className="h-10 w-16 object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all"
                        onClick={() =>
                          setPreview({
                            src: toSrc(row.image),
                            time: row.time,
                            status: row.status,
                            count: row.count,
                          })
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
