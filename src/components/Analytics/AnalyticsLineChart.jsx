import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChevronDown } from "lucide-react";

const CustomTooltip = ({ active, payload, label, color }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
        <p className="text-gray-500 mb-1">{label}</p>
        <p style={{ color }} className="font-semibold">
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsLineChart = ({
  title,
  data,
  color,
  gradientId,
  gradientStart,
  gradientEnd,
}) => {
  const [period] = useState("Daily");
  const chartRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!chartRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col h-full"
      style={{ border: "1px solid #0085D44D" }}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <button className="flex items-center gap-1 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition">
          {period} <ChevronDown size={13} />
        </button>
      </div>

      {/* ResizeObserver measures this div — passes real px to AreaChart */}
      <div ref={chartRef} className="flex-1 min-h-[240px]">
        {dims.width > 0 && dims.height > 0 && (
          <AreaChart
            width={dims.width}
            height={dims.height}
            data={data}
            margin={{ top: 4, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={gradientStart || color}
                  stopOpacity={gradientStart ? 1 : 0.35}
                />
                <stop
                  offset="100%"
                  stopColor={gradientEnd || color}
                  stopOpacity={gradientEnd ? 1 : 0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              domain={[0, "dataMax + 100"]}
            />
            <Tooltip content={<CustomTooltip color={color} />} />
            <Area
              type="linear"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        )}
      </div>
    </div>
  );
};

export default AnalyticsLineChart;
