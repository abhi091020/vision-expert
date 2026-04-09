import { useState, useEffect, useRef, useCallback } from "react";
import { useTimestamp } from "../../hooks/useDetection";
import { WS_URL, apiPost } from "../../api/client";

function useWsStream(imgRef, active) {
  const wsRef = useRef(null);
  const prevUrlRef = useRef(null);
  const reconnectTimer = useRef(null);
  const [status, setStatus] = useState("idle");

  const cleanup = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    if (imgRef.current) imgRef.current.src = "";
  }, [imgRef]);

  const connect = useCallback(() => {
    cleanup();
    setStatus("connecting");

    const ws = new WebSocket(`${WS_URL}/ws/video`);
    ws.binaryType = "blob";
    wsRef.current = ws;

    ws.onopen = () => setStatus("live");

    ws.onmessage = (e) => {
      if (!(e.data instanceof Blob)) return;
      const url = URL.createObjectURL(e.data);
      if (imgRef.current) imgRef.current.src = url;
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;
    };

    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus("error");
      reconnectTimer.current = setTimeout(() => {
        if (wsRef.current === ws) connect();
      }, 3000);
    };
  }, [cleanup, imgRef]);

  useEffect(() => {
    if (active) {
      connect();
    } else {
      cleanup();
      setStatus("idle");
    }
    return cleanup;
  }, [active, connect, cleanup]);

  return { status, retry: connect };
}

export default function CameraFeed({
  selectedCamera,
  streamActive,
  streamKey,
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

  const { status, retry } = useWsStream(imgRef, streamActive);
  const feedLoading = streamActive && status === "connecting";
  const feedError = streamActive && status === "error";

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
      {/* WebSocket img frame */}
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

      {/* Error state */}
      {feedError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2">
          <span className="text-red-400 text-3xl">⚠️</span>
          <span className="text-white text-sm font-bold tracking-wide">
            Stream unavailable
          </span>
          <span className="text-white/50 text-xs text-center px-4">
            Could not connect to {WS_URL}/ws/video
          </span>
          <button
            onClick={retry}
            className="mt-2 px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-all hover:scale-105"
            style={{ background: "rgba(239,68,68,0.7)" }}
          >
            Retry
          </button>
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

      {/* Scanlines */}
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

      {/* Top right controls */}
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
          <button
            onClick={zoomOut}
            disabled={zoom <= 1}
            className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-base transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            −
          </button>
          <button
            onClick={zoomReset}
            className="px-2 h-7 rounded-md text-white font-mono text-xs transition-all hover:scale-105"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.2)",
              minWidth: 40,
            }}
          >
            {zoom === 1 ? "1×" : `${zoom}×`}
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom >= 3}
            className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-base transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            +
          </button>
        </div>

        {/* Rotate */}
        {streamActive && (
          <div className="flex items-center gap-1">
            <button
              onClick={rotateLeft}
              title="Rotate left 90°"
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
              title="Rotate right 90°"
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

      {/* Bottom info */}
      <div
        className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-30"
        data-controls
        style={fadeStyle}
      >
        <span className="text-gray-300 text-xs tracking-wide">
          {streamActive
            ? feedError
              ? "Stream error"
              : feedLoading
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
      <div
        className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/50 z-30"
        style={fadeStyle}
      />
      <div
        className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/50 z-30"
        style={fadeStyle}
      />
      <div
        className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/50 z-30"
        style={fadeStyle}
      />
      <div
        className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/50 z-30"
        style={fadeStyle}
      />
    </div>
  );
}
