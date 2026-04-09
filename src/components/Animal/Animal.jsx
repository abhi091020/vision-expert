import { useState, useRef, useEffect } from "react";
import sirenSrc from "../../assets/Siren1.mp3";
import { apiGet } from "../../api/client";

const STATUS_CONFIG = {
  SAFE: {
    label: "SAFE",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
  },
  DANGER: {
    label: "DANGER",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
  },
};

function getConfig(dangerous) {
  return dangerous ? STATUS_CONFIG.DANGER : STATUS_CONFIG.SAFE;
}

function toSrc(image) {
  if (!image) return null;
  return image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function openFullSize(src) {
  fetch(src)
    .then((r) => r.blob())
    .then((blob) => {
      window.open(URL.createObjectURL(blob), "_blank");
    });
}

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

  // Effect 1 — cycle only, never reruns on mute
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

  // Effect 2 — mute/unmute only, never touches cycle
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (muted) {
      el.pause();
      el.currentTime = 0;
    } else if (trigRef.current && inPlayPhase.current) {
      // unmuted during play phase — resume, runCycle's setTimeout will stop it
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    // unmuted during gap phase — do nothing, next cycle plays automatically
  }, [muted]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopAudio();
    },
    [],
  );

  return audioRef;
}

export default function Animal({ active = true }) {
  const [data, setData] = useState({
    detected: false,
    animal: null,
    confidence: 0,
    image: null,
    dangerous: false,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [muted, setMuted] = useState(false);
  const currentRef = useRef(null);

  function appendHistory(animal, confidence, dangerous, image, label = null) {
    setHistory((prev) => [
      {
        id: Date.now() + Math.random(),
        animal,
        confidence,
        dangerous,
        image,
        label,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 49),
    ]);
  }

  useEffect(() => {
    if (!active) return;
    currentRef.current = null;
    setData({
      detected: false,
      animal: null,
      confidence: 0,
      image: null,
      dangerous: false,
    });
    setLoading(true);

    async function poll() {
      try {
        const res = await apiGet("/animal_status");
        if (res.detected && res.animal) {
          setData(res);
          const prev = currentRef.current;
          const isNew =
            !prev ||
            prev.animal !== res.animal ||
            prev.dangerous !== res.dangerous;
          if (isNew) {
            if (prev)
              appendHistory(
                prev.animal,
                prev.confidence,
                prev.dangerous,
                prev.image,
                "Left frame",
              );
            appendHistory(
              res.animal,
              res.confidence,
              res.dangerous,
              res.image ?? null,
            );
          }
          currentRef.current = {
            animal: res.animal,
            confidence: res.confidence,
            dangerous: res.dangerous,
            image: res.image ?? null,
          };
        } else {
          if (currentRef.current) {
            const prev = currentRef.current;
            appendHistory(
              prev.animal,
              prev.confidence,
              prev.dangerous,
              prev.image,
              "Left frame",
            );
            currentRef.current = null;
          }
          setData({
            detected: false,
            animal: null,
            confidence: 0,
            image: null,
            dangerous: false,
          });
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    function handleResult(e) {
      const res = e.detail;
      const dangerDets = res.danger_detections ?? [];
      const safeDets = res.safe_detections ?? [];
      const allDets = [...dangerDets, ...safeDets];
      if (allDets.length > 0) {
        allDets.forEach((det, idx) => {
          const isDanger = dangerDets.some((d) => d.animal === det.animal);
          const conf =
            typeof det.confidence === "string"
              ? parseFloat(det.confidence) / 100
              : det.confidence;
          setTimeout(
            () =>
              appendHistory(
                det.animal,
                conf,
                isDanger,
                det.screenshot_b64 ?? null,
                "File upload",
              ),
            idx * 50,
          );
        });
        const top = allDets[0];
        const isDanger = dangerDets.some((d) => d.animal === top.animal);
        const conf =
          typeof top.confidence === "string"
            ? parseFloat(top.confidence) / 100
            : top.confidence;
        setData({
          detected: true,
          animal: top.animal,
          confidence: conf,
          image: top.screenshot_b64 ?? null,
          dangerous: isDanger,
        });
        setLoading(false);
        currentRef.current = {
          animal: top.animal,
          confidence: conf,
          dangerous: isDanger,
          image: top.screenshot_b64 ?? null,
        };
      } else {
        if (currentRef.current) {
          const p = currentRef.current;
          appendHistory(
            p.animal,
            p.confidence,
            p.dangerous,
            p.image,
            "Video ended",
          );
          currentRef.current = null;
        } else {
          appendHistory(null, 0, false, null, "No animals found");
        }
        setData({
          detected: false,
          animal: null,
          confidence: 0,
          image: null,
          dangerous: false,
        });
        setLoading(false);
      }
    }
    window.addEventListener("animalDetected", handleResult);
    return () => window.removeEventListener("animalDetected", handleResult);
  }, []);

  const detected = !loading && data.detected && data.animal;
  const isAlert = detected && data.dangerous;
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
                <span className="text-gray-500 mr-1">Animal</span>
                <span className="font-bold text-white">
                  {capitalize(preview.animal) || "—"}
                </span>
              </span>
              <span>
                <span className="text-gray-500 mr-1">Status</span>
                <span
                  className={`font-bold ${preview.dangerous ? "text-red-400" : "text-green-400"}`}
                >
                  {preview.animal
                    ? preview.dangerous
                      ? "DANGER"
                      : "SAFE"
                    : "CLEAR"}
                </span>
              </span>
              {preview.confidence > 0 && (
                <span>
                  <span className="text-gray-500 mr-1">Confidence</span>
                  <span className="font-bold text-white">
                    {(preview.confidence * 100).toFixed(1)}%
                  </span>
                </span>
              )}
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
            <span style={{ color: "#0085D4" }}>001</span>
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
          ) : detected ? (
            <>
              <span
                className={`px-4 py-1.5 rounded-full border-2 text-sm font-semibold ${isAlert ? "border-red-400 bg-red-50 text-red-500 animate-pulse" : "border-green-400 bg-green-50 text-green-600"}`}
              >
                {isAlert ? "DANGER" : "SAFE"}
              </span>
              <span
                className={`px-4 py-1.5 rounded-full border-2 text-sm font-semibold ${isAlert ? "border-red-400 bg-red-50 text-red-500" : "border-green-400 bg-green-50 text-green-600"}`}
              >
                {capitalize(data.animal)}
              </span>
              {data.confidence > 0 && (
                <span className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-sm font-semibold">
                  {(data.confidence * 100).toFixed(1)}%
                </span>
              )}
            </>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-600 text-sm font-semibold">
              ✅ No Animals Detected
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
                  animal: data.animal,
                  dangerous: data.dangerous,
                  confidence: data.confidence,
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
        <div className="grid grid-cols-5 px-4 py-2 border-b border-black/10 bg-white/40">
          {["Time", "Animal", "Status", "Source", "Snapshot"].map((h) => (
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
              <span className="text-3xl mb-1">🐾</span>
              <span className="text-sm font-semibold">
                No detections recorded
              </span>
            </div>
          ) : (
            history.map((row) => {
              const isNone = !row.animal;
              const rc = isNone
                ? {
                    badge: "bg-gray-100 text-gray-500",
                    dot: "bg-gray-400",
                    label: "CLEAR",
                  }
                : getConfig(row.dangerous);
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-5 px-4 py-3 items-center hover:bg-white/40 transition-colors"
                >
                  <span className="text-xs text-gray-500 font-mono">
                    {row.time}
                  </span>
                  <span className="text-sm font-black text-gray-700">
                    {isNone ? "—" : capitalize(row.animal)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full w-fit ${rc.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                    {rc.label}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {row.label ?? "Live"}
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
                            animal: row.animal,
                            dangerous: row.dangerous,
                            confidence: row.confidence,
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
