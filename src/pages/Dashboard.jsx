import { useState } from "react";
import bgImage from "../assets/Background.svg";
import Navbar from "../components/Navbar/Navbar";
import CameraFeed from "../components/CameraFeed/CameraFeed";
import PPEPanel from "../components/PPEPanel/PPEPanel";
import NetworkCameras from "../components/NetworkCameras/NetworkCameras";
import FileUpload from "../components/FileUpload/FileUpload";
import Footer from "../components/Common/Footer";
import CameraTable from "../components/NetworkCameras/CameraTable";
import { CAMERAS, NAV_TABS } from "../data/mockData";
import { useStats } from "../hooks/useDetection";
import { apiPost, apiGet } from "../api/client";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("ppe");
  const [selectedCamera, setSelectedCamera] = useState(CAMERAS[0]);
  const [activePanel, setActivePanel] = useState(null);
  const [streamActive, setStreamActive] = useState(false);
  const [streamKey, setStreamKey] = useState(0);

  const metrics = useStats();

  function togglePanel(panel) {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  function handleStreamStart() {
    setStreamActive(true);
    setStreamKey((k) => k + 1);
    setActivePanel(null);
  }

  function handleStreamStop() {
    setStreamActive(false);
  }

  async function handleTabChange(tab) {
    const prevTab = activeTab;
    setActiveTab(tab.id);

    if (prevTab === "animal" || tab.id === "animal") {
      try {
        await apiGet("/animal/clear").catch(() => {});
      } catch (_) {}
    }

    if (prevTab === "fire" || tab.id === "fire") {
      try {
        await apiGet("/fire/clear").catch(() => {});
      } catch (_) {}
    }

    try {
      await apiPost(`/set_mode/${tab.mode}`);
    } catch (e) {
      console.warn("set_mode failed:", e.message);
    }
  }

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar />

      <div className="relative z-10 flex h-full pt-[14vh] px-[4vw] pb-[10vh] gap-[2vw] min-h-0">
        {/* Left — self-start so it never stretches with right panel */}
        <div className="w-[45%] flex flex-col justify-start gap-2 self-start flex-shrink-0">
          {/* Camera — padding-top trick locks 16:9 regardless of surroundings */}
          <div className="w-full relative" style={{ paddingTop: "56.25%" }}>
            <div className="absolute inset-0">
              <CameraFeed
                selectedCamera={selectedCamera}
                streamActive={streamActive}
                streamKey={streamKey}
                onStop={handleStreamStop}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => togglePanel("network")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 shadow-sm"
              style={{
                background:
                  activePanel === "network"
                    ? "linear-gradient(180deg, #42A5F5 0%, #1565C0 100%)"
                    : "linear-gradient(180deg, #0085D4 0%, #024167 100%)",
              }}
            >
              Network Cameras
            </button>
            <button
              onClick={() => togglePanel("fileupload")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 shadow-sm"
              style={{
                background:
                  activePanel === "fileupload"
                    ? "linear-gradient(180deg, #42A5F5 0%, #1565C0 100%)"
                    : "linear-gradient(180deg, #0085D4 0%, #024167 100%)",
              }}
            >
              File Upload
            </button>
          </div>

          {/* Camera Table */}
          <CameraTable onStreamStart={handleStreamStart} />
        </div>

        {/* Right */}
        <div className="w-[52%] flex flex-col gap-4 -mt-4 -mr-4 min-h-0 flex-1">
          {/* Nav Tabs */}
          <div className="flex items-center justify-between gap-2 flex-shrink-0">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab)}
                className="flex-1 py-4 rounded-xl text-sm font-semibold text-white text-center transition-all duration-200 hover:scale-105 shadow-sm"
                style={{
                  background:
                    activeTab === tab.id
                      ? "linear-gradient(180deg, #42A5F5 0%, #1565C0 100%)"
                      : "linear-gradient(180deg, #0085D4 0%, #024167 100%)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 min-h-0">
            <PPEPanel
              selectedCamera={selectedCamera}
              onSelectCamera={setSelectedCamera}
              streamActive={streamActive}
              activeTab={activeTab}
              metrics={metrics}
              hideTabs
            />
          </div>
        </div>
      </div>

      {/* Floating Overlay Panel */}
      {activePanel && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{
            backdropFilter: "blur(4px)",
            background: "rgba(2,65,103,0.3)",
          }}
          onClick={() => setActivePanel(null)}
        >
          <div
            className="rounded-2xl shadow-2xl p-6 w-[460px] max-h-[75vh] overflow-y-auto"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0,133,212,0.2)",
              boxShadow: "0 25px 60px rgba(2,65,103,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between mb-5 pb-4"
              style={{ borderBottom: "1px solid rgba(0,133,212,0.15)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                  }}
                >
                  {activePanel === "network" ? "🔗" : "📁"}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-800">
                    {activePanel === "network"
                      ? "Network Cameras"
                      : "File Upload"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {activePanel === "network"
                      ? "Manage camera connections"
                      : "Process video or image files"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all font-bold"
              >
                ✕
              </button>
            </div>
            {activePanel === "network" && (
              <NetworkCameras onStreamStart={handleStreamStart} />
            )}
            {activePanel === "fileupload" && (
              <FileUpload
                onStreamStart={handleStreamStart}
                onStreamStop={handleStreamStop}
              />
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
