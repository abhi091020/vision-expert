import logoImg from "../../assets/DALOGO.png";
import { useBackendStatus } from "../../hooks/useBackendStatus";

export default function Navbar() {
  const status = useBackendStatus();

  const dot =
    status === "online"
      ? "bg-green-400 animate-pulse"
      : status === "offline"
        ? "bg-red-500"
        : "bg-yellow-400 animate-pulse";

  const label =
    status === "online"
      ? "Backend Online"
      : status === "offline"
        ? "Backend Offline"
        : "Connecting...";

  const labelColor =
    status === "online"
      ? "text-green-600"
      : status === "offline"
        ? "text-red-500"
        : "text-yellow-500";

  return (
    <header className="absolute top-0 left-0 w-full z-10 bg-white flex items-center justify-between px-[2vw] py-[0.8vh] border-b border-[rgba(0,133,212,0.3)]">
      {/* Logo + Title */}
      <div className="flex items-center ml-[3vw]">
        <img
          src={logoImg}
          alt="DAccess Logo"
          className="h-[6.5vh] w-auto object-contain"
        />
        <h1 className="text-[clamp(18px,2vw,32px)] font-medium whitespace-nowrap ml-[5vw] pt-[1.5vh] m-0 bg-gradient-to-r from-[#0F345E] to-[#0085D4] bg-clip-text text-transparent">
          Vision Expert
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-[2vw] mr-[3vw]">
        {/* Backend Status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <span
            className={`text-xs font-semibold whitespace-nowrap ${labelColor}`}
          >
            {label}
          </span>
        </div>

        {/* Avatar */}
        <div className="w-[clamp(36px,4vw,56px)] h-[clamp(36px,4vw,56px)] rounded-full bg-[#cce8f6] flex items-center justify-center cursor-pointer shrink-0">
          <span className="text-[#0085D4] font-bold text-[clamp(13px,1.3vw,20px)] select-none">
            A
          </span>
        </div>
      </div>
    </header>
  );
}
