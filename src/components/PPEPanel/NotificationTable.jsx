import { useState } from "react";

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    time: "14:32:10",
    camId: "001",
    violation: "Helmet Missing",
    status: "New",
  },
  {
    id: 2,
    time: "14:30:45",
    camId: "001",
    violation: "Goggles Missing",
    status: "New",
  },
  {
    id: 3,
    time: "14:28:12",
    camId: "001",
    violation: "Vest Missing",
    status: "New",
  },
  {
    id: 4,
    time: "14:25:55",
    camId: "001",
    violation: "Shoes Missing",
    status: "Reviewed",
  },
  {
    id: 5,
    time: "14:22:30",
    camId: "001",
    violation: "Helmet Missing",
    status: "Reviewed",
  },
  {
    id: 6,
    time: "14:20:11",
    camId: "001",
    violation: "Hand Gloves Missing",
    status: "Reviewed",
  },
  {
    id: 7,
    time: "14:18:44",
    camId: "001",
    violation: "Arm Sleeves Missing",
    status: "Reviewed",
  },
  {
    id: 8,
    time: "14:15:02",
    camId: "001",
    violation: "Goggles Missing",
    status: "Reviewed",
  },
  {
    id: 9,
    time: "14:12:38",
    camId: "001",
    violation: "Vest Missing",
    status: "Reviewed",
  },
  {
    id: 10,
    time: "14:10:21",
    camId: "001",
    violation: "Helmet Missing",
    status: "Reviewed",
  },
];

const DUMMY_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'%3E%3Crect width='60' height='40' fill='%23e2e8f0' rx='4'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%2394a3b8'%3ECAM%3C/text%3E%3C/svg%3E";

export default function NotificationTable() {
  const [notifications] = useState(
    [...DUMMY_NOTIFICATIONS].sort((a, b) => b.id - a.id),
  );
  const [previewImg, setPreviewImg] = useState(null);

  return (
    <>
      {/* ── Lightbox Modal ── */}
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
            style={{ maxWidth: "80vw", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
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
              style={{ maxWidth: "80vw", maxHeight: "80vh", display: "block" }}
            />
          </div>
        </div>
      )}

      {/* ── Table ── */}
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
              {notifications.filter((n) => n.status === "New").length} New
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Latest on top
          </span>
        </div>

        {/* Table */}
        <div className="overflow-y-auto" style={{ maxHeight: "38vh" }}>
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
              {notifications.map((n, i) => (
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
                      src={DUMMY_IMG}
                      alt="screenshot"
                      className="rounded-md object-cover cursor-pointer hover:scale-110 hover:ring-2 hover:ring-blue-400 transition-all"
                      style={{ width: 52, height: 34 }}
                      title="Click to preview"
                      onClick={() => setPreviewImg(DUMMY_IMG)}
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
        </div>
      </div>
    </>
  );
}
