import { ChevronLeft, ChevronRight } from "lucide-react";
import dashboardIcon from "../../assets/dashboard.svg";
import monitoringIcon from "../../assets/monitoring.svg";
import analyticsIcon from "../../assets/analytics.svg";
import visionIqImg from "../../assets/visioniq.png";
import visionIqIcon from "../../assets/visioniq-icon.png";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, disabled: false },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: monitoringIcon,
    disabled: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: analyticsIcon,
    disabled: false,
  },
];

export default function Sidebar({
  active = "dashboard",
  onNavigate,
  isCollapsed,
  onToggle,
  mobileOpen = false,
}) {
  return (
    <aside
      className={[
        // Base — same as original
        "absolute left-0 top-0 h-full bg-white border-r border-[rgba(0,133,212,0.15)]",
        "z-20 flex flex-col transition-all duration-300 overflow-hidden",

        // Width — unchanged
        isCollapsed ? "w-[80px]" : "w-[280px]",

        // Mobile (<md): hidden off-screen by default, slides in when mobileOpen
        // md+: always visible (translate-x-0)
        "md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      {/* Logo — matches navbar height exactly */}
      <div className="flex items-center justify-center h-[80px] flex-shrink-0 bg-[#F8F8F8] border-b border-[rgba(0,133,212,0.2)]">
        <img
          src={isCollapsed ? visionIqIcon : visionIqImg}
          alt="Vision IQ"
          className={`w-auto object-contain transition-all duration-300 ${
            isCollapsed ? "h-[28px]" : "h-[62px]"
          }`}
        />
      </div>

      {/* Nav items */}
      <div className="flex flex-col pt-6 flex-1 min-h-0">
        {NAV_ITEMS.map(({ id, label, icon, disabled }) => {
          const isActive = active === id;

          return (
            <button
              key={id}
              disabled={disabled}
              onClick={() => !disabled && onNavigate?.(id)}
              title={isCollapsed ? label : undefined}
              className={`flex items-center gap-4 py-4 font-semibold font-poppins transition-colors w-full text-left outline-none focus:outline-none ${
                isCollapsed ? "justify-center px-0" : "justify-start px-7"
              } ${
                disabled
                  ? "opacity-40 cursor-not-allowed text-gray-400"
                  : isActive
                    ? ""
                    : "text-gray-500 hover:text-[#0085D4] hover:bg-blue-50"
              }`}
              style={
                isActive && !disabled
                  ? {
                      background:
                        "linear-gradient(to right, transparent 42px, #F8F8F8 64px)",
                    }
                  : {}
              }
            >
              <img src={icon} alt={label} className="w-6 h-6 flex-shrink-0" />

              {!isCollapsed && (
                <span
                  className={`font-poppins text-[16px] font-normal leading-none ${
                    isActive && !disabled
                      ? "bg-gradient-to-r from-[#01397C] to-[#0268E2] bg-clip-text text-transparent"
                      : ""
                  }`}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse toggle — desktop only so it never fires silently on mobile/tablet */}
      <button
        onClick={onToggle}
        className={`mb-5 hidden lg:flex items-center py-3 transition-colors w-full text-gray-400 hover:text-[#0085D4] hover:bg-blue-50 outline-none focus:outline-none ${
          isCollapsed ? "justify-center px-0" : "gap-4 px-7"
        }`}
      >
        {isCollapsed ? (
          <ChevronRight size={18} />
        ) : (
          <>
            <ChevronLeft size={18} />
            <span className="font-poppins text-[14px] font-normal whitespace-nowrap">
              Collapse
            </span>
          </>
        )}
      </button>
    </aside>
  );
}
