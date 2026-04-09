import { useState } from "react";
import { apiPostForm, apiPost } from "../../api/client";

export default function FileUpload({ onStreamStart, onStreamStop }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadedName, setUploadedName] = useState(null);

  function handleFile(e) {
    const selected = e.target.files[0] ?? null;
    setFile(selected);
    setUploadedName(null);
    setProcessing(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setUploadedName(null);
    }
  }

  async function handleStart() {
    if (!file) return;
    setUploading(true);
    try {
      // Step 1 — stop any active stream first
      try {
        await apiPost("/stop_stream");
        onStreamStop?.();
      } catch (_) {}

      // Step 2 — upload file
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await apiPostForm("/upload", fd);
      if (uploadRes.status !== "success") throw new Error("Upload failed");
      setUploadedName(uploadRes.filename);

      // Step 3 — start people-counter stream
      const processRes = await apiPost("/process_file", {
        filename: uploadRes.filename,
      });

      if (
        processRes.status === "success" ||
        processRes.status === "processing"
      ) {
        setProcessing(true);
        onStreamStart?.();

        // Step 4 — Animal detection (non-blocking, 1.5s delay so stream renders first)
        setTimeout(async () => {
          try {
            const animalFd = new FormData();
            animalFd.append("file", file);
            const animalRes = await apiPostForm(
              "/animal/detect?camera_id=1",
              animalFd,
            );
            window.dispatchEvent(
              new CustomEvent("animalDetected", { detail: animalRes }),
            );
          } catch (_) {
            // Non-blocking — stream continues regardless
          }
        }, 1500);

        // Step 5 — Fire detection (non-blocking, 2s delay to stagger model loads)
        setTimeout(async () => {
          try {
            const fireFd = new FormData();
            fireFd.append("file", file);
            const fireRes = await apiPostForm(
              "/fire/detect?camera_id=1",
              fireFd,
            );
            // Normalise to match FireDetection component's expected shape:
            // { detected, status, image, camera_id }
            window.dispatchEvent(
              new CustomEvent("fireDetected", {
                detail: {
                  detected: fireRes.detected ?? false,
                  status: fireRes.status ?? fireRes.type ?? "No Detection",
                  image: fireRes.image ?? fireRes.annotated_image ?? null,
                  camera_id: fireRes.camera_id ?? "1",
                },
              }),
            );
          } catch (_) {
            // Non-blocking — stream continues regardless
          }
        }, 2000);
      } else {
        throw new Error(
          "Process failed: " + (processRes.message ?? "unknown error"),
        );
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleStop() {
    try {
      await apiPost("/stop_stream");
      setProcessing(false);
      setUploadedName(null);
      setFile(null);
      onStreamStop?.();
    } catch (e) {
      alert("Stop failed: " + e.message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="w-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all py-8 gap-3"
        style={{
          border: `2px dashed ${dragging ? "#0085D4" : "#cbd5e1"}`,
          background: dragging
            ? "rgba(0,133,212,0.05)"
            : "rgba(248,250,252,0.8)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
          style={{ background: "linear-gradient(135deg, #e0f2fe, #bae6fd)" }}
        >
          📁
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-600">
            Drop file here or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">Supports MP4, JPG, PNG</p>
        </div>
        <input
          type="file"
          accept="video/mp4,image/jpeg,image/png"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      {/* Selected File */}
      {file && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            border: "1px solid #bbf7d0",
          }}
        >
          <span className="text-xl">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-700 truncate">
              {file.name}
            </p>
            <p className="text-xs text-green-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
              {uploadedName ? " — Uploaded ✓" : " — Ready"}
            </p>
          </div>
          {!processing && (
            <button
              onClick={() => {
                setFile(null);
                setUploadedName(null);
              }}
              className="text-green-400 hover:text-red-400 text-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Action Button */}
      {!processing ? (
        <button
          onClick={handleStart}
          disabled={!file || uploading}
          className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-wide shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
          }}
        >
          {uploading ? "UPLOADING..." : "START PROCESSING"}
        </button>
      ) : (
        <button
          onClick={handleStop}
          className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-wide shadow-md animate-pulse"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)",
          }}
        >
          STOP PROCESSING
        </button>
      )}
    </div>
  );
}
