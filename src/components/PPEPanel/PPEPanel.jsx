import { useState } from "react";
import { useDetection } from "../../hooks/useDetection";
import { PPE_ITEMS, CAMERAS } from "../../data/mockData";
import PPECard from "./PPECard";
import NotificationTable from "./NotificationTable";
import HeadCount from "../HeadCount/HeadCount";
import SecureArea from "../SecureArea/SecureArea";
import Animal from "../Animal/Animal";
import Dock from "../Dock/Dock";
import FireDetection from "../Fire/FireDetection";

export default function PPEPanel({
  selectedCamera,
  onSelectCamera,
  hideTabs,
  streamActive,
  activeTab,
  metrics,
}) {
  const { violations, muted, setMuted } = useDetection(
    selectedCamera,
    streamActive,
  );

  // ── Head Count ──────────────────────────────────────────────
  if (activeTab === "head_count") {
    return (
      <div className="flex flex-col h-full gap-3">
        <HeadCount metrics={metrics} />
      </div>
    );
  }

  // ── Secure Area ─────────────────────────────────────────────
  if (activeTab === "secure_area") {
    return (
      <div className="flex flex-col h-full gap-3">
        <SecureArea active={true} />
      </div>
    );
  }

  // ── Animal Detection ─────────────────────────────────────────
  if (activeTab === "animal") {
    return (
      <div className="flex flex-col h-full gap-3">
        <Animal active={true} />
      </div>
    );
  }

  // ── Dock Monitoring ──────────────────────────────────────────
  if (activeTab === "dock") {
    return (
      <div className="flex flex-col h-full gap-3">
        <Dock active={true} />
      </div>
    );
  }

  // ── Fire Detection ──────────────────────────────────────────
  if (activeTab === "fire") {
    return (
      <div className="flex flex-col h-full gap-3">
        <FireDetection active={true} />
      </div>
    );
  }

  // ── PPE Tab (default) ────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col flex-shrink-0">
        {selectedCamera && (
          <>
            {/* Camera ID + Mute */}
            <div className="flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-1">
                <span className="text-gray-700">Camera ID:</span>
                <span style={{ color: "#0085D4" }}>
                  {selectedCamera.id.replace("CAM-", "").padStart(3, "0")}
                </span>
              </h2>
              <button
                onClick={() => setMuted((m) => !m)}
                title={muted ? "Unmute siren" : "Mute siren"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95"
                style={
                  muted
                    ? {
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#94a3b8",
                      }
                    : violations.length > 0
                      ? {
                          background: "#fef2f2",
                          border: "1px solid #fca5a5",
                          color: "#ef4444",
                        }
                      : {
                          background: "#f0fdf4",
                          border: "1px solid #86efac",
                          color: "#22c55e",
                        }
                }
              >
                <span className="text-base">{muted ? "🔇" : "🔊"}</span>
                {muted ? "MUTED" : violations.length > 0 ? "SIREN ON" : "SIREN"}
              </button>
            </div>

            {/* Violation Chips */}
            <div className="flex flex-wrap gap-2 mt-2 flex-shrink-0 min-h-[36px]">
              {violations.length === 0 ? (
                <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-600 text-sm font-semibold">
                  ✅ All PPE Compliant
                </span>
              ) : (
                violations.map((id) => {
                  const item = PPE_ITEMS.find((p) => p.id === id);
                  return (
                    <span
                      key={id}
                      className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold animate-pulse"
                    >
                      {item?.label ?? id}
                    </span>
                  );
                })
              )}
            </div>

            {/* PPE Cards */}
            <div
              className="grid grid-cols-6 gap-3 mt-3"
              style={{ height: "14vh" }}
            >
              {PPE_ITEMS.map((item) => (
                <PPECard
                  key={item.id}
                  item={item}
                  isViolation={violations.includes(item.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notification Table */}
      <NotificationTable />
    </div>
  );
}
