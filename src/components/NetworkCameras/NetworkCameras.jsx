import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "../../api/client";
import FileUpload from "../FileUpload/FileUpload";
import CameraTable from "./CameraTable";

export default function NetworkCameras({ onStreamStart }) {
  const [activeTab, setActiveTab] = useState("network");
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: "554",
    user: "",
    password: "",
    path: "/stream1",
  });

  useEffect(() => {
    fetchCameras();
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

  async function handleAdd() {
    if (!form.name.trim() || !form.ip.trim()) return;
    try {
      await apiPost("/add_camera", {
        id: Date.now(),
        name: form.name,
        ip: form.ip,
        port: form.port || "554",
        user: form.user,
        password: form.password,
        path: form.path || "/stream1",
      });
      setForm({
        name: "",
        ip: "",
        port: "554",
        user: "",
        password: "",
        path: "/stream1",
      });
      fetchCameras();
    } catch (e) {
      alert("Failed to add camera: " + e.message);
    }
  }

  const inputClass = `w-full px-3 py-2 rounded-lg text-sm text-gray-700 outline-none transition-all
    bg-gray-50 border border-gray-200 focus:border-blue-400 focus:bg-white placeholder:text-gray-400`;

  const tabs = [
    { id: "network", label: "Network Cameras" },
    { id: "upload", label: "File Upload" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Tab Buttons ── */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "rgba(0,133,212,0.08)" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #0085D4, #024167)",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,133,212,0.25)",
                    }
                  : { color: "#64748b" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "network" && (
        <div className="flex flex-col gap-2.5">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Friendly Name (e.g. Exit Gate)"
            className={inputClass}
          />
          <div className="flex gap-2">
            <input
              value={form.ip}
              onChange={(e) => setForm({ ...form, ip: e.target.value })}
              placeholder="IP Address"
              className={inputClass}
            />
            <input
              value={form.port}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              placeholder="Port (554)"
              className={`${inputClass} w-[35%]`}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="Username"
              className={inputClass}
            />
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder="Password"
              className={inputClass}
            />
          </div>
          <input
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            placeholder="RTSP Path (e.g. /stream1)"
            className={inputClass}
          />
          <button
            onClick={handleAdd}
            className="w-full py-2.5 rounded-xl text-white text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #0085D4, #024167)" }}
          >
            + ADD NEW CAMERA
          </button>
        </div>
      )}

      {activeTab === "upload" && <FileUpload onStreamStart={onStreamStart} />}

      {/* ── Camera Table — always visible below tabs ── */}
      <CameraTable onStreamStart={onStreamStart} />
    </div>
  );
}
