import { useState, useEffect } from "react";

const DUMMY_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'%3E%3Crect width='60' height='40' fill='%23e2e8f0' rx='4'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%2394a3b8'%3ECAM%3C/text%3E%3C/svg%3E";

export default function NotificationTable({ ppeResult, annotatedImage }) {
  const [notifications, setNotifications] = useState([]);
  const [previewImg, setPreviewImg] = useState(null);

  // Accumulate real notifications whenever a new ppeResult arrives
  useEffect(() => {
    if (!ppeResult?.detected) return;

    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const imgSrc = annotatedImage ?? DUMMY_IMG;

    // One notification per unique violation label
    const uniqueViolations = [...new Set(ppeResult.violations ?? [])];
    const newEntries = uniqueViolations.map((violation, i) => ({
      id: Date.now() + i,
      time,
      camId: "001",
      violation,
      status: "New",
      image: imgSrc,
    }));

    setNotifications((prev) => [...newEntries, ...prev].slice(0, 50)); // keep latest 50
  }, [ppeResult]);

  const displayList = notifications.length > 0 ? notifications : [];
  const newCount = displayList.filter((n) => n.status === "New").length;

  return (
    <>
      {/* Lightbox Modal */}
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
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              ✕
            </button>
            <img
              src={previewImg}
              alt="Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                background: "#000",
              }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-xl border border-black/10 overflow-hidden flex flex-col"
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
              🔔 Notifications
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #0085D4, #024167)",
              }}
            >
              {newCount} New
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">
              Latest on top
            </span>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-y-auto" style={{ maxHeight: "38vh" }}>
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-3xl mb-2">🛡️</span>
              <p className="text-sm font-medium">No violations detected yet</p>
              <p className="text-xs mt-1">
                Upload an image or video to start PPE detection
              </p>
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
                    Violation
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                    Screenshot
                  </th>
                  <th className="text-left px-3 py-2 font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((n, i) => (
                  <tr
                    key={n.id}
                    style={{
                      background:
                        i % 2 === 0
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(248,250,252,0.6)",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">
                      {n.time}
                    </td>
                    <td
                      className="px-3 py-2 font-bold whitespace-nowrap"
                      style={{ color: "#0085D4" }}
                    >
                      #{n.camId}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 font-semibold text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {n.violation}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <img
                        src={n.image}
                        alt="screenshot"
                        className="rounded-md object-cover cursor-pointer hover:scale-110 hover:ring-2 hover:ring-blue-400 transition-all"
                        style={{ width: 52, height: 34 }}
                        title="Click to preview"
                        onClick={() => setPreviewImg(n.image)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-0.5 rounded-full font-bold text-xs"
                        style={
                          n.status === "New"
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
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
