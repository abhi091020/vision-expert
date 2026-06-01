import { useState, useRef, useEffect } from "react";
import CameraGrid from "../components/Monitoring/CameraGrid";
import AddCameraModal from "../components/Monitoring/AddCameraModal";
import Footer from "../components/Common/Footer";

const MODES = [
  "Animal Detection",
  "Railway Detection",
  "Vehicle Detection",
  "Fall Detection",
  "PPE Kit Detection",
  "Fire Detection",
  "Head Count",
  "Secure Area",
  "Number Plate",
  "Crowd Monitoring",
];

export default function MonitoringPage({ isCollapsed = false, onAddCamera }) {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cloneCount, setCloneCount] = useState(0);

  const cameraGridRefetchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpenAddCamera() {
    if (onAddCamera) onAddCamera();
    else setShowAddCamera(true);
  }

  function handleCameraAdded() {
    cameraGridRefetchRef.current?.();
  }

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300
        left-0 md:left-[80px]
        ${isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"}
      `}
      style={{ background: "#F8F8F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col pt-4 px-3 sm:pt-5 sm:px-5">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4 flex-shrink-0">
            <h1
              className="text-xl sm:text-2xl font-semibold"
              style={{ color: "#01397C" }}
            >
              Camera Overview
            </h1>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Add Camera */}
              <button
                onClick={handleOpenAddCamera}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium text-white"
                style={{
                  background:
                    "linear-gradient(180deg, #024167 0%, #0085D4 100%)",
                }}
              >
                Add Camera{" "}
                <span className="text-base leading-none font-bold">+</span>
              </button>

              {/* Mode dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    cloneCount > 0 && setShowModeDropdown((p) => !p)
                  }
                  disabled={cloneCount === 0}
                  title={
                    cloneCount === 0
                      ? "Add a clone to enable mode selection"
                      : undefined
                  }
                  className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  style={{
                    background:
                      "linear-gradient(180deg, #05517E 0%, #0085D4 100%)",
                  }}
                >
                  {selectedMode || "Mode"} <span className="text-xs">▼</span>
                </button>

                {showModeDropdown && (
                  <div className="absolute right-0 top-12 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-52 sm:w-56">
                    {selectedMode && (
                      <button
                        onClick={() => {
                          setSelectedMode("");
                          setShowModeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 font-poppins text-[13px] hover:bg-red-50 transition-colors border-b border-gray-100"
                        style={{ color: "#ef4444", fontWeight: 500 }}
                      >
                        ✕ Clear selection
                      </button>
                    )}

                    {MODES.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setSelectedMode(mode);
                          setShowModeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 font-poppins text-[13px] hover:bg-blue-50 transition-colors"
                        style={{
                          color: selectedMode === mode ? "#0085D4" : "#333",
                          fontWeight: selectedMode === mode ? 600 : 400,
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <CameraGrid
            onRefetchReady={(fn) => (cameraGridRefetchRef.current = fn)}
            onClonesChange={setCloneCount}
            selectedMode={selectedMode}
          />
        </div>
      </div>

      <Footer />

      {showAddCamera && (
        <AddCameraModal
          onClose={() => setShowAddCamera(false)}
          onAdded={handleCameraAdded}
        />
      )}
    </div>
  );
}
