import { useState, useEffect, useRef } from "react";
import { Camera, X, RefreshCw, Users } from "lucide-react";
import {
  useCrowdClones,
  useCrowdCloneStatus,
} from "../../hooks/useCrowdCameras";
import { useCameras } from "../../hooks/useCameras";
import { getCloneStreamUrl, getCloneSnapshotUrl } from "../../api/clones";
import { getCameraSnapshotUrl } from "../../api/cameras";

// ─── Inject alert blink keyframe once ────────────────────────────────────────
const BLINK_ID = "crowd-alert-blink-style";
if (!document.getElementById(BLINK_ID)) {
  const s = document.createElement("style");
  s.id = BLINK_ID;
  s.textContent = `
    @keyframes crowdAlertBlink {
      0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.55); border-color: #ef4444; }
      50%       { box-shadow: 0 0 0 1px rgba(239,68,68,0.10); border-color: rgba(239,68,68,0.25); }
    }
  `;
  document.head.appendChild(s);
}

// ─── StreamThumb ──────────────────────────────────────────────────────────────
// Snapshot polling — fetches latest annotated frame every ~1s.
// Used for camera thumbnails in the bottom grid.
function StreamThumb({ snapshotUrl, isRunning, alt, startDelay = 0 }) {
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!isRunning) {
      setHasFirstFrame(false);
      if (imgRef.current) imgRef.current.src = "";
      return;
    }
    function loadNext() {
      const url = `${snapshotUrl}?t=${Date.now()}`;
      const fetchStart = Date.now();
      const img = new Image();
      img.onload = () => {
        if (!mountedRef.current) return;
        if (imgRef.current) imgRef.current.src = url;
        setHasFirstFrame(true);
        const elapsed = Date.now() - fetchStart;
        timerRef.current = setTimeout(loadNext, Math.max(800, 1200 - elapsed));
      };
      img.onerror = () => {
        if (!mountedRef.current) return;
        timerRef.current = setTimeout(loadNext, 2000);
      };
      img.src = url;
    }
    timerRef.current = setTimeout(loadNext, startDelay);
    return () => clearTimeout(timerRef.current);
  }, [isRunning, snapshotUrl, startDelay]);

  if (!isRunning) return null;
  return (
    <img
      ref={imgRef}
      alt={alt}
      className="w-full h-full object-cover"
      style={{ opacity: hasFirstFrame ? 1 : 0, transition: "opacity 0.3s" }}
    />
  );
}

// ─── CrowdStatusPanel ─────────────────────────────────────────────────────────
// Right-side panel: Current count, Limit, Occupancy bar, status badge, snapshot.
function CrowdStatusPanel({ crowdData, imgSrc, loading }) {
  const count = crowdData?.person_count ?? 0;
  const limit = crowdData?.crowd_limit ?? 0;
  const isAlert = crowdData?.confirmed === true && crowdData?.active === true;
  const pct = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;

  return (
    <div
      className="w-full lg:w-[40%] flex-shrink-0 flex flex-col gap-5 p-4 sm:p-5"
      style={{ borderLeft: "1px solid #E8EFF5" }}
    >
      <h3
        className="font-poppins text-[15px] font-semibold"
        style={{ color: "#023350" }}
      >
        Crowd Status
      </h3>

      {/* Current / Limit / Occupancy row */}
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
        {/* Current count */}
        <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
            CURRENT
          </span>
          <span
            className="text-5xl font-black font-poppins leading-none"
            style={{ color: isAlert ? "#ef4444" : "#0085D4" }}
          >
            {count}
          </span>
          <span className="text-xs text-gray-400 font-poppins">people</span>
        </div>

        <div className="w-px h-14 bg-gray-200 hidden sm:block" />

        {/* Limit */}
        <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
            LIMIT
          </span>
          <span className="text-5xl font-black text-gray-500 font-poppins leading-none">
            {limit}
          </span>
          <span className="text-xs text-gray-400 font-poppins">max</span>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-bold font-poppins text-gray-400">
          <span>Occupancy</span>
          <span style={{ color: isAlert ? "#ef4444" : "#0085D4" }}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isAlert
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : "linear-gradient(90deg, #0085D4, #024167)",
            }}
          />
        </div>
      </div>

      {/* Status badge */}
      <div
        className="py-2.5 rounded-xl text-center font-poppins text-[13px] font-semibold"
        style={
          isAlert
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
        {loading
          ? "Loading…"
          : isAlert
            ? `🚨 Overcrowded! (${count} / ${limit})`
            : "✅ Normal"}
      </div>

      {/* Latest annotated snapshot from backend */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Crowd snapshot"
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: 200 }}
        />
      )}
    </div>
  );
}

