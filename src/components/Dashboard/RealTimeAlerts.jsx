import { useState, useMemo } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { getCameraStreamUrl, getCameraSnapshotUrl } from "../../api/cameras";
import { getCloneStreamUrl, getCloneSnapshotUrl } from "../../api/clones";
import { useCameras } from "../../hooks/useCameras";
import { useClones } from "../../hooks/useClones";

/**
 * LiveCamera
 *
 * Feed priority:
 *   1. selectedAlert  → clone stream  (alert.camId is a clone ID)
 *   2. selectedCamera → camera stream (selectedCamera.id)
 *   3. Auto           → first running clone, else first running camera
 *
 * "Running" is detected via: c.running || c.status === "running" || c.enabled
 * (Backend returns `enabled: true` instead of a `running` field)
 */
export default function LiveCamera({ selectedAlert, selectedCamera }) {
  const [streamError, setStreamError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { cameras } = useCameras();
  const { clones } = useClones();

  // ── Helper: treat enabled/running/status cameras as "active" ───────────────
  function isActive(c) {
    return !!(c.running || c.status === "running" || c.enabled);
  }

  // ── Resolve which feed to show ──────────────────────────────────────────────
  const feedSource = useMemo(() => {
    // 1. Alert selected → always a clone
    if (selectedAlert?.camId && selectedAlert.camId !== "—") {
      return {
        id: selectedAlert.camId,
        type: "clone",
        label: `Clone ${selectedAlert.camId}`,
      };
    }

    // 2. Camera explicitly selected
    if (selectedCamera?.id) {
      return {
        id: selectedCamera.id,
        type: "camera",
        label: selectedCamera.name ?? `Camera ${selectedCamera.id}`,
      };
    }

    // 3. Auto: first active clone
    const runningClone = clones?.find(isActive);
    if (runningClone) {
      return {
        id: runningClone.id,
        type: "clone",
        label: runningClone.name ?? `Clone ${runningClone.id}`,
      };
    }

    // 4. Auto: first active camera
    const runningCamera = cameras?.find(isActive);
    if (runningCamera) {
      return {
        id: runningCamera.id,
        type: "camera",
        label: runningCamera.name ?? `Camera ${runningCamera.id}`,
      };
    }

    return null;
  }, [selectedAlert, selectedCamera, clones, cameras]);

  // ── Pick correct URL based on type ─────────────────────────────────────────
  const streamUrl = feedSource
    ? feedSource.type === "clone"
      ? `${getCloneStreamUrl(feedSource.id)}?t=${refreshKey}`
      : `${getCameraStreamUrl(feedSource.id)}?t=${refreshKey}`
    : null;

  const snapshotUrl = feedSource
    ? feedSource.type === "clone"
      ? getCloneSnapshotUrl(feedSource.id)
      : getCameraSnapshotUrl(feedSource.id)
    : null;

  function handleRefresh() {
    setStreamError(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div
      className="flex-1 bg-white rounded-2xl p-4 sm:p-5 flex flex-col"
      style={{ border: "1px solid #E8EFF5" }}
    >
      <h2
        className="font-poppins text-[14px] sm:text-[15px] font-semibold mb-4 flex-shrink-0"
        style={{ color: "#374151" }}
      >
        Live Camera
      </h2>

      {/* Feed container */}
      <div className="w-full flex-1 min-h-[40vh] xl:min-h-0 rounded-xl overflow-hidden relative bg-[#0f172a]">
        {/* No feed available */}
        {!feedSource && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Camera size={28} className="text-white opacity-20" />
            <p className="font-poppins text-[13px] text-white opacity-30 px-4 text-center">
              No running cameras or clones
            </p>
          </div>
        )}

        {/* MJPEG stream */}
        {feedSource && !streamError && (
          <img
            key={refreshKey}
            src={streamUrl}
            alt="Live stream"
            className="w-full h-full object-contain"
            onError={() => setStreamError(true)}
          />
        )}

        {/* Fallback snapshot on stream error */}
        {feedSource && streamError && snapshotUrl && (
          <img
            src={snapshotUrl}
            alt="Snapshot fallback"
            className="w-full h-full object-contain opacity-80"
            onError={() => {}}
          />
        )}

        {/* Stream error overlay */}
        {feedSource && streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="font-poppins text-[12px] text-white opacity-50">
              Stream unavailable
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {/* LIVE badge */}
        {feedSource && !streamError && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-xs font-bold flex items-center gap-1 font-poppins"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
            LIVE
          </div>
        )}

        {/* CLONE badge — bottom left */}
        {feedSource?.type === "clone" && (
          <div
            className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold font-poppins"
            style={{ background: "rgba(124,58,237,0.75)", color: "#fff" }}
          >
            CLONE
          </div>
        )}

        {/* Alert banner — top overlay when alert is active */}
        {selectedAlert && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 font-poppins text-[11px] font-bold text-white"
            style={{ background: "rgba(239,68,68,0.82)" }}
          >
            🚨 {selectedAlert.type} · {selectedAlert.uiTime}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-3 px-1 flex-shrink-0">
        <span
          className="font-poppins text-[12px] sm:text-[13px] font-medium"
          style={{ color: "#0085D4" }}
        >
          {feedSource ? (
            <>
              {feedSource.type === "clone" ? "Clone" : "Camera"} ID:{" "}
              <span className="font-semibold">{feedSource.id}</span>
              <span className="text-gray-400 ml-2">· {feedSource.label}</span>
            </>
          ) : (
            <span className="text-gray-400">No feed available</span>
          )}
        </span>
        <button
          onClick={handleRefresh}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          title="Refresh stream"
        >
          <RefreshCw size={14} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}
