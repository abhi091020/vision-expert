import { useCameras } from "../../hooks/useCameras";
import { getCameraStreamUrl } from "../../api/cameras";

/**
 * CameraTable
 *
 * Fully wired to the new /api/cameras/* endpoints via useCameras hook.
 * Connect → POST /api/cameras/{id}/start
 * Stop    → POST /api/cameras/{id}/stop
 * Delete  → DELETE /api/cameras/{id}
 * Status  → derived from camera.running / camera.status field
 */
export default function CameraTable({ onStreamStart, onStreamStop }) {
  const { cameras, loading, handleStart, handleStop, handleDelete } =
    useCameras(5000);

  async function doStart(cam) {
    try {
      await handleStart(cam.id);
      onStreamStart?.();
    } catch (e) {
      alert("Failed to start camera: " + e.message);
    }
  }

  async function doStop(cam) {
    try {
      await handleStop(cam.id);
      onStreamStop?.();
    } catch (e) {
      alert("Failed to stop camera: " + e.message);
    }
  }

  async function doDelete(cam) {
    if (!confirm(`Remove camera "${cam.name ?? cam.id}"?`)) return;
    try {
      await handleDelete(cam.id);
    } catch (e) {
      alert("Failed to delete camera: " + e.message);
    }
  }

  return (
    <div
      className="rounded-xl border border-black/10 overflow-hidden flex-shrink-0"
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-700 tracking-wide">
            🎥 Connected Cameras
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0085D4, #024167)" }}
          >
            {cameras.length}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading && cameras.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">Loading…</p>
      ) : cameras.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">
          No cameras added yet.
        </p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                background: "rgba(0,133,212,0.06)",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {["#", "Name", "Source", "Type", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cameras.map((cam, i) => {
              const isRunning = cam.running ?? cam.status === "running";
              return (
                <tr
                  key={cam.id}
                  style={{
                    background: isRunning
                      ? "rgba(0,133,212,0.04)"
                      : i % 2 === 0
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(248,250,252,0.6)",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  {/* # */}
                  <td
                    className="px-3 py-2 font-bold"
                    style={{ color: "#0085D4" }}
                  >
                    #{i + 1}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                    {cam.name ?? `Camera ${i + 1}`}
                  </td>

                  {/* Source URL */}
                  <td className="px-3 py-2 font-mono text-gray-400 max-w-[160px]">
                    <span className="block truncate" title={cam.source}>
                      {cam.source ?? "—"}
                    </span>
                  </td>

                  {/* source_type */}
                  <td className="px-3 py-2 text-gray-500 uppercase font-medium">
                    {cam.source_type ?? "—"}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <span
                      className="flex items-center gap-1.5 font-bold"
                      style={
                        isRunning ? { color: "#22c55e" } : { color: "#94a3b8" }
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning ? "bg-green-400 animate-pulse" : "bg-gray-300"}`}
                      />
                      {isRunning ? "Live" : "Idle"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {isRunning ? (
                        <button
                          onClick={() => doStop(cam)}
                          className="px-2.5 py-1 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444, #b91c1c)",
                          }}
                        >
                          STOP
                        </button>
                      ) : (
                        <button
                          onClick={() => doStart(cam)}
                          className="px-2.5 py-1 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity"
                          style={{
                            background:
                              "linear-gradient(135deg, #0085D4, #024167)",
                          }}
                        >
                          START
                        </button>
                      )}
                      <button
                        onClick={() => doDelete(cam)}
                        className="px-2 py-1 rounded-lg text-red-400 text-xs font-bold border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
