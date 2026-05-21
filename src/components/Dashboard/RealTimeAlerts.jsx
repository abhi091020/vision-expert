import { useAlerts } from "../../hooks/useAlerts";
import { getEventSnapshotUrl } from "../../api/events";

function AlertSkeleton() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 animate-pulse flex-shrink-0">
      <div className="w-[72px] h-[54px] sm:w-[96px] sm:h-[72px] rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function RealTimeAlerts({ selectedAlert, onSelectAlert }) {
  const { alerts, loading, handleAck } = useAlerts({}, 5000);

  return (
    <div
      className="w-full xl:w-[42%] bg-white rounded-2xl p-4 sm:p-5 flex flex-col flex-shrink-0 min-h-0"
      style={{ border: "1px solid #E8EFF5" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2
          className="font-poppins text-[15px] sm:text-[16px] font-semibold"
          style={{ color: "#374151" }}
        >
          Real Time Alerts
        </h2>
        {alerts.length > 0 && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #C21807, #ef4444)" }}
          >
            {alerts.filter((a) => !a.acknowledged).length} New
          </span>
        )}
      </div>

      {/* List */}
      <div
        className="flex flex-col gap-3 sm:gap-4 overflow-y-auto pr-1 flex-1 min-h-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#0085D420 transparent",
        }}
      >
        {/* Loading skeletons */}
        {loading && alerts.length === 0 && (
          <>
            <AlertSkeleton />
            <AlertSkeleton />
            <AlertSkeleton />
          </>
        )}

        {/* Empty state */}
        {!loading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-10">
            <span className="text-3xl mb-2">🔔</span>
            <p className="text-sm font-medium font-poppins">
              No alerts right now
            </p>
          </div>
        )}

        {/* Alert rows */}
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => onSelectAlert(alert)}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-colors text-left w-full hover:bg-gray-50 flex-shrink-0 group"
            style={
              selectedAlert?.id === alert.id
                ? { background: "#EAF4FB", border: "1px solid #0085D430" }
                : { border: "1px solid #E8EFF5" }
            }
          >
            {/* Thumbnail — event snapshot if available */}
            <div className="w-[72px] h-[54px] sm:w-[96px] sm:h-[72px] rounded-lg flex-shrink-0 overflow-hidden bg-[#1e293b]">
              {alert.event_id && (
                <img
                  src={getEventSnapshotUrl(alert.event_id)}
                  alt="snapshot"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="font-poppins text-[14px] sm:text-[16px] font-semibold leading-none"
                style={{ color: "#023350" }}
              >
                {alert.type}
              </p>
              <p
                className="font-poppins text-[11px] sm:text-[13px] font-normal leading-none mt-1.5 sm:mt-2"
                style={{ color: "#6B7280" }}
              >
                Camera ID: {alert.camId}
              </p>
              <p
                className="font-poppins text-[11px] sm:text-[13px] font-medium leading-none mt-1.5 sm:mt-2"
                style={{ color: "#6B7280" }}
              >
                {alert.uiTime} • {alert.uiDate}
              </p>
            </div>

            {/* Right side: severity + ack button */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span
                className="font-poppins text-[11px] sm:text-[13px] font-semibold flex items-center justify-center"
                style={{
                  color: alert.uiSeverityColor,
                  background: `${alert.uiSeverityColor}18`,
                  border: `1px solid ${alert.uiSeverityColor}50`,
                  borderRadius: "20px",
                  padding: "5px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.uiSeverity}
              </span>

              {/* Acknowledge button — visible on hover or if unacknowledged */}
              {!alert.acknowledged && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAck(alert.id);
                  }}
                  className="text-[10px] font-poppins font-medium text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Acknowledge
                </button>
              )}
              {alert.acknowledged && (
                <span className="text-[10px] font-poppins text-green-500">
                  ✓ Ack'd
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
