import React from "react";
import {
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { miniCrowdBarData, miniVehicleBarData } from "../../data/analyticsData";
import crowdIcon from "../../assets/crowddetection.svg";
import introgenIcon from "../../assets/introgen.svg";
import vehicleIcon from "../../assets/vehicledetection.svg";

/* ─── icons ──────────────────────────────────────────────────────────────── */
const icons = {
  crowd: (
    <img
      src={crowdIcon}
      alt="Crowd"
      className="w-10 h-10 object-contain flex-shrink-0"
    />
  ),
  introgen: (
    <img
      src={introgenIcon}
      alt="Introgen"
      className="w-10 h-10 object-contain flex-shrink-0"
    />
  ),
  vehicle: (
    <img
      src={vehicleIcon}
      alt="Vehicle"
      className="w-10 h-10 object-contain flex-shrink-0"
    />
  ),
};

/* ─── animation ──────────────────────────────────────────────────────────── */
const STYLE = `
  @keyframes chartIn {
    from { opacity:0; transform:translateY(5px); }
    to   { opacity:1; transform:translateY(0);   }
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   CROWD  —  smooth gradient area chart
   Brand blue (#0085D4) fill that fades to transparent.
   Crisp 2 px stroke line rides the wave.
   Peak naturally forms a visual mountain — no extra decoration needed.
══════════════════════════════════════════════════════════════════════════ */
const CrowdChart = () => (
  <div style={{ marginTop: 12, animation: "chartIn .5s ease both" }}>
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart
        data={miniCrowdBarData}
        margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
      >
        <defs>
          <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0085D4" stopOpacity={0.3} />
            <stop offset="70%" stopColor="#0085D4" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#0085D4" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        <Area
          type="monotone"
          dataKey="v"
          stroke="#0085D4"
          strokeWidth={2.2}
          fill="url(#cGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#0085D4", strokeWidth: 0 }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />

        <Tooltip
          contentStyle={{
            background: "#0085D4",
            border: "none",
            borderRadius: 6,
            padding: "2px 8px",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(v) => [v, ""]}
          cursor={{ stroke: "#0085D433", strokeWidth: 1 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   VEHICLE  —  ComposedChart: rounded purple bars + trend line on top
   Bars give presence; line gives rhythm and movement.
   Two very different visual languages in one tight space.
══════════════════════════════════════════════════════════════════════════ */

/* Custom rounded-top bar shape */
const RoundBar = (props) => {
  const { x, y, width, height } = props;
  if (!height || height <= 0) return null;
  const r = Math.min(3, width / 2);
  return (
    <path
      d={`
        M ${x},${y + height}
        L ${x},${y + r}
        Q ${x},${y} ${x + r},${y}
        L ${x + width - r},${y}
        Q ${x + width},${y} ${x + width},${y + r}
        L ${x + width},${y + height}
        Z
      `}
      fill="url(#vBarGrad)"
    />
  );
};

const VehicleChart = () => (
  <div style={{ marginTop: 12, animation: "chartIn .5s ease both" }}>
    <ResponsiveContainer width="100%" height={60}>
      <ComposedChart
        data={miniVehicleBarData}
        margin={{ top: 6, right: 4, left: 4, bottom: 0 }}
        barCategoryGap="28%"
      >
        <defs>
          <linearGradient id="vBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.2} />
          </linearGradient>
        </defs>

        {/* Bars */}
        <Bar
          dataKey="v"
          shape={<RoundBar />}
          isAnimationActive
          animationDuration={800}
          animationEasing="ease-out"
        />

        {/* Trend line riding the bar tops */}
        <Line
          type="monotone"
          dataKey="v"
          stroke="#6d28d9"
          strokeWidth={1.8}
          dot={false}
          activeDot={{ r: 3.5, fill: "#6d28d9", strokeWidth: 0 }}
          isAnimationActive
          animationDuration={1100}
          animationEasing="ease-out"
          style={{ filter: "drop-shadow(0 1px 4px #7c3aed88)" }}
        />

        <Tooltip
          contentStyle={{
            background: "#6d28d9",
            border: "none",
            borderRadius: 6,
            padding: "2px 8px",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(v) => [v, ""]}
          cursor={{ fill: "#7c3aed11" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

/* ─── Card ───────────────────────────────────────────────────────────────── */
const AnalyticsStatCard = ({ card }) => {
  const {
    title,
    subtitle,
    iconKey,
    miniDataKey,
    miniChartType,
    count,
    highlight,
  } = card;

  return (
    <>
      <style>{STYLE}</style>

      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col justify-between border border-[#0085D44D]">
        <div className="flex items-start gap-3">
          {icons[iconKey]}
          <div className="min-w-0">
            <h3 className="text-gray-800 font-semibold text-base truncate">
              {title}
            </h3>

            {subtitle && (
              <p className="font-poppins text-xs mt-1 text-center text-[#0085D4]">
                • {subtitle}
              </p>
            )}

            {count !== undefined && (
              <div className="flex flex-col items-start mt-6">
                <p className="text-4xl sm:text-5xl font-bold text-gray-800">
                  {count}
                </p>
                {highlight && (
                  <p className="font-poppins text-xs mt-2 text-[#C21807]">
                    • {highlight}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {miniChartType === "bar" && miniDataKey === "crowd" && <CrowdChart />}
        {miniChartType === "bar" && miniDataKey === "vehicle" && (
          <VehicleChart />
        )}
      </div>
    </>
  );
};

export default AnalyticsStatCard;
