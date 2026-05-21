import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { createCamera, startCamera } from "../../api/cameras"; // ✅ import startCamera

const SOURCE_TYPES = ["rtsp", "file", "usb", "http"];

const inputClass = `w-full px-4 py-3 rounded-lg font-poppins text-[14px] outline-none transition-colors`;
const inputStyle = { border: "1.5px solid #D1E3F0", color: "#01397C" };
const focusStyle = { borderColor: "#01397C" };
const blurStyle = { borderColor: "#D1E3F0" };

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-poppins text-[13px] sm:text-[14px] font-medium"
        style={{ color: "#01397C" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AddCameraModal({ onClose, onAdded }) {
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: "554",
    user: "",
    password: "",
    path: "/stream1",
    source_type: "rtsp",
    source: "",
  });

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function buildSource() {
    if (form.source_type === "rtsp") {
      const auth = form.user
        ? `${encodeURIComponent(form.user)}${form.password ? `:${encodeURIComponent(form.password)}` : ""}@`
        : "";
      const port = form.port ? `:${form.port}` : "";
      const path = form.path.startsWith("/") ? form.path : `/${form.path}`;
      return `rtsp://${auth}${form.ip}${port}${path}`;
    }
    return form.source;
  }

  async function handleSave() {
    setError(null);

    if (!form.name.trim()) {
      setError("Camera name is required.");
      return;
    }
    if (form.source_type === "rtsp" && !form.ip.trim()) {
      setError("IP address is required.");
      return;
    }
    if (form.source_type !== "rtsp" && !form.source.trim()) {
      setError("Source URL is required.");
      return;
    }

    const body = {
      name: form.name.trim(),
      source: buildSource(),
      source_type: form.source_type,
    };

    setSaving(true);
    try {
      // ✅ Step 1: Create camera
      const newCam = await createCamera(body);

      // ✅ Step 2: Auto-start immediately after creating
      // Don't block on start failure — camera is created regardless
      try {
        await startCamera(newCam.id);
      } catch {
        // start failure is non-fatal, camera still exists
      }

      // ✅ Step 3: Refresh list & close
      onAdded?.();
      onClose();
    } catch (e) {
      setError(
        e.message || "Failed to add camera. Check the backend connection.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[680px] relative flex flex-col max-h-[90vh]"
        style={{
          border: "1px solid #E8EFF5",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8 pb-5 flex-shrink-0">
          <h2
            className="font-poppins text-[18px] sm:text-[22px] font-semibold"
            style={{ color: "#01397C" }}
          >
            Add Camera
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(180deg, #05517E 0%, #0085D4 100%)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 sm:px-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-5">
            {/* Camera Name */}
            <Field label="Camera Name *">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              />
            </Field>

            {/* Source Type */}
            <Field label="Source Type">
              <select
                value={form.source_type}
                onChange={(e) => set("source_type", e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>

            {/* RTSP-specific fields */}
            {form.source_type === "rtsp" && (
              <>
                <Field label="IP Address *">
                  <input
                    type="text"
                    value={form.ip}
                    onChange={(e) => set("ip", e.target.value)}
                    placeholder="192.168.1.100"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </Field>

                <Field label="RTSP Port">
                  <input
                    type="text"
                    value={form.port}
                    onChange={(e) => set("port", e.target.value)}
                    placeholder="554"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </Field>

                <Field label="Username">
                  <input
                    type="text"
                    value={form.user}
                    onChange={(e) => set("user", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      className={`${inputClass} pr-11`}
                      style={inputStyle}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#01397C] transition-colors"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>

                <Field label="Stream Path">
                  <input
                    type="text"
                    value={form.path}
                    onChange={(e) => set("path", e.target.value)}
                    placeholder="/stream1"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </Field>

                {/* Preview URL */}
                <div className="sm:col-span-2">
                  <p className="font-poppins text-[11px] text-gray-400 mt-1">
                    Preview:{" "}
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: "#0085D4" }}
                    >
                      {buildSource()}
                    </span>
                  </p>
                </div>
              </>
            )}

            {/* Non-RTSP: raw source URL */}
            {form.source_type !== "rtsp" && (
              <div className="sm:col-span-2">
                <Field label="Source URL / Path *">
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => set("source", e.target.value)}
                    placeholder={
                      form.source_type === "file"
                        ? "/path/to/video.mp4"
                        : form.source_type === "usb"
                          ? "0"
                          : "http://..."
                    }
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 font-poppins text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              ⚠️ {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 sm:mt-8">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 sm:px-8 py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ border: "1.5px solid #01397C", color: "#01397C" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 sm:px-8 py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
              style={{
                background: "linear-gradient(180deg, #05517E 0%, #0085D4 100%)",
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Starting…" : "Save Camera"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
