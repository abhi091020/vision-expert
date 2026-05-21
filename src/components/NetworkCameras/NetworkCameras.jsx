import { useState } from "react";
import { createCamera } from "../../api/cameras";
import FileUpload from "../FileUpload/FileUpload";
import CameraTable from "./CameraTable";

const SOURCE_TYPES = ["rtsp", "http", "file", "usb"];

export default function NetworkCameras({ onStreamStart }) {
  const [activeTab, setActiveTab] = useState("network");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // triggers CameraTable refresh

  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: "554",
    user: "",
    password: "",
    path: "/stream1",
    source_type: "rtsp",
  });

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function buildRtspSource() {
    const auth = form.user
      ? `${encodeURIComponent(form.user)}${form.password ? `:${encodeURIComponent(form.password)}` : ""}@`
      : "";
    const port = form.port ? `:${form.port}` : "";
    const path = form.path.startsWith("/") ? form.path : `/${form.path}`;
    return `rtsp://${auth}${form.ip}${port}${path}`;
  }

  async function handleAdd() {
    setError(null);
    if (!form.name.trim() || !form.ip.trim()) {
      setError("Camera name and IP address are required.");
      return;
    }

    setSaving(true);
    try {
      await createCamera({
        name: form.name.trim(),
        source: buildRtspSource(),
        source_type: form.source_type,
      });
      setForm({
        name: "",
        ip: "",
        port: "554",
        user: "",
        password: "",
        path: "/stream1",
        source_type: "rtsp",
      });
      setRefreshKey((k) => k + 1); // re-fetch table
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
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
      {/* Tab buttons */}
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

      {/* Network camera form */}
      {activeTab === "network" && (
        <div className="flex flex-col gap-2.5">
          {/* Source type selector */}
          <select
            value={form.source_type}
            onChange={(e) => set("source_type", e.target.value)}
            className={inputClass}
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>

          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Friendly Name (e.g. Exit Gate)"
            className={inputClass}
          />

          {form.source_type === "rtsp" && (
            <>
              <div className="flex gap-2">
                <input
                  value={form.ip}
                  onChange={(e) => set("ip", e.target.value)}
                  placeholder="IP Address"
                  className={inputClass}
                />
                <input
                  value={form.port}
                  onChange={(e) => set("port", e.target.value)}
                  placeholder="Port (554)"
                  className={`${inputClass} w-[35%]`}
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={form.user}
                  onChange={(e) => set("user", e.target.value)}
                  placeholder="Username"
                  className={inputClass}
                />
                <input
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                />
              </div>
              <input
                value={form.path}
                onChange={(e) => set("path", e.target.value)}
                placeholder="RTSP Path (e.g. /stream1)"
                className={inputClass}
              />
              <p className="text-[10px] font-mono text-gray-400 px-1">
                {buildRtspSource()}
              </p>
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠️ {error}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-white text-sm font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0085D4, #024167)" }}
          >
            {saving ? "Adding…" : "+ ADD NEW CAMERA"}
          </button>
        </div>
      )}

      {activeTab === "upload" && <FileUpload onStreamStart={onStreamStart} />}

      {/* Camera table always visible */}
      <CameraTable key={refreshKey} onStreamStart={onStreamStart} />
    </div>
  );
}
