import totalCam from "../../assets/totalcam.svg";
import activeAlert from "../../assets/activealert.svg";
import peopleDetected from "../../assets/peopledetected.svg";
import vehicleCount from "../../assets/vehiclecount.svg";
import { useAnalyticsSummary } from "../../hooks/useAnalytics";
import { useClones } from "../../hooks/useClones";

function StatCard({ id, label, value, sub, subColor, icon, iconBg, loading }) {
  return (
    <div
      key={id}
      className="bg-white rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
      style={{ border: "1px solid #E8EFF5" }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <img
          src={icon}
          alt={label}
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
        />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
        <p
          className="font-poppins text-[11px] sm:text-[13px] font-medium leading-tight"
          style={{ color: "#6B7280" }}
        >
          {label}
        </p>

        {/* Value — shimmer while loading */}
        {loading ? (
          <div className="h-7 w-16 rounded-md bg-gray-100 animate-pulse" />
        ) : (
          <p
            className="font-poppins text-[22px] sm:text-[28px] font-semibold leading-none"
            style={{ color: "#080808" }}
          >
            {value}
          </p>
        )}

        <p
          className="font-poppins text-[11px] sm:text-[12px] font-medium leading-none"
          style={{ color: subColor }}
        >
          • {sub}
        </p>
      </div>
    </div>
  );
}

export default function StatCards() {
  const { summary, loading: summaryLoading } = useAnalyticsSummary();
  const { clones, loading: clonesLoading } = useClones();

  // Derive active clone count from the clones list directly
  const totalClones = clones?.length ?? 0;
  const activeClones =
    clones?.filter((c) => c.running ?? c.status === "running").length ?? 0;

  const loading = summaryLoading && !summary;

  const stats = [
    {
      id: "cameras",
      label: "Total Cameras",
      value: summary?.totalCameras ?? "—",
      sub: `Active: ${summary?.activeCameras ?? "—"}`,
      subColor: "#159615",
      icon: totalCam,
      iconBg: "#EAF4FB",
    },
    {
      id: "clones",
      label: "Total Clones",
      value: clonesLoading && totalClones === 0 ? "—" : totalClones,
      sub: `Active: ${clonesLoading && totalClones === 0 ? "—" : activeClones}`,
      subColor: "#7C3AED",
      icon: peopleDetected, // swap for a clone/fork icon asset when available
      iconBg: "#F5F3FF",
    },
    {
      id: "alerts",
      label: "Active Alerts",
      value: summary?.totalAlerts ?? "—",
      sub: `Critical: ${
        summary?.criticalAlerts != null
          ? String(summary.criticalAlerts).padStart(2, "0")
          : "—"
      }`,
      subColor: "#C21807",
      icon: activeAlert,
      iconBg: "#FEF2F2",
    },
    {
      id: "detections",
      label: "Detections Today",
      value: summary?.eventsToday ?? "—",
      sub: "All modes combined",
      subColor: "#0085D4",
      icon: vehicleCount, // swap for a detections icon asset when available
      iconBg: "#EEF2FF",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
      {stats.map((s) => (
        <StatCard key={s.id} {...s} loading={loading} />
      ))}
    </div>
  );
}
