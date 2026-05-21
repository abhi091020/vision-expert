import { Loader2 } from "lucide-react";

/**
 * ConfirmModal — reusable confirmation dialog
 *
 * Props:
 *   open        boolean        — show/hide
 *   title       string         — modal heading
 *   message     string         — body text
 *   confirmText string         — confirm button label (default "Confirm")
 *   cancelText  string         — cancel button label  (default "Cancel")
 *   variant     "danger"|"primary"  — button color (default "danger")
 *   loading     boolean        — shows spinner on confirm button
 *   onConfirm   () => void     — confirm callback
 *   onCancel    () => void     — cancel / close callback
 *
 * Usage:
 *   <ConfirmModal
 *     open={showDelete}
 *     title="Delete Camera"
 *     message={`Remove "${cam.name}"? This cannot be undone.`}
 *     confirmText="Delete"
 *     variant="danger"
 *     loading={deleting}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowDelete(false)}
 *   />
 */
export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmBg =
    variant === "danger"
      ? "linear-gradient(180deg, #c62828 0%, #ef4444 100%)"
      : "linear-gradient(180deg, #05517E 0%, #0085D4 100%)";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] p-6 sm:p-8 flex flex-col gap-5"
        style={{
          border: "1px solid #E8EFF5",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: variant === "danger" ? "#fef2f2" : "#eff6ff",
            }}
          >
            {variant === "danger" ? "🗑️" : "💾"}
          </div>
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-2">
          <h3
            className="font-poppins text-[17px] sm:text-[19px] font-semibold"
            style={{ color: "#023350" }}
          >
            {title}
          </h3>
          {message && (
            <p
              className="font-poppins text-[13px] sm:text-[14px] leading-relaxed"
              style={{ color: "#6B7280" }}
            >
              {message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ border: "1.5px solid #D1D5DB", color: "#374151" }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: confirmBg }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
