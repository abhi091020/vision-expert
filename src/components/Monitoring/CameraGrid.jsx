import { useState, useEffect, useRef, useMemo } from "react";
import { Camera, X, Play, Square, Trash2, RefreshCw, Copy } from "lucide-react";
import { useCameras } from "../../hooks/useCameras";
import { useClones } from "../../hooks/useClones";
import { useAlerts } from "../../hooks/useAlerts";
import { useDetectionEvents } from "../../hooks/useDetectionEvents";
import { getCameraStreamUrl, getCameraSnapshotUrl } from "../../api/cameras";
import {
  getCloneStreamUrl,
  getCloneSnapshotUrl,
  startClone,
  getCloneStatus,
} from "../../api/clones";
import ConfirmModal from "../shared/ConfirmModal";
import CloneModal from "./CloneModal";
import helmetImg from "../../assets/helmet.png";
import gogglesImg from "../../assets/googles.png";
import armSleevesImg from "../../assets/armsleeces.png";
import handGlovesImg from "../../assets/handgloves.png";
import vestImg from "../../assets/vest.png";
import shoesImg from "../../assets/shoes.png";

const PPE_ITEMS = [
  { id: "helmet", label: "Helmet", img: helmetImg },
  { id: "goggles", label: "Goggles", img: gogglesImg },
  { id: "arm_sleeves", label: "Arm Sleeves", img: armSleevesImg },
  { id: "hand_gloves", label: "Hand Gloves", img: handGlovesImg },
  { id: "vest", label: "Vest", img: vestImg },
  { id: "shoes", label: "Shoes", img: shoesImg },
];

const MODE_MAP = {
  "Animal Detection": "animal",
  "Railway Detection": "railway",
  "Vehicle Detection": "vehicle",
  "Fall Detection": "fall",
};

const MODE_META = {
  fall: { label: "Fall Detection", color: "#f59e0b" },
  animal: { label: "Animal Detection", color: "#10b981" },
  vehicle: { label: "Vehicle Detection", color: "#6366f1" },
  railway: { label: "Railway Detection", color: "#ef4444" },
  fire: { label: "Fire Detection", color: "#ef4444" },
  crowd: { label: "Crowd Monitoring", color: "#0085D4" },
  headcount: { label: "Head Count", color: "#0085D4" },
  secure_area: { label: "Secure Area", color: "#7C3AED" },
};

// Alert blink keyframe — injected once
const BLINK_STYLE_ID = "viq-alert-blink-style";
if (!document.getElementById(BLINK_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = BLINK_STYLE_ID;
  s.textContent = `
    @keyframes viqAlertBlink {
      0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.55), 0 2px 12px rgba(0,0,0,0.08); border-color: #ef4444; }
      50%       { box-shadow: 0 0 0 1px rgba(239,68,68,0.10), 0 2px 12px rgba(0,0,0,0.08); border-color: rgba(239,68,68,0.25); }
    }
  `;
  document.head.appendChild(s);
}

// ─── StreamThumb — snapshot polling (used for BOTH cameras AND clones) ────────
// KEY FIX: backend Dashboard.jsx uses snapshot polling for ALL feeds including
// clones. This is what makes annotated frames appear live.
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
      // Cache-bust so the browser always fetches the latest annotated frame
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
      style={{ opacity: hasFirstFrame ? 1 : 0 }}
    />
  );
}

