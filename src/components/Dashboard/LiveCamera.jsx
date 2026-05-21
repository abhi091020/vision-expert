import { useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { getCameraStreamUrl, getCameraSnapshotUrl } from "../../api/cameras";

/**
 * LiveCamera
 *
 * selectedAlert — alert row clicked in RealTimeAlerts (has .camId field)
 * selectedCamera — camera object from CameraGrid/useCameras (has .id field)
 *
 * Stream is loaded as <img src="...stream"> which works for MJPEG endpoints.
 * Falls back to snapshot URL on stream error.
 */
export default function LiveCamera({ selectedAlert, selectedCamera }) {
  const [streamError, setStreamError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Resolve which camera ID to display
  const cameraId = selectedCamera?.id ?? selectedAlert?.camId ?? null;
  const cameraLabel = selectedCamera?.name ?? cameraId ?? "Main Camera Feed";

  const streamUrl = cameraId
    ? `${getCameraStreamUrl(cameraId)}?t=${refreshKey}`
    : null;

  const snapshotUrl = cameraId ? getCameraSnapshotUrl(cameraId) : null;

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
        {!cameraId && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-poppins text-[13px] text-white opacity-30 px-4 text-center">
              Select a camera or alert to view stream
            </p>
          </div>
        )}

        {/* MJPEG stream via <img> — browser handles multipart/x-mixed-replace */}
        {cameraId && !streamError && (
          <img
            key={refreshKey}
            src={streamUrl}
            alt="Live stream"
            className="w-full h-full object-contain"
            onError={() => setStreamError(true)}
          />
        )}

        {/* Fallback: snapshot on stream error */}
        {cameraId && streamError && snapshotUrl && (
          <img
            src={snapshotUrl}
            alt="Camera snapshot"
            className="w-full h-full object-contain opacity-80"
            onError={() => {}}
          />
        )}

        {/* Stream error message */}
        {cameraId && streamError && (
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

        {/* Live badge */}
        {cameraId && !streamError && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-xs font-bold flex items-center gap-1 font-poppins"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-3 px-1 flex-shrink-0">
        <span
          className="font-poppins text-[12px] sm:text-[13px] font-medium"
          style={{ color: "#0085D4" }}
        >
          {cameraId ? (
            <>
              Camera ID: <span className="font-semibold">{cameraId}</span>
              {selectedCamera?.name && (
                <span className="text-gray-400 ml-2">
                  · {selectedCamera.name}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400">No camera selected</span>
          )}
        </span>
        <button
          onClick={handleRefresh}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          title="Refresh stream"
        >
          <Camera size={16} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}
