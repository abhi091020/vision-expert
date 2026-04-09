import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "../../api/client";

export default function CameraTable({ onStreamStart, onStreamStop }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [stoppingId, setStoppingId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCameras() {
    try {
      const data = await apiGet("/cameras");
      setCameras(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(cam) {
    setConnectingId(cam.id);
    try {
      await apiPost(`/switch_camera/${cam.id}`);
      setActiveId(cam.id);
      onStreamStart?.();
    } catch (e) {
      alert("Failed to connect: " + e.message);
    } finally {
      setConnectingId(null);
    }
  }

  async function handleStop(cam) {
    setStoppingId(cam.id);
    try {
      await apiPost("/stop_stream");
      setActiveId(null);
      onStreamStop?.();
    } catch (e) {
      alert("Failed to stop: " + e.message);
    } finally {
      setStoppingId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this camera?")) return;
    try {
      await apiDelete(`/delete_camera/${id}`);
      if (activeId === id) setActiveId(null);
      fetchCameras();
    } catch (e) {
      alert("Failed to delete: " + e.message);
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

      {/* Table */}
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-3">Loading...</p>
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
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {cameras.map((cam, i) => {
              const isActive = activeId === cam.id;
              const isConnecting = connectingId === cam.id;
              const isStopping = stoppingId === cam.id;
              return (
                <tr
                  key={cam.id}
                  style={{
                    background: isActive
                      ? "rgba(0,133,212,0.06)"
                      : i % 2 === 0
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(248,250,252,0.6)",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <td
                    className="px-3 py-2 font-bold"
                    style={{ color: "#0085D4" }}
                  >
                    #{cam.id}
                  </td>
                  <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                    {cam.name}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-400 max-w-[160px]">
                    <span className="block truncate" title={cam.url}>
                      {cam.url}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="flex items-center gap-1.5 font-bold"
                      style={
                        isActive ? { color: "#22c55e" } : { color: "#94a3b8" }
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-green-400 animate-pulse" : "bg-gray-300"}`}
                      />
                      {isActive ? "Live" : "Idle"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {isActive ? (
                        <button
                          onClick={() => handleStop(cam)}
                          disabled={isStopping}
                          className="px-2.5 py-1 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444, #b91c1c)",
                          }}
                        >
                          {isStopping ? "..." : "STOP"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(cam)}
                          disabled={isConnecting}
                          className="px-2.5 py-1 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          style={{
                            background:
                              "linear-gradient(135deg, #0085D4, #024167)",
                          }}
                        >
                          {isConnecting ? "..." : "CONNECT"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(cam.id)}
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