// ─── PPEPanel ─────────────────────────────────────────────────────────────────
function PPEPanel() {
  return (
    <div
      className="flex-1 p-4 sm:p-5"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <h3
        className="font-poppins text-[14px] sm:text-[15px] font-semibold mb-4"
        style={{ color: "#023350" }}
      >
        PPE Status
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {PPE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl"
            style={{
              border: "2px solid #22c55e",
              background: "#f0fdf4",
              minHeight: "110px",
            }}
          >
            <img
              src={item.img}
              alt={item.label}
              className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
            />
            <span
              className="font-poppins text-[11px] sm:text-[13px] font-medium text-center leading-tight"
              style={{ color: "#15803d" }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-4 p-2.5 rounded-lg text-center font-poppins text-[12px] sm:text-[13px] font-semibold"
        style={{
          background: "#f0fdf4",
          color: "#22c55e",
          border: "1px solid #86efac",
        }}
      >
        ✅ All PPE Compliant
      </div>
    </div>
  );
}

// ─── CrowdPanel ───────────────────────────────────────────────────────────────
// Polls /api/clones/{id}/status every 2s for crowd stats.
// Shows snapshot image from latest_payload.image (updates with each poll).
function CrowdPanel({ clone }) {
  const [crowdData, setCrowdData] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (!clone?.id) return;

    async function poll() {
      try {
        const res = await getCloneStatus(clone.id);
        const payload = res?.latest_payload;
        if (payload?.crowd_alert) {
          setCrowdData(payload.crowd_alert);
        }
        if (payload?.image) {
          setImgSrc(`data:image/jpeg;base64,${payload.image}`);
        }
      } catch (_) {}
    }

    // Use initial data from clone prop while waiting for first poll
    const initPayload = clone?.latest_payload;
    if (initPayload?.crowd_alert) setCrowdData(initPayload.crowd_alert);
    if (initPayload?.image)
      setImgSrc(`data:image/jpeg;base64,${initPayload.image}`);

    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [clone?.id]);

  const count = crowdData?.person_count ?? 0;
  const limit = crowdData?.crowd_limit ?? 10;
  const alert = crowdData?.confirmed === true && crowdData?.active === true;
  const pct = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;

  return (
    <div
      className="flex-1 p-4 sm:p-5"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <h3
        className="font-poppins text-[14px] sm:text-[15px] font-semibold mb-4"
        style={{ color: "#023350" }}
      >
        Crowd Status
      </h3>

      <div className="flex items-center gap-6 mb-4">
        {/* Current count */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Current
          </span>
          <span
            className="text-5xl font-black"
            style={{ color: alert ? "#ef4444" : "#0085D4" }}
          >
            {count}
          </span>
          <span className="text-xs text-gray-400">people</span>
        </div>

        <div className="w-px h-16 bg-gray-200" />

        {/* Limit */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Limit
          </span>
          <span className="text-5xl font-black text-gray-500">{limit}</span>
          <span className="text-xs text-gray-400">max</span>
        </div>

        <div className="w-px h-16 bg-gray-200" />

        {/* Progress bar */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Occupancy</span>
            <span style={{ color: alert ? "#ef4444" : "#0085D4" }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: alert
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : "linear-gradient(90deg,#0085D4,#024167)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div
        className="p-2.5 rounded-lg text-center font-poppins text-[13px] font-semibold"
        style={
          alert
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
        {alert ? `🚨 Overcrowded! (${count} / ${limit})` : "✅ Normal"}
      </div>

      {/* Latest annotated snapshot */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Crowd snapshot"
          className="mt-3 w-full rounded-xl object-cover"
          style={{ maxHeight: 160 }}
        />
      )}
    </div>
  );
}

// ─── DetectionEventsPanel ─────────────────────────────────────────────────────
function DetectionEventsPanel({ mode }) {
  const { events, loading } = useDetectionEvents(mode, true);
  const meta = MODE_META[mode] ?? { label: mode, color: "#0085D4" };

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <div className="px-4 sm:px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
        <h3
          className="font-poppins text-[14px] sm:text-[15px] font-semibold"
          style={{ color: "#023350" }}
        >
          {meta.label} Events
        </h3>
        {loading && (
          <RefreshCw
            size={13}
            className="animate-spin"
            style={{ color: meta.color }}
          />
        )}
        <span
          className="font-poppins text-[11px] px-2 py-0.5 rounded-full text-white font-bold"
          style={{ background: meta.color }}
        >
          {events.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4 flex flex-col gap-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <span className="text-2xl mb-1">📋</span>
            <span className="font-poppins text-[12px]">No events yet</span>
          </div>
        ) : (
          events.map((ev, i) => (
            <EventCard
              key={ev.id ?? ev.event_id ?? i}
              event={ev}
              color={meta.color}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, color }) {
  const [expanded, setExpanded] = useState(false);
  const time = event.timestamp ?? event.created_at ?? event.time ?? null;
  const label =
    event.label ?? event.animal ?? event.type ?? event.event_type ?? "Event";
  const confidence =
    event.confidence != null ? `${(event.confidence * 100).toFixed(1)}%` : null;
  const camId = event.camera_id ?? event.cam_id ?? null;
  const imgData = event.image ?? event.annotated ?? null;
  const imgSrc = imgData
    ? imgData.startsWith("data:")
      ? imgData
      : `data:image/jpeg;base64,${imgData}`
    : null;

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2 flex-shrink-0"
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span
            className="font-poppins text-[12px] font-semibold truncate"
            style={{ color: "#023350" }}
          >
            {String(label).toUpperCase()}
          </span>
          {confidence && (
            <span className="font-poppins text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {confidence}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {camId && (
            <span className="font-poppins text-[10px] text-gray-400">
              CAM {camId}
            </span>
          )}
          {time && (
            <span className="font-poppins text-[10px] text-gray-400 font-mono">
              {new Date(time).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      {imgSrc && (
        <img
          src={imgSrc}
          alt="detection"
          className="w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxHeight: "120px" }}
          onClick={() => setExpanded((p) => !p)}
        />
      )}
      {expanded && imgSrc && (
        <img
          src={imgSrc}
          alt="full"
          className="w-full rounded-lg object-cover"
        />
      )}
    </div>
  );
}

// ─── RightPanel ───────────────────────────────────────────────────────────────
function RightPanel({ mode, clone }) {
  if (!mode || mode === "ppe") return <PPEPanel />;
  if (mode === "crowd") return <CrowdPanel clone={clone} />;
  return <DetectionEventsPanel mode={mode} />;
}

// ─── CameraCard ───────────────────────────────────────────────────────────────
function CameraCard({
  cam,
  camIndex,
  onClick,
  selected,
  onStart,
  onStop,
  onDeleteRequest,
  onCloneRequest,
  actionLoading,
}) {
  const isRunning = cam.running ?? cam.status === "running";
  return (
    <div
      onClick={() => onClick(cam.id)}
      className="bg-white rounded-2xl cursor-pointer transition-all hover:shadow-lg p-3 flex flex-col h-full"
      style={{
        border: `1.5px solid ${selected ? "#0085D4" : "rgba(0,0,0,0.10)"}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-2 flex-shrink-0 px-0.5">
        <span
          className="font-poppins text-[13px] font-semibold truncate"
          style={{ color: "#023350" }}
        >
          {cam.name ?? `CAM ${camIndex + 1}`}
        </span>
        {isRunning && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold font-poppins flex-shrink-0 ml-2"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
            REC
          </span>
        )}
      </div>
      <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden flex-1 min-h-[25vh]">
        <StreamThumb
          isRunning={isRunning}
          snapshotUrl={getCameraSnapshotUrl(cam.id)}
          alt={cam.name}
          startDelay={camIndex * 400}
        />
        {!isRunning && (
          <div className="flex flex-col items-center justify-center gap-2 opacity-30">
            <Camera size={24} className="text-white" />
            <span className="text-white text-[11px] font-poppins">Stopped</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 flex-shrink-0">
        <div className="min-w-0">
          <p
            className="font-poppins text-[12px] sm:text-[13px] font-medium truncate"
            style={{ color: "#023350" }}
          >
            ID: <span style={{ color: "#0085D4" }}>{cam.id}</span>
          </p>
          <p
            className="font-poppins text-[11px] sm:text-[12px] font-medium mt-1 truncate"
            style={{ color: "#023350" }}
          >
            Type:{" "}
            <span className="font-normal" style={{ color: "#4A4A4A" }}>
              {cam.source_type ?? "—"}
            </span>
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 flex-shrink-0 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => (isRunning ? onStop(cam.id) : onStart(cam.id))}
            disabled={actionLoading.has(cam.id)}
            title={isRunning ? "Stop camera" : "Start camera"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
            style={{ background: isRunning ? "#ef4444" : "#22c55e" }}
          >
            {actionLoading.has(cam.id) ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : isRunning ? (
              <Square size={12} />
            ) : (
              <Play size={12} />
            )}
          </button>
          <button
            onClick={() => onCloneRequest(cam)}
            title="Clone camera"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            style={{ background: "#0085D4" }}
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => onDeleteRequest(cam)}
            title="Delete camera"
            className="w-7 h-7 flex items-center justify-center hover:opacity-70"
          >
            <Trash2 size={13} style={{ color: "#ef4444" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CloneCard ────────────────────────────────────────────────────────────────
function CloneCard({
  clone,
  cloneIndex,
  onClick,
  selected,
  onStart,
  onStop,
  onDeleteRequest,
  actionLoading,
  hasAlert,
  alertTime,
}) {
  const isRunning = clone.running ?? clone.status === "running";
  const modeLabel = clone.name ?? "Clone";

  // Crowd alert from latest_payload (stored by useClones every 5s poll)
  const crowdAlert =
    clone.mode === "crowd" ? clone.latest_payload?.crowd_alert : null;
  const isCrowdAlert =
    crowdAlert?.confirmed === true && crowdAlert?.active === true;

  const showAlertBorder = hasAlert || isCrowdAlert;

  const cardStyle = showAlertBorder
    ? {
        border: "2px solid #ef4444",
        boxShadow:
          "0 0 0 3px rgba(239,68,68,0.55), 0 2px 12px rgba(0,0,0,0.08)",
        animation: "viqAlertBlink 1s ease-in-out infinite",
      }
    : {
        border: `1.5px solid ${selected ? "#7C3AED" : "rgba(0,0,0,0.10)"}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      };

  return (
    <div
      onClick={() => onClick(clone.id)}
      className="bg-white rounded-2xl cursor-pointer transition-all hover:shadow-lg p-3 flex flex-col h-full"
      style={cardStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0 px-0.5 gap-1">
        <span
          className="font-poppins text-[13px] font-semibold truncate"
          style={{ color: "#023350" }}
        >
          {clone.name ?? "Clone"}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showAlertBorder && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[9px] font-bold font-poppins"
              style={{ background: "#ef4444" }}
            >
              🚨 ALERT
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded-full text-white text-[9px] font-bold font-poppins"
            style={{ background: "#7C3AED" }}
          >
            {modeLabel}
          </span>
          {isRunning && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold font-poppins"
              style={{ background: "rgba(194,24,7,0.85)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
              REC
            </span>
          )}
        </div>
      </div>

      {/* Video area
          KEY FIX: Use StreamThumb with getCloneSnapshotUrl — this is exactly how
          the backend Dashboard.jsx shows clone feeds. The snapshot endpoint on the
          main backend returns the latest annotated frame from the analytics WebSocket.
          Do NOT use latest_payload.image here — it is stale (only updated each poll).
      */}
      <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden flex-1 min-h-[25vh]">
        <StreamThumb
          isRunning={isRunning}
          snapshotUrl={getCloneSnapshotUrl(clone.id)}
          alt={clone.name}
          startDelay={cloneIndex * 400}
        />
        {!isRunning && (
          <div className="flex flex-col items-center justify-center gap-2 opacity-30">
            <Camera size={24} className="text-white" />
            <span className="text-white text-[11px] font-poppins">Stopped</span>
          </div>
        )}

        {/* CLONE badge */}
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold font-poppins"
          style={{ background: "rgba(124,58,237,0.75)", color: "#fff" }}
        >
          CLONE
        </div>

        {/* Crowd alert banner */}
        {isCrowdAlert && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center py-1.5 font-poppins text-[10px] font-bold text-white text-center px-2"
            style={{ background: "rgba(239,68,68,0.92)" }}
          >
            🚨 CRITICAL: CROWD ALERT! {crowdAlert.person_count} PEOPLE DETECTED
            (LIMIT: {crowdAlert.crowd_limit})
          </div>
        )}

        {/* Generic alert for non-crowd modes */}
        {hasAlert && !isCrowdAlert && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 font-poppins text-[11px] font-bold text-white"
            style={{ background: "rgba(239,68,68,0.82)" }}
          >
            🚨 Detection Alert
            {alertTime && (
              <span className="font-normal opacity-80">
                · {new Date(alertTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 flex-shrink-0">
        <div className="min-w-0">
          <p
            className="font-poppins text-[12px] font-medium truncate"
            style={{ color: "#023350" }}
          >
            ID: <span style={{ color: "#7C3AED" }}>{clone.id}</span>
          </p>
          <p
            className="font-poppins text-[11px] font-medium mt-1 truncate"
            style={{ color: "#023350" }}
          >
            Mode:{" "}
            <span className="font-normal" style={{ color: "#4A4A4A" }}>
              {modeLabel}
            </span>
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 flex-shrink-0 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => (isRunning ? onStop(clone.id) : onStart(clone.id))}
            disabled={actionLoading.has(clone.id)}
            title={isRunning ? "Stop clone" : "Start clone"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
            style={{ background: isRunning ? "#ef4444" : "#22c55e" }}
          >
            {actionLoading.has(clone.id) ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : isRunning ? (
              <Square size={12} />
            ) : (
              <Play size={12} />
            )}
          </button>
          <button
            onClick={() => onDeleteRequest(clone)}
            title="Delete clone"
            className="w-7 h-7 flex items-center justify-center hover:opacity-70"
          >
            <Trash2 size={13} style={{ color: "#ef4444" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CameraGrid ───────────────────────────────────────────────────────────────
export default function CameraGrid({
  onRefetchReady,
  onClonesChange,
  selectedMode,
}) {
  const {
    cameras,
    loading: camLoading,
    error: camError,
    refetch: refetchCameras,
    handleStart: handleCamStart,
    handleStop: handleCamStop,
    handleDelete: handleCamDelete,
  } = useCameras(5000);

  const {
    clones,
    refetch: refetchClones,
    handleStart: handleCloneStart,
    handleStop: handleCloneStop,
    handleDelete: handleCloneDelete,
  } = useClones(5000);

  const { alerts } = useAlerts({}, 5000);

  const alertMap = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      if (a.acknowledged) return;
      const cloneId = String(a.camera_id ?? a.camId ?? "");
      if (!cloneId) return;
      const ts = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (!map[cloneId] || ts > map[cloneId]) map[cloneId] = ts;
    });
    return map;
  }, [alerts]);

  const sortedClones = useMemo(() => {
    const withAlert = [];
    const withoutAlert = [];
    clones.forEach((c) => {
      if (alertMap[String(c.id)] !== undefined) withAlert.push(c);
      else withoutAlert.push(c);
    });
    withAlert.sort(
      (a, b) => (alertMap[String(b.id)] ?? 0) - (alertMap[String(a.id)] ?? 0),
    );
    return [...withAlert, ...withoutAlert];
  }, [clones, alertMap]);

  useEffect(() => {
    onClonesChange?.(clones.length);
  }, [clones.length, onClonesChange]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const selectedCam =
    selectedType === "camera"
      ? (cameras.find((c) => c.id === selectedId) ?? null)
      : null;
  const selectedClone =
    selectedType === "clone"
      ? (clones.find((c) => c.id === selectedId) ?? null)
      : null;

  const detailPanelRef = useRef(null);

  useEffect(() => {
    if (!selectedMode) return;
    const modeId = MODE_MAP[selectedMode];
    if (!modeId) return;
    const matchingClone = clones.find((c) => {
      const isRunning = c.running ?? c.status === "running";
      const nameMatch =
        c.mode === modeId ||
        c.name?.toLowerCase().includes(modeId.replace(/_/g, " ")) ||
        c.name?.toLowerCase().includes(modeId);
      return isRunning && nameMatch;
    });
    if (matchingClone) {
      setSelectedId(matchingClone.id);
      setSelectedType("clone");
      return;
    }
    const anyClone = clones.find((c) => c.running ?? c.status === "running");
    if (anyClone) {
      setSelectedId(anyClone.id);
      setSelectedType("clone");
      return;
    }
    const anyCamera = cameras.find((c) => c.running ?? c.status === "running");
    if (anyCamera) {
      setSelectedId(anyCamera.id);
      setSelectedType("camera");
    }
  }, [selectedMode, clones, cameras]);

  useEffect(() => {
    if ((selectedCam || selectedClone) && detailPanelRef.current) {
      detailPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedId]);

  const [camActionLoading, setCamActionLoading] = useState(new Set());
  const [cloneActionLoading, setCloneActionLoading] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [cloneSource, setCloneSource] = useState(null);

  useEffect(() => {
    onRefetchReady?.(refetchCameras);
  }, [refetchCameras, onRefetchReady]);

  function addCamLoading(id) {
    setCamActionLoading((p) => new Set(p).add(id));
  }
  function removeCamLoading(id) {
    setCamActionLoading((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
  }

  async function doStart(id) {
    addCamLoading(id);
    try {
      await handleCamStart(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCamLoading(id);
    }
  }
  async function doStop(id) {
    addCamLoading(id);
    try {
      await handleCamStop(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCamLoading(id);
    }
  }

  function addCloneLoading(id) {
    setCloneActionLoading((p) => new Set(p).add(id));
  }
  function removeCloneLoading(id) {
    setCloneActionLoading((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
  }

  async function doCloneStart(id) {
    addCloneLoading(id);
    try {
      await handleCloneStart(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCloneLoading(id);
    }
  }
  async function doCloneStop(id) {
    addCloneLoading(id);
    try {
      await handleCloneStop(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCloneLoading(id);
    }
  }

  function requestDelete(item, type) {
    setDeleteTarget({ item, type });
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const { item, type } = deleteTarget;
    try {
      if (selectedId === item.id) {
        setSelectedId(null);
        setSelectedType(null);
      }
      if (type === "camera") await handleCamDelete(item.id);
      else await handleCloneDelete(item.id);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  async function onCloneCreated(clone) {
    setCloneSource(null);
    if (clone?.id) {
      try {
        await startClone(clone.id);
      } catch (e) {
        console.error("Auto-start failed:", e.message);
      }
    }
    await refetchClones();
  }

  if (camLoading && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RefreshCw size={28} className="animate-spin" />
          <p className="font-poppins text-sm">Loading cameras…</p>
        </div>
      </div>
    );
  }
  if (camError && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-3xl">⚠️</span>
          <p className="font-poppins text-sm text-red-400">{camError}</p>
        </div>
      </div>
    );
  }
  if (!camLoading && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Camera size={36} className="opacity-30" />
          <p className="font-poppins text-sm">No cameras added yet</p>
          <p className="font-poppins text-xs">
            Click "Add Camera" to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 pb-2">
      {cloneSource && (
        <CloneModal
          cam={cloneSource}
          onClose={() => setCloneSource(null)}
          onCreated={onCloneCreated}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "clone" ? "Clone" : "Camera"}`}
        message={`Remove "${deleteTarget?.item?.name ?? deleteTarget?.item?.id}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      {deleteError && (
        <div className="rounded-lg px-4 py-2 font-poppins text-[12px] text-red-500 bg-red-50 border border-red-200">
          ⚠️ {deleteError}
        </div>
      )}

      {/* Camera detail panel */}
      {selectedCam && (
        <div
          ref={detailPanelRef}
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-[55%] flex-shrink-0">
              <div className="p-3 sm:p-4">
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video">
                  <img
                    key={selectedCam.id}
                    src={getCameraStreamUrl(selectedCam.id)}
                    alt="Live stream"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.opacity = "0";
                    }}
                  />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded text-white text-sm font-medium font-poppins"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {selectedCam.name ?? selectedCam.id}
                  </div>
                  {(selectedCam.running ??
                    selectedCam.status === "running") && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-sm font-bold flex items-center gap-1 font-poppins"
                      style={{ background: "rgba(194,24,7,0.85)" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
                      LIVE
                    </div>
                  )}
                </div>
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3"
                style={{ borderTop: "1px solid #E8EFF5" }}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Camera ID:{" "}
                    <span style={{ color: "#0085D4" }}>{selectedCam.id}</span>
                  </p>
                  {selectedCam.source_type && (
                    <>
                      <span className="hidden sm:block text-gray-300">|</span>
                      <p
                        className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                        style={{ color: "#023350" }}
                      >
                        Type:{" "}
                        <span
                          className="font-normal"
                          style={{ color: "#4A4A4A" }}
                        >
                          {selectedCam.source_type}
                        </span>
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedType(null);
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
                    style={{ background: "#ef4444" }}
                  >
                    <X size={16} color="#ffffff" />
                  </button>
                </div>
              </div>
            </div>
            <PPEPanel />
          </div>
        </div>
      )}

      {/* Clone detail panel */}
      {selectedClone && (
        <div
          ref={detailPanelRef}
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(124,58,237,0.20)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-[55%] flex-shrink-0">
              <div className="p-3 sm:p-4">
                {/* KEY FIX: snapshot polling for detail panel too — same as backend Dashboard */}
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video">
                  <StreamThumb
                    isRunning={
                      selectedClone.running ??
                      selectedClone.status === "running"
                    }
                    snapshotUrl={getCloneSnapshotUrl(selectedClone.id)}
                    alt={selectedClone.name}
                    startDelay={0}
                  />
                  {!(
                    selectedClone.running ?? selectedClone.status === "running"
                  ) && (
                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                      <Camera size={32} className="text-white" />
                      <span className="text-white text-sm font-poppins">
                        Stopped
                      </span>
                    </div>
                  )}

                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded text-white text-sm font-medium font-poppins"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {selectedClone.name ?? selectedClone.id}
                  </div>
                  <div
                    className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold font-poppins"
                    style={{
                      background: "rgba(124,58,237,0.75)",
                      color: "#fff",
                    }}
                  >
                    CLONE
                  </div>

                  {/* Crowd alert banner in detail panel */}
                  {selectedClone.mode === "crowd" &&
                    selectedClone.latest_payload?.crowd_alert?.confirmed &&
                    selectedClone.latest_payload?.crowd_alert?.active && (
                      <div
                        className="absolute top-0 left-0 right-0 flex items-center justify-center py-1.5 font-poppins text-[12px] font-bold text-white text-center px-2"
                        style={{ background: "rgba(239,68,68,0.92)" }}
                      >
                        🚨 CRITICAL: CROWD ALERT!{" "}
                        {selectedClone.latest_payload.crowd_alert.person_count}{" "}
                        PEOPLE DETECTED (LIMIT:{" "}
                        {selectedClone.latest_payload.crowd_alert.crowd_limit})
                      </div>
                    )}

                  {(selectedClone.running ??
                    selectedClone.status === "running") && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-sm font-bold flex items-center gap-1 font-poppins"
                      style={{ background: "rgba(194,24,7,0.85)" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
                      LIVE
                    </div>
                  )}
                </div>
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3"
                style={{ borderTop: "1px solid #E8EFF5" }}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Clone ID:{" "}
                    <span style={{ color: "#7C3AED" }}>{selectedClone.id}</span>
                  </p>
                  <span className="hidden sm:block text-gray-300">|</span>
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Mode:{" "}
                    <span className="font-normal" style={{ color: "#4A4A4A" }}>
                      {selectedClone.name ?? "—"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedType(null);
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
                    style={{ background: "#ef4444" }}
                  >
                    <X size={16} color="#ffffff" />
                  </button>
                </div>
              </div>
            </div>
            {/* Pass full clone so CrowdPanel can poll its ID */}
            <RightPanel mode={selectedClone.mode} clone={selectedClone} />
          </div>
        </div>
      )}

      {/* Cameras section */}
      {cameras.length > 0 && (
        <div>
          <p className="font-poppins text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-0.5">
            Cameras
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cameras.map((cam, i) => (
              <CameraCard
                key={cam.id}
                cam={cam}
                camIndex={i}
                onClick={(id) => {
                  setSelectedId(id);
                  setSelectedType("camera");
                }}
                selected={selectedType === "camera" && selectedId === cam.id}
                onStart={doStart}
                onStop={doStop}
                onDeleteRequest={(c) => requestDelete(c, "camera")}
                onCloneRequest={setCloneSource}
                actionLoading={camActionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clones section */}
      {sortedClones.length > 0 && (
        <div>
          <p className="font-poppins text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-0.5">
            Clones
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedClones.map((clone, i) => {
              const alertTs = alertMap[String(clone.id)];
              return (
                <CloneCard
                  key={clone.id}
                  clone={clone}
                  cloneIndex={i}
                  onClick={(id) => {
                    setSelectedId(id);
                    setSelectedType("clone");
                  }}
                  selected={selectedType === "clone" && selectedId === clone.id}
                  onStart={doCloneStart}
                  onStop={doCloneStop}
                  onDeleteRequest={(c) => requestDelete(c, "clone")}
                  actionLoading={cloneActionLoading}
                  hasAlert={alertTs !== undefined}
                  alertTime={alertTs ? new Date(alertTs).toISOString() : null}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
