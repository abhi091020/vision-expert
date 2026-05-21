import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { eventsData } from "../../data/analyticsData";

const total = eventsData.reduce((sum, d) => sum + d.value, 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, payload: p } = payload[0];
    const pct = ((value / total) * 100).toFixed(0);
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
        <div className="flex items-center gap-1 mb-1">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: p.color }}
          />
          <span className="text-gray-600">{name}</span>
        </div>
        <p className="text-gray-800 font-semibold">
          {value} ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsDonutChart = () => {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col h-full"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">
        Events By Type
      </h3>

      <div className="flex flex-row items-stretch flex-1 min-h-0 gap-3">
        {/*
          Donut column — w-1/2 of card width.
          The card row height (set by flex parent in AnalyticsPage) is shorter
          than the column width at desktop, so Recharts uses height as the
          bounding dimension. outerRadius="88%" squeezes the circle right up
          to the edge of that shorter dimension so nothing is wasted.
        */}
        <div className="relative w-1/2 flex-shrink-0">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Pie
                  data={eventsData}
                  cx="50%"
                  cy="50%"
                  innerRadius="36%"
                  outerRadius="88%"
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + r * Math.cos(-midAngle * RADIAN);
                    const y = cy + r * Math.sin(-midAngle * RADIAN);
                    return percent > 0.06 ? (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight="700"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    ) : null;
                  }}
                >
                  {eventsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-sm sm:text-base lg:text-xl font-bold text-gray-800 leading-none">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5">
                Total
              </span>
            </div>
          </div>
        </div>

        {/*
          Legend — flex-1 fills remaining width.
          text-xs (12px) is the minimum — readable on any screen.
          sm:text-sm (14px) on tablet+, lg:text-sm stays at 14px on desktop
          since the legend column isn't very wide.
          gap scales up with screen size so items breathe on taller cards.
        */}
        <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-2.5 lg:gap-3 min-w-0">
          {eventsData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs sm:text-sm text-gray-700 leading-tight truncate">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDonutChart;
