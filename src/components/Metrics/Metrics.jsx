export default function Metrics({ metrics }) {
  const items = [
    {
      label: "IN",
      value: metrics?.in ?? 0,
      color: "#22c55e",
      dark: "#15803d",
      emoji: "↙",
    },
    {
      label: "OUT",
      value: metrics?.out ?? 0,
      color: "#f59e0b",
      dark: "#b45309",
      emoji: "↗",
    },
    {
      label: "TOTAL",
      value: metrics?.total ?? 0,
      color: "#0085D4",
      dark: "#024167",
      emoji: "⬡",
    },
    {
      label: "IN FRAME",
      value: metrics?.inFrame ?? 0,
      color: "#a855f7",
      dark: "#7e22ce",
      emoji: "◈",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden py-4 px-2"
          style={{
            background: `linear-gradient(145deg, ${item.color}, ${item.dark})`,
            boxShadow: `0 8px 24px ${item.color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        >
          {/* Shiny top reflection */}
          <div
            className="absolute top-0 left-0 right-0 h-[45%] rounded-t-2xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
            }}
          />

          {/* Big decorative letter bg */}
          <div
            className="absolute -right-1 -bottom-2 text-6xl font-black select-none pointer-events-none"
            style={{ color: "rgba(255,255,255,0.1)", lineHeight: 1 }}
          >
            {item.emoji}
          </div>

          {/* Value */}
          <span
            className="text-4xl font-black text-white z-10 leading-none"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
          >
            {item.value}
          </span>

          {/* Label */}
          <span
            className="text-[xs] font-bold tracking-[0.2em] uppercase mt-1.5 z-10"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
