import { useState, useRef, useEffect } from "react";
import sirenSrc from "../../assets/Siren1.mp3";
import { useFireStatus } from "../../hooks/useDetection";

// ─── Siren hook ───────────────────────────────────────────────────────────────
function useSiren(triggered, muted) {
  const audioRef = useRef(null);
  const inCycle = useRef(false);
  const inPlayPhase = useRef(false);
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
      inPlayPhase.current = false;
      return;
    }
    inPlayPhase.current = true;
    const el = audioRef.current;
    if (el && !mutedRef.current) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    setTimeout(() => {
      stopAudio();
      inPlayPhase.current = false;
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
    if (!triggered) {
      stopAudio();
      inCycle.current = false;
      inPlayPhase.current = false;
    }
  }, [triggered]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (muted) {
      el.pause();
      el.currentTime = 0;
    } else if (trigRef.current && inPlayPhase.current) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  }, [muted]);

  useEffect(() => () => stopAudio(), []);
  return audioRef;
}

function toSrc(image) {
  if (!image) return null;
  if (image.startsWith("data:")) return image;
  let mime = "image/jpeg";
  if (image.startsWith("iVBORw")) mime = "image/png";
  else if (image.startsWith("R0lGOD")) mime = "image/gif";
  else if (image.startsWith("UklGR")) mime = "image/webp";
  return `data:${mime};base64,${image}`;
}

function openFullSize(src) {
  fetch(src)
    .then((r) => r.blob())
    .then((blob) => {
      window.open(URL.createObjectURL(blob), "_blank");
    });
}

// ─── FireDetection ────────────────────────────────────────────────────────────
export default function FireDetection({ active = true, wsDetections = null }) {
  const [preview, setPreview] = useState(null);
  const [muted, setMuted] = useState(false);

  // ── File-upload override state ─────────────────────────────────────────────
  // Holds the result from /fire/detect (one-shot file upload).
  // Takes priority over WS/polling data when fire is detected.
  const [fileResult, setFileResult] = useState(null);
  const fileResultTimerRef = useRef(null);

  // All state + history managed in the hook (WS or polling)
  const {
    data: hookData,
    history,
    loading,
    appendHistory,
  } = useFireStatus(active, wsDetections);

  // ── Listen for fireDetected event (from FileUpload) ────────────────────────
  // Now updates BOTH the live status card AND the history table.
  useEffect(() => {
    function handleResult(e) {
      const res = e.detail;

      // Update live status card immediately
      setFileResult({
        detected: res.detected ?? false,
        status: res.status ?? "No Detection",
        image: res.image ?? null,
        camera_id: res.camera_id ?? null,
      });

      // Auto-clear after 8 seconds so WS/polling takes over again
      clearTimeout(fileResultTimerRef.current);
      fileResultTimerRef.current = setTimeout(() => {
        setFileResult(null);
      }, 8000);

      // Also update history table
      if (res.detected) {
        appendHistory(
          res.status,
          res.image ?? null,
          res.camera_id ?? null,
          "File upload",
        );
      } else {
        appendHistory("No Detection", null, null, "No fire found");
      }
    }

    window.addEventListener("fireDetected", handleResult);
    return () => {
      window.removeEventListener("fireDetected", handleResult);
      clearTimeout(fileResultTimerRef.current);
    };
  }, [appendHistory]);

  // ── Merge: file upload result takes priority when it shows detected=true ───
  // Otherwise fall back to WS/polling data so live stream still works.
  const data = fileResult?.detected ? fileResult : hookData;
  const isAlert = !loading && data.detected;

  const audioRef = useSiren(isAlert, muted);

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
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              ✕
            </button>
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
            <div className="flex items-center gap-6 px-5 py-3 text-xs text-gray-300">
              <span>
                <span className="text-gray-500 mr-1">Time</span>
                <span className="font-mono font-bold text-white">
                  {preview.time}
                </span>
              </span>
              <span>
                <span className="text-gray-500 mr-1">Status</span>
                <span className="font-bold text-red-400">
                  {preview.status ?? "—"}
                </span>
              </span>
              <span>
                <span className="text-gray-500 mr-1">Camera ID</span>
                <span className="font-mono font-bold text-white">
                  {preview.camera_id ?? "—"}
                </span>
              </span>
              <button
                onClick={() => openFullSize(preview.src)}
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${isAlert ? "bg-red-500" : "bg-green-500"}`}
            />
            <span className="text-gray-700">Camera ID:</span>
            <span style={{ color: "#0085D4" }}>{data.camera_id ?? "—"}</span>
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
                : isAlert
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
            {muted ? "MUTED" : isAlert ? "SIREN ON" : "SIREN"}
          </button>
        </div>

        <div className="flex items-center gap-2 min-h-[36px]">
          {loading ? (
            <span className="px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400 text-sm font-semibold">
              Loading…
            </span>
          ) : isAlert ? (
            <>
              <span className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold animate-pulse">
                🔥 FIRE DETECTED
              </span>
              <span className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold">
                {data.status}
              </span>
            </>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-600 text-sm font-semibold">
              ✅ No Fire Detected
            </span>
          )}
          {data.image && (
            <img
              src={toSrc(data.image)}
              alt="snapshot"
              className="h-8 w-14 object-cover rounded-md border border-red-300 shadow-sm cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all ml-auto"
              onClick={() =>
                setPreview({
                  id: Date.now(),
                  src: toSrc(data.image),
                  time: new Date().toLocaleTimeString(),
                  status: data.status,
                  camera_id: data.camera_id,
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
          {["Time", "Status", "Camera ID", "Snapshot"].map((h) => (
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
              <span className="text-3xl mb-1">🔥</span>
              <span className="text-sm font-semibold">
                No detections recorded
              </span>
            </div>
          ) : (
            history.map((row) => {
              const isFire = row.status && row.status !== "No Detection";
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-4 px-4 py-3 items-center hover:bg-white/40 transition-colors"
                >
                  <span className="text-xs text-gray-500 font-mono">
                    {row.time}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full w-fit ${isFire ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isFire ? "bg-red-500" : "bg-green-500"}`}
                    />
                    {row.label ?? row.status ?? "—"}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {row.camera_id ?? "—"}
                  </span>
                  <div>
                    {row.image ? (
                      <img
                        src={toSrc(row.image)}
                        alt="snap"
                        className="h-10 w-16 object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all"
                        onClick={() =>
                          setPreview({
                            id: row.id,
                            src: toSrc(row.image),
                            time: row.time,
                            status: row.status,
                            camera_id: row.camera_id,
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
