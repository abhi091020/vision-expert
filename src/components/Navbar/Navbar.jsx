import { Bell, Menu } from "lucide-react";
import hyundaiLogo from "../../assets/hyundai.svg";
import { useBackendStatus } from "../../hooks/useBackendStatus";

export default function Navbar({ isCollapsed = false, onHamburgerClick }) {
  const status = useBackendStatus();

  return (
    <header className="absolute top-0 left-0 w-full z-10 bg-white border-b border-[rgba(0,133,212,0.2)] flex items-center justify-between h-[80px]">
      {/*
        Spacer mirrors sidebar width — unchanged from original:
          mobile (<768px) : sidebar hidden → spacer = 0
          md  (768–1023px): sidebar always 80px icon mode → spacer = 80px
          lg+ (1024px+)   : follows isCollapsed → 80px or 280px
      */}
      <div
        className={`flex-shrink-0 transition-all duration-300
          w-0
          md:w-[80px]
          ${isCollapsed ? "lg:w-[80px]" : "lg:w-[280px]"}
        `}
      />

      {/* Hamburger — mobile only, sits just after the zero-width spacer */}
      <button
        onClick={onHamburgerClick}
        className="md:hidden flex items-center justify-center w-9 h-9 mr-1 rounded-lg hover:bg-[#e8f4fc] transition-colors flex-shrink-0"
        aria-label="Toggle menu"
      >
        <Menu size={20} color="#0085D4" />
      </button>

      {/* Hyundai logo */}
      <div className="flex-1 flex items-center justify-start pl-2 md:pl-6">
        <img
          src={hyundaiLogo}
          alt="Hyundai"
          className="h-[40px] md:h-[52px] w-auto object-contain"
        />
      </div>

      {/* Right — Bell + Avatar */}
      <div className="flex items-center gap-2 md:gap-3 pr-3 md:pr-5 flex-shrink-0">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#e8f4fc] transition-colors">
          <Bell size={20} color="#0085D4" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        <button
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-90 transition-colors"
          style={{ backgroundColor: "#025283" }}
        >
          <span
            className="font-poppins text-[12px] font-medium leading-none select-none"
            style={{ color: "#FFFFFF" }}
          >
            TK
          </span>
        </button>
      </div>
    </header>
  );
}
