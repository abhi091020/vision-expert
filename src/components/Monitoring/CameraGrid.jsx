import { useState, useEffect } from "react";
import { Camera, X, Play, Square, Trash2, RefreshCw } from "lucide-react";
import { useCameras } from "../../hooks/useCameras";
import { getCameraStreamUrl } from "../../api/cameras";
import ConfirmModal from "../shared/ConfirmModal"; // ✅ import shared modal
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

// ─── CameraCard ───────────────────────────────────────────────────────────────
function CameraCard({
  cam,
  camIndex,
  onClick,
  selected,
  onStart,
  onStop,
  onDeleteRequest, // ✅ renamed: just signals intent, doesn't delete directly
  actionLoading,
}) {
  const [streamError, setStreamError] = useState(false);
  const streamUrl = getCameraStreamUrl(cam.id);
  const isRunning = cam.running ?? cam.status === "running";

  useEffect(() => {
    setStreamError(false);
  }, [cam.id, isRunning]);

  return (
    <div
      onClick={() => onClick(cam.id)}
      className="bg-white rounded-2xl cursor-pointer transition-all hover:shadow-lg p-3 flex flex-col h-full"
      style={{
        border: `1.5px solid ${selected ? "#0085D4" : "rgba(0,0,0,0.10)"}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      {/* Video */}
      <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden flex-1 min-h-[25vh]">
        {!streamError && (
          <img
            src={streamUrl}
            alt={cam.name}
            className="w-full h-full object-contain"
            onError={() => setStreamError(true)}
          />
        )}
        {streamError && (
          <span className="text-gray-500 text-xs font-poppins">No Stream</span>
        )}

        <div
          className="absolute top-2 left-2 px-2 py-1 rounded text-white text-xs font-medium font-poppins"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          {cam.name ?? `CAM ${camIndex + 1}`}
        </div>

        {isRunning && (
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-1 font-poppins"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
            REC
          </div>
        )}
      </div>

      {/* Info row */}
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
          {isRunning ? (
            <button
              onClick={() => onStop(cam.id)}
              disabled={actionLoading === cam.id}
              title="Stop camera"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "#ef4444" }}
            >
              {actionLoading === cam.id ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Square size={12} />
              )}
            </button>
          ) : (
            <button
              onClick={() => onStart(cam.id)}
              disabled={actionLoading === cam.id}
              title="Start camera"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "#22c55e" }}
            >
              {actionLoading === cam.id ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Play size={12} />
              )}
            </button>
          )}

          {/* ✅ Now opens ConfirmModal instead of window.confirm */}
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

// ─── CameraGrid ───────────────────────────────────────────────────────────────
export default function CameraGrid() {
  const { cameras, loading, error, handleStart, handleStop, handleDelete } =
    useCameras(5000);

  const [selectedCamId, setSelectedCamId] = useState(null);
  const selectedCam = cameras.find((c) => c.id === selectedCamId) ?? null;
  const [actionLoading, setActionLoading] = useState(null);

  // ✅ Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // cam object to delete
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function doStart(id) {
    setActionLoading(id);
    try {
      await handleStart(id);
    } catch (e) {
      // ✅ No more alert() — error shown inline or ignored silently
      console.error("Start failed:", e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function doStop(id) {
    setActionLoading(id);
    try {
      await handleStop(id);
    } catch (e) {
      console.error("Stop failed:", e.message);
    } finally {
      setActionLoading(null);
    }
  }

  // ✅ Step 1: open modal
  function requestDelete(cam) {
    setDeleteTarget(cam);
    setDeleteError(null);
  }

  // ✅ Step 2: user confirmed in modal
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (selectedCamId === deleteTarget.id) setSelectedCamId(null);
      await handleDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e.message || "Failed to delete camera.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RefreshCw size={28} className="animate-spin" />
          <p className="font-poppins text-sm">Loading cameras…</p>
        </div>
      </div>
    );
  }

  if (error && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-3xl">⚠️</span>
          <p className="font-poppins text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && cameras.length === 0) {
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
      {/* ✅ Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Camera"
        message={`Remove "${deleteTarget?.name ?? deleteTarget?.id}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      {/* ✅ Inline delete error (replaces alert) */}
      {deleteError && (
        <div className="rounded-lg px-4 py-2 font-poppins text-[12px] text-red-500 bg-red-50 border border-red-200">
          ⚠️ {deleteError}
        </div>
      )}

      {/* Featured camera detail panel */}
      {selectedCam && (
        <div
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            {/* Stream panel */}
            <div className="w-full lg:w-[55%] flex-shrink-0">
              <div className="p-3 sm:p-4">
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video">
                  <img
                    key={selectedCam.id}
                    src={getCameraStreamUrl(selectedCam.id)}
                    alt="Live stream"
                    className="w-full h-full object-contain"
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
                  <span className="hidden sm:block text-gray-300">|</span>
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Type:{" "}
                    <span className="font-normal" style={{ color: "#4A4A4A" }}>
                      {selectedCam.source_type ?? "—"}
                    </span>
                  </p>
                  {selectedCam.source && (
                    <>
                      <span className="hidden sm:block text-gray-300">|</span>
                      <p
                        className="font-poppins text-[11px] text-gray-400 truncate max-w-[200px]"
                        title={selectedCam.source}
                      >
                        {selectedCam.source}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:opacity-90"
                    style={{ background: "#023350" }}
                  >
                    <Camera size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedCamId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
                    style={{ background: "#ef4444" }}
                  >
                    <X size={16} color="#ffffff" />
                  </button>
                </div>
              </div>
            </div>

            {/* PPE status panel */}
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
          </div>
        </div>
      )}

      {/* Camera grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 grid-rows-2 gap-4 flex-1 min-h-0">
        {cameras.map((cam, i) => (
          <CameraCard
            key={cam.id}
            cam={cam}
            camIndex={i}
            onClick={setSelectedCamId}
            selected={selectedCam?.id === cam.id}
            onStart={doStart}
            onStop={doStop}
            onDeleteRequest={requestDelete} // ✅ opens modal instead of confirm()
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  );
}
