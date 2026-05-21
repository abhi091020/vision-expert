import { useState, useEffect, useRef } from "react";
import { apiGet } from "../../api/client";
import { usePlateStatus } from "../../hooks/useDetection";

export default function Dock({ active = true, wsDetections = null }) {
  const { data: status } = usePlateStatus(active, wsDetections);
  const [logs, setLogs] = useState([]);
  const [previewImg, setPreviewImg] = useState(null);
  const sessionStartRef = useRef(null);

  // Track session start time & reset on active change
  useEffect(() => {
    if (active) {
      sessionStartRef.current = Date.now();
      setLogs([]);
    } else {
      setLogs([]);
    }
  }, [active]);

  // Poll /plate/logs every 3s — only show logs from current session
  useEffect(() => {
    if (!active) return;

    async function pollLogs() {
      try {
        const res = await apiGet("/plate/logs");
        const sessionStart = sessionStartRef.current ?? Date.now();
        const filtered = [...res]
          .filter((log) => {
            const ts =
              log.timestamp > 1e12 ? log.timestamp : log.timestamp * 1000;
            return ts >= sessionStart;
          })
          .sort((a, b) => b.timestamp - a.timestamp);
        setLogs(filtered);
      } catch (_) {}
    }

    pollLogs();
    const id = setInterval(pollLogs, 3000);
    return () => clearInterval(id);
  }, [active]);

  const detected = status?.detected ?? false;
  const plateNumber = status?.plate_number ?? "—";
  const vehicleType = status?.vehicle_type ?? "—";
  const plateImage = status?.image
    ? `data:image/jpeg;base64,${status.image}`
    : null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Lightbox */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setPreviewImg(null)}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: "50vw", height: "50vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              ✕
            </button>
            <img
              src={previewImg}
              alt="Plate Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: "#000",
              }}
            />
          </div>
        </div>
      )}

      {/* Live Detection Card */}
      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-1">
            <span className="text-gray-700">Number Plate</span>
            <span style={{ color: "#0085D4" }}>Detection</span>
          </h2>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={
              detected
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
            {detected ? "🚗 Plate Detected" : "⏳ Waiting..."}
          </span>
        </div>

        {/* Detection details */}
        <div
          className="rounded-xl border-2 px-6 py-5 flex items-center gap-6"
          style={
            detected
              ? { background: "#fff5f5", borderColor: "#fca5a5" }
              : { background: "#f8fafc", borderColor: "#e2e8f0" }
          }
        >
          {/* Plate number */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Plate No.
            </span>
            <span
              className="text-3xl font-black tracking-widest"
              style={{
                color: detected ? "#1e40af" : "#94a3b8",
                fontFamily: "monospace",
                letterSpacing: "0.2em",
              }}
            >
              {plateNumber}
            </span>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* Vehicle type */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Vehicle
            </span>
            <span className="text-lg font-bold text-gray-600">
              {vehicleType === "Truck"
                ? "🚛"
                : vehicleType === "Bus"
                  ? "🚌"
                  : "🚗"}{" "}
              {vehicleType}
            </span>
          </div>

          {/* Snapshot */}
          {plateImage && (
            <>
              <div className="w-px h-12 bg-gray-200" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Snapshot
                </span>
                <img
                  src={plateImage}
                  alt="plate"
                  className="rounded-lg cursor-pointer hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all object-cover"
                  style={{ width: 80, height: 48 }}
                  onClick={() => setPreviewImg(plateImage)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Plate Logs Table */}
      <div
        className="rounded-xl border border-black/10 overflow-hidden flex flex-col flex-1 min-h-0"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-700 tracking-wide">
              🪪 Plate Logs
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #0085D4, #024167)",
              }}
            >
              {logs.length} records
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Latest on top
          </span>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-3xl mb-2">🪪</span>
              <p className="text-sm font-medium">No plate logs yet</p>
            </div>
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
                    Time
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                    Cam
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                    Plate No.
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.timestamp + i}
                    style={{
                      background:
                        i % 2 === 0
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(248,250,252,0.6)",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">
                      {log.time}
                    </td>
                    <td
                      className="px-3 py-2 font-bold whitespace-nowrap"
                      style={{ color: "#0085D4" }}
                    >
                      #{log.cam_id}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="font-black tracking-widest"
                        style={{ fontFamily: "monospace", color: "#1e40af" }}
                      >
                        {log.plate_number}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-600">
                      {log.vehicle_type === "Truck"
                        ? "🚛"
                        : log.vehicle_type === "Bus"
                          ? "🚌"
                          : "🚗"}{" "}
                      {log.vehicle_type}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
