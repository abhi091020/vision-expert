import { useState } from "react";
import { setMode } from "../../api/client";

const MODES = ["COUNTING", "DETECTION"];

export default function HeadCount({ metrics }) {
  const [activeMode, setActiveMode] = useState("COUNTING");
  const [switching, setSwitching] = useState(false);

  async function handleModeToggle(mode) {
    if (mode === activeMode || switching) return;
    setSwitching(true);
    try {
      await setMode(mode);
      setActiveMode(mode);
    } catch (err) {
      console.error("Failed to set mode:", err);
    } finally {
      setSwitching(false);
    }
  }

  const items = [
    {
      label: "IN",
      value: metrics?.in ?? 0,
      color: "#22c55e",
      dark: "#15803d",
      emoji: "↙",
    },
    {
      label: "OUT",
      value: metrics?.out ?? 0,
      color: "#f59e0b",
      dark: "#b45309",
      emoji: "↗",
    },
    {
      label: "TOTAL",
      value: metrics?.total ?? 0,
      color: "#0085D4",
      dark: "#024167",
      emoji: "⬡",
    },
    {
      label: "IN FRAME",
      value: metrics?.inFrame ?? 0,
      color: "#a855f7",
      dark: "#7e22ce",
      emoji: "◈",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header card — matches PPEPanel card wrapper ── */}
      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col gap-3 flex-shrink-0">
        {/* Title row — matches PPEPanel Camera ID row */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-1">
            <span className="text-gray-700">Head</span>
            <span style={{ color: "#0085D4" }}>Count</span>
          </h2>

          {/* Mode pill toggle */}
          {/* <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeToggle(mode)}
                disabled={switching}
                className={`text-xs font-bold px-3 py-1 rounded-md transition-all duration-200 ${
                  activeMode === mode
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {switching && mode !== activeMode ? "..." : mode}
              </button>
            ))}
          </div> */}
        </div>

        {/* Live label — matches PPEPanel chip row */}
        <div className="flex items-center gap-2 flex-shrink-0 min-h-[36px]">
          <span className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold">
            🔴 Live from Cam01
          </span>
          {/* <span className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 text-sm font-semibold">
            Mode: {activeMode}
          </span> */}
        </div>
      </div>

      {/* ── KPI Cards — unchanged, these are intentionally different ── */}
      <div className="grid grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden py-8 px-2"
            style={{
              background: `linear-gradient(145deg, ${item.color}, ${item.dark})`,
              boxShadow: `0 8px 24px ${item.color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[45%] rounded-t-2xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
              }}
            />
            <div
              className="absolute -right-1 -bottom-2 text-6xl font-black select-none pointer-events-none"
              style={{ color: "rgba(255,255,255,0.1)", lineHeight: 1 }}
            >
              {item.emoji}
            </div>
            <span
              className="text-5xl font-black text-white z-10 leading-none"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
            >
              {item.value}
            </span>
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase mt-2 z-10"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
