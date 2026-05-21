import { useState, useEffect, useRef, useCallback } from "react";
import { useTimestamp } from "../../hooks/useDetection";
import { WS_URL, apiPost } from "../../api/client";

// ── Internal WS hook REMOVED — Dashboard owns the single connection ──────────
// frameSrc (blob URL) is passed down from Dashboard via useWebSocketStream.

export default function CameraFeed({
  selectedCamera,
  streamActive,
  streamKey,
  frameSrc, // ← blob URL from Dashboard's useWebSocketStream
  wsConnected, // ← boolean from Dashboard's useWebSocketStream
  onStop,
}) {
  const timestamp = useTimestamp();
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const imgRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [rotation, setRotation] = useState(0);
  const dragStart = useRef(null);

  // ── Derive status from props (replaces old useWsStream) ───────────────────
  const status = !streamActive ? "idle" : wsConnected ? "live" : "connecting";
  const feedLoading = streamActive && status === "connecting";
  const feedError = false; // Dashboard auto-reconnects; no persistent error state needed

  // ── Apply frameSrc to img element whenever it changes ────────────────────
  useEffect(() => {
    if (imgRef.current && frameSrc) {
      imgRef.current.src = frameSrc;
    }
  }, [frameSrc]);

  // ── Reset view on stream change ───────────────────────────────────────────
  useEffect(() => {
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
    setRotation(0);
  }, [streamActive, streamKey]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
  }, []);

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimerRef.current);
  }, [showControls]);

  useEffect(() => {
    if (isDragging) {
      setControlsVisible(true);
      clearTimeout(hideTimerRef.current);
    } else {
      showControls();
    }
  }, [isDragging, showControls]);

  function clampTranslate(x, y, z) {
    const c = containerRef.current;
    if (!c) return { x, y };
    const { width, height } = c.getBoundingClientRect();
    return {
      x: Math.max(-(width * (z - 1)) / 2, Math.min((width * (z - 1)) / 2, x)),
      y: Math.max(-(height * (z - 1)) / 2, Math.min((height * (z - 1)) / 2, y)),
    };
  }

  function handleMouseDown(e) {
    if (zoom <= 1 || e.target.closest("[data-controls]")) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    };
  }

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) =>
      setTranslate(
        clampTranslate(
          e.clientX - dragStart.current.x,
          e.clientY - dragStart.current.y,
          zoom,
        ),
      );
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, zoom]);

  function changeZoom(next) {
    setZoom(next);
    setTranslate((t) => clampTranslate(t.x, t.y, next));
  }
  const zoomIn = () =>
    changeZoom(Math.min(3, parseFloat((zoom + 0.25).toFixed(2))));
  const zoomOut = () =>
    changeZoom(Math.max(1, parseFloat((zoom - 0.25).toFixed(2))));
  const zoomReset = () => {
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
  };
  const rotateRight = () => setRotation((r) => (r + 90) % 360);
  const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);

  async function handleStop() {
    try {
      await apiPost("/stop_stream");
      onStop?.();
    } catch (e) {
      alert("Stop failed: " + e.message);
    }
  }

  const canPan = zoom > 1;
  const cursor = canPan ? (isDragging ? "grabbing" : "grab") : "default";

  const mediaStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "fill",
    objectPosition: "center",
    transformOrigin: "center center",
    transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom}) rotate(${rotation}deg)`,
    transition: isDragging ? "none" : "transform 0.2s ease",
    pointerEvents: "none",
    userSelect: "none",
  };

  const fadeStyle = {
    opacity: controlsVisible ? 1 : 0,
    transition: "opacity 0.4s ease",
    pointerEvents: controlsVisible ? "auto" : "none",
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-gray-900"
      style={{ cursor }}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseDown={handleMouseDown}
    >
      {/* Live frame from WS — blob URL set via useEffect */}
      <img
        ref={imgRef}
        alt="Live Stream"
        style={{
          ...mediaStyle,
          zIndex: 10,
          opacity: streamActive && status === "live" ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Loading spinner */}
      {feedLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3">
          <div
            className="w-10 h-10 rounded-full border-4 animate-spin"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              borderTopColor: "white",
            }}
          />
          <span className="text-white/70 text-xs tracking-widest font-mono">
            CONNECTING TO STREAM…
          </span>
        </div>
      )}

      {/* Placeholder when stream inactive */}
      {!streamActive && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
            style={{
              background: "linear-gradient(180deg, transparent, #94a3b8)",
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center pb-16 gap-24 opacity-30">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-gray-300" />
              <div className="w-8 h-20 bg-gray-300 rounded-sm" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-gray-200" />
              <div className="w-8 h-24 bg-gray-200 rounded-sm" />
            </div>
          </div>
        </>
      )}

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
        }}
      />

      {/* CAM label */}
      <div
        className="absolute top-4 left-4 z-30"
        data-controls
        style={fadeStyle}
      >
        <span className="text-white text-sm font-bold tracking-widest drop-shadow-lg">
          {selectedCamera?.label ?? "CAM --"}
        </span>
      </div>

      {/* Top-right controls */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-30"
        data-controls
        style={fadeStyle}
      >
        {streamActive && status === "live" && (
          <span
            className="px-2 py-0.5 rounded text-white text-xs font-black tracking-widest"
            style={{ background: "rgba(239,68,68,0.85)" }}
          >
            LIVE
          </span>
        )}

        {/* Zoom */}
        <div className="flex items-center gap-1">
          {[
            { label: "−", action: zoomOut, disabled: zoom <= 1 },
            {
              label: zoom === 1 ? "1×" : `${zoom}×`,
              action: zoomReset,
              isText: true,
            },
            { label: "+", action: zoomIn, disabled: zoom >= 3 },
          ].map(({ label, action, disabled, isText }) => (
            <button
              key={label}
              onClick={action}
              disabled={disabled}
              className={`${isText ? "px-2 min-w-[40px]" : "w-7"} h-7 rounded-md flex items-center justify-center text-white font-mono text-xs font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30`}
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rotate */}
        {streamActive && (
          <div className="flex items-center gap-1">
            <button
              onClick={rotateLeft}
              title="Rotate left"
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 active:scale-95"
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              ↺
            </button>
            <button
              onClick={rotateRight}
              title="Rotate right"
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold transition-all hover:scale-110 active:scale-95"
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              ↻
            </button>
            {rotation !== 0 && (
              <span
                className="px-2 h-7 flex items-center rounded-md text-white font-mono text-xs"
                style={{
                  background: "rgba(0,133,212,0.6)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {rotation}°
              </span>
            )}
          </div>
        )}

        {streamActive && status === "live" && (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg" />
            <span className="text-white text-sm font-bold tracking-widest">
              REC
            </span>
          </>
        )}
      </div>

      {/* Pan hint */}
      {canPan && !isDragging && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          style={{ ...fadeStyle, pointerEvents: "none" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="white"
            style={{
              opacity: 0.45,
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))",
            }}
          >
            <path d="M9 3v7.27L6.5 7.75 5.08 9.17 9 13.09l.59.58H10v.01l.41.4 3.59 3.59V21h2v-4.34l-3.54-3.54L14 11.46V3H9zm4 0v2h2V3h-2zM7 3v2h2V3H7z" />
          </svg>
        </div>
      )}

      {/* Stop button */}
      {streamActive && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30"
          data-controls
          style={fadeStyle}
        >
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold tracking-wide transition-all hover:scale-105 active:scale-95"
            style={{
              background: "rgba(239,68,68,0.85)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,100,100,0.4)",
              boxShadow: "0 0 16px rgba(239,68,68,0.4)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            STOP STREAM
          </button>
        </div>
      )}

      {/* Bottom info bar */}
      <div
        className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-30"
        data-controls
        style={fadeStyle}
      >
        <span className="text-gray-300 text-xs tracking-wide">
          {streamActive
            ? feedLoading
              ? "Connecting…"
              : "Backend AI Stream"
            : (selectedCamera?.location ?? "")}
        </span>
        <span className="text-white/80 text-xs font-mono tracking-widest">
          {new Date().toLocaleDateString("en-GB").replace(/\//g, ".")} &nbsp;
          {timestamp}
        </span>
      </div>

      {/* Corner brackets */}
      {[
        ["top-3 left-3", "border-t-2 border-l-2"],
        ["top-3 right-3", "border-t-2 border-r-2"],
        ["bottom-3 left-3", "border-b-2 border-l-2"],
        ["bottom-3 right-3", "border-b-2 border-r-2"],
      ].map(([pos, border]) => (
        <div
          key={pos}
          className={`absolute ${pos} w-6 h-6 ${border} border-white/50 z-30`}
          style={fadeStyle}
        />
      ))}
    </div>
  );
}
