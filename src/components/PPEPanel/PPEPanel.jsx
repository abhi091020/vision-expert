import { useState, useEffect } from "react";
import { useDetection } from "../../hooks/useDetection";
import { apiGet } from "../../api/client";
import { PPE_ITEMS, CAMERAS } from "../../data/mockData";
import PPECard from "./PPECard";
import NotificationTable from "./NotificationTable";
import HeadCount from "../HeadCount/HeadCount";
import SecureArea from "../SecureArea/SecureArea";
import Animal from "../Animal/Animal";
import Dock from "../Dock/Dock";
import FireDetection from "../Fire/FireDetection";
import Crowd from "../Crowd/Crowd";

// Map API violation labels → PPECard item IDs
const VIOLATION_MAP = {
  "NO-Hardhat": "helmet",
  "NO-Safety Vest": "vest",
  "NO-Mask": "goggles",
  "NO-Safety Gloves": "hand_gloves",
  "NO-Gloves": "hand_gloves",
};

export default function PPEPanel({
  selectedCamera,
  onSelectCamera,
  hideTabs,
  streamActive,
  activeTab,
  metrics,
  wsFireData = null,
  wsAnimalData = null,
  wsSafetyData = null,
  wsPlateData = null, // ✅ added
}) {
  const {
    violations: wsViolations,
    muted,
    setMuted,
  } = useDetection(selectedCamera, streamActive);

  // ── Real PPE detection state ─────────────────────────────────────────────
  const [ppeResult, setPpeResult] = useState(null);
  const [ppeViolations, setPpeViolations] = useState([]);
  const [annotatedImage, setAnnotatedImage] = useState(null);

  // ── PPE Health state ─────────────────────────────────────────────────────
  const [ppeHealth, setPpeHealth] = useState(null);

  // Fetch health once on mount
  useEffect(() => {
    apiGet("/ppe/health")
      .then((res) => setPpeHealth(res))
      .catch(() =>
        setPpeHealth({ status: "error", model_loaded: false, classes: [] }),
      );
  }, []);

  // Listen for ppeDetected events (from file upload + polling)
  useEffect(() => {
    function onPpeDetected(e) {
      const res = e.detail;
      setPpeResult(res);

      const uniqueViolations = [...new Set(res.violations ?? [])];
      const mappedIds = uniqueViolations
        .map((v) => VIOLATION_MAP[v])
        .filter(Boolean);
      setPpeViolations(mappedIds);

      if (res.image) {
        setAnnotatedImage(`data:image/jpeg;base64,${res.image}`);
      } else if (!res.detected) {
        setAnnotatedImage(null);
      }
    }

    window.addEventListener("ppeDetected", onPpeDetected);
    return () => window.removeEventListener("ppeDetected", onPpeDetected);
  }, []);

  // Use real PPE violations if available, otherwise fall back to ws/polling
  const violations = ppeViolations.length > 0 ? ppeViolations : wsViolations;

  // ── Head Count ───────────────────────────────────────────────────────────
  if (activeTab === "head_count") {
    return (
      <div className="flex flex-col h-full gap-3">
        <HeadCount metrics={metrics} />
      </div>
    );
  }

  // ── Secure Area ──────────────────────────────────────────────────────────
  if (activeTab === "secure_area") {
    return (
      <div className="flex flex-col h-full gap-3">
        <SecureArea
          key={streamActive ? "active" : "idle"}
          active={streamActive}
          wsDetections={wsSafetyData}
          streamActive={streamActive}
        />
      </div>
    );
  }

  // ── Animal Detection ─────────────────────────────────────────────────────
  if (activeTab === "animal") {
    return (
      <div className="flex flex-col h-full gap-3">
        <Animal active={true} wsDetections={wsAnimalData} />
      </div>
    );
  }

  // ── Dock / Number Plate ──────────────────────────────────────────────────
  if (activeTab === "dock") {
    return (
      <div className="flex flex-col h-full gap-3">
        <Dock active={true} wsDetections={wsPlateData} />{" "}
        {/* ✅ wsPlateData wired in */}
      </div>
    );
  }

  // ── Fire Detection ───────────────────────────────────────────────────────
  if (activeTab === "fire") {
    return (
      <div className="flex flex-col h-full gap-3">
        <FireDetection active={true} wsDetections={wsFireData} />
      </div>
    );
  }

  // ── Crowd Monitoring ─────────────────────────────────────────────────────
  if (activeTab === "crowd") {
    return (
      <div className="flex flex-col h-full gap-3">
        <Crowd active={streamActive} />
      </div>
    );
  }

  // ── PPE Tab (default) ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="bg-white/10 rounded-xl border border-black/10 p-4 flex flex-col flex-shrink-0">
        {selectedCamera && (
          <>
            {/* Camera ID + Badges + Mute */}
            <div className="flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-1">
                <span className="text-gray-700">Camera ID:</span>
                <span style={{ color: "#0085D4" }}>
                  {selectedCamera.id.replace("CAM-", "").padStart(3, "0")}
                </span>
              </h2>

              <div className="flex items-center gap-2">
                {/* Model Health Badge */}
                {ppeHealth && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-default"
                    title={
                      ppeHealth.model_loaded
                        ? `Classes: ${ppeHealth.classes?.join(", ")}`
                        : "Model failed to load"
                    }
                    style={{
                      background: ppeHealth.model_loaded
                        ? "#f0fdf4"
                        : "#fef2f2",
                      color: ppeHealth.model_loaded ? "#22c55e" : "#ef4444",
                      border: `1px solid ${ppeHealth.model_loaded ? "#86efac" : "#fca5a5"}`,
                    }}
                  >
                    {ppeHealth.model_loaded ? "✅" : "❌"}
                    {ppeHealth.model_loaded
                      ? `Model Ready · ${ppeHealth.classes?.length ?? 0} classes`
                      : "Model Error"}
                  </span>
                )}

                {/* Confidence Badge */}
                {ppeResult && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: ppeResult.detected ? "#fef2f2" : "#f0fdf4",
                      color: ppeResult.detected ? "#ef4444" : "#22c55e",
                      border: `1px solid ${ppeResult.detected ? "#fca5a5" : "#86efac"}`,
                    }}
                  >
                    {(ppeResult.confidence * 100).toFixed(0)}% conf ·{" "}
                    {ppeResult.total_detections} detected
                  </span>
                )}

                {/* Mute Button */}
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
                  {muted
                    ? "MUTED"
                    : violations.length > 0
                      ? "SIREN ON"
                      : "SIREN"}
                </button>
              </div>
            </div>

            {/* Violation Chips */}
            <div className="flex flex-wrap gap-2 mt-2 flex-shrink-0 min-h-[36px]">
              {violations.length === 0 ? (
                <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-600 text-sm font-semibold">
                  ✅ All PPE Compliant
                </span>
              ) : (
                [...new Set(ppeResult?.violations ?? violations)].map(
                  (label, i) => (
                    <span
                      key={i}
                      className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold animate-pulse"
                    >
                      ⚠️ {label}
                    </span>
                  ),
                )
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

            {/* Annotated Image */}
            {annotatedImage && (
              <div className="mt-3 rounded-xl overflow-hidden border border-black/10">
                <img
                  src={annotatedImage}
                  alt="PPE Detection Result"
                  className="w-full object-contain rounded-xl"
                  style={{ maxHeight: "20vh" }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <NotificationTable
        ppeResult={ppeResult}
        annotatedImage={annotatedImage}
      />
    </div>
  );
}