// ─── Crowd ────────────────────────────────────────────────────────────────────
export default function Crowd({ active = true }) {
  const { clones, loading: clonesLoading, refetch } = useCrowdClones(4000);
  const { cameras } = useCameras(5000);
  const [selectedCloneId, setSelectedCloneId] = useState(null);

  // Auto-select first running crowd clone — happens only once
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current || clones.length === 0) return;
    const running = clones.find((c) => c.running ?? c.status === "running");
    const pick = running ?? clones[0];
    if (pick) {
      setSelectedCloneId(pick.id);
      hasAutoSelected.current = true;
    }
  }, [clones]);

  const selectedClone = clones.find((c) => c.id === selectedCloneId) ?? null;
  const isRunning = !!(
    selectedClone?.running ?? selectedClone?.status === "running"
  );

  // Poll status only when active + a clone is selected
  const {
    crowdData,
    imgSrc,
    loading: statusLoading,
  } = useCrowdCloneStatus(
    active && selectedCloneId ? selectedCloneId : null,
    2000,
  );

  const isAlert = crowdData?.confirmed === true && crowdData?.active === true;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (clonesLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-gray-400">
        <RefreshCw size={20} className="animate-spin" />
        <span className="font-poppins text-sm">Loading crowd detection…</span>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (clones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <Users size={56} className="opacity-20" />
        <div className="text-center">
          <p className="font-poppins text-base font-semibold text-gray-500">
            No Crowd Detection Running
          </p>
          <p className="font-poppins text-sm text-gray-400 mt-1.5 max-w-xs leading-relaxed">
            Go to <strong className="text-gray-500">Monitoring</strong> → select
            a camera → Clone with mode{" "}
            <strong className="text-gray-500">"crowd"</strong> to start
            detection.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-poppins font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #0085D4, #024167)" }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* ── Clone detail panel ───────────────────────────────────────────────── */}
      {selectedClone ? (
        <div
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: "#ffffff",
            border: isAlert
              ? "2px solid #ef4444"
              : "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            animation: isAlert
              ? "crowdAlertBlink 1s ease-in-out infinite"
              : "none",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            {/* LEFT — Live MJPEG stream (backend annotates COUNT/LIMIT overlay) */}
            <div className="w-full lg:w-[60%] flex-shrink-0 flex flex-col">
              <div className="p-3 sm:p-4">
                <div
                  className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  {isRunning ? (
                    <img
                      key={selectedClone.id}
                      src={getCloneStreamUrl(selectedClone.id)}
                      alt="Crowd live stream"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.opacity = "0";
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                      <Camera size={40} className="text-white" />
                      <span className="text-white text-sm font-poppins">
                        Stopped
                      </span>
                    </div>
                  )}

                  {/* Crowd alert banner (overlaid on stream) */}
                  {isAlert && (
                    <div
                      className="absolute top-0 left-0 right-0 py-1.5 text-center font-poppins text-[12px] font-bold text-white"
                      style={{ background: "rgba(239,68,68,0.92)" }}
                    >
                      🚨 CROWD ALERT — {crowdData?.person_count} PEOPLE (LIMIT:{" "}
                      {crowdData?.crowd_limit})
                    </div>
                  )}

                  {/* LIVE badge */}
                  {isRunning && (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded font-poppins text-white text-sm font-bold"
                      style={{ background: "rgba(194,24,7,0.85)" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  )}

                  {/* CLONE badge */}
                  <div
                    className="absolute bottom-3 left-3 px-2 py-0.5 rounded font-poppins text-[9px] font-bold"
                    style={{
                      background: "rgba(0,133,212,0.75)",
                      color: "#fff",
                    }}
                  >
                    CLONE
                  </div>
                </div>
              </div>

              {/* Clone info bar */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3"
                style={{ borderTop: "1px solid #E8EFF5" }}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Clone ID:{" "}
                    <span style={{ color: "#0085D4" }}>{selectedClone.id}</span>
                  </p>
                  <span className="hidden sm:block text-gray-300">|</span>
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Mode:{" "}
                    <span className="font-normal" style={{ color: "#4A4A4A" }}>
                      {selectedClone.mode ?? "crowd"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCloneId(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90 flex-shrink-0"
                  style={{ background: "#ef4444" }}
                >
                  <X size={16} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* RIGHT — Crowd status panel */}
            <CrowdStatusPanel
              crowdData={crowdData}
              imgSrc={imgSrc}
              loading={statusLoading}
            />
          </div>
        </div>
      ) : (
        /* Clone selector — shown after user dismisses with X */
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400 bg-white rounded-2xl border border-black/10">
          <Users size={36} className="opacity-30" />
          <p className="font-poppins text-sm">Select a crowd clone to view</p>
          <div className="flex flex-wrap gap-2 justify-center px-4">
            {clones.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCloneId(c.id)}
                className="px-4 py-2 rounded-xl text-sm font-poppins font-semibold text-white hover:opacity-90 transition-opacity"
                style={{
                  background: "linear-gradient(135deg, #0085D4, #024167)",
                }}
              >
                {c.name ?? c.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Cameras grid ─────────────────────────────────────────────────────── */}
      {cameras.length > 0 && (
        <div className="flex-shrink-0">
          <p className="font-poppins text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-0.5">
            Cameras
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cameras.map((cam, i) => {
              const camRunning = cam.running ?? cam.status === "running";
              return (
                <div
                  key={cam.id}
                  className="bg-white rounded-2xl p-3 flex flex-col gap-2"
                  style={{
                    border: "1.5px solid rgba(0,0,0,0.10)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-poppins text-[13px] font-semibold truncate"
                      style={{ color: "#023350" }}
                    >
                      {cam.name ?? `Cam ${i + 1}`}
                    </span>
                    {camRunning && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold font-poppins flex-shrink-0 ml-2"
                        style={{ background: "rgba(194,24,7,0.85)" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        REC
                      </span>
                    )}
                  </div>
                  <div
                    className="relative w-full bg-[#0f172a] rounded-xl overflow-hidden"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <StreamThumb
                      isRunning={camRunning}
                      snapshotUrl={getCameraSnapshotUrl(cam.id)}
                      alt={cam.name ?? `Cam ${i + 1}`}
                      startDelay={i * 300}
                    />
                    {!camRunning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-30">
                        <Camera size={20} className="text-white" />
                        <span className="text-white text-[11px] font-poppins">
                          Stopped
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
