import React from "react";
import AnalyticsStatCard from "../components/Analytics/AnalyticsStatCard";
import AnalyticsLineChart from "../components/Analytics/AnalyticsLineChart";
import AnalyticsDonutChart from "../components/Analytics/AnalyticsDonutChart";
import Footer from "../components/Common/Footer";
import {
  useAnalyticsSummary,
  useAnalyticsTimeseries,
} from "../hooks/useAnalytics";
import { statCards } from "../data/analyticsData";

// ── Merge API summary into statCards shape ───────────────────────────────────
function buildStatCards(summary) {
  return [
    {
      id: "crowd",
      title: "Crowd Detection",
      subtitle: "Peak Hr: 10Am to 11Am",
      count: summary?.crowdToday ?? null,
      iconKey: "crowd",
      miniDataKey: "crowd",
      miniChartType: "bar",
    },
    {
      id: "introgen",
      title: "Introgen Detection",
      count: summary?.totalAlerts ?? 14,
      highlight: "Most Insecure Zones",
      iconKey: "introgen",
      miniDataKey: null,
      miniChartType: null,
    },
    {
      id: "vehicle",
      title: "Vehicle Detection",
      subtitle: "Peak Hr: 10Am to 11Am",
      count: summary?.vehiclesToday ?? null,
      iconKey: "vehicle",
      miniDataKey: "vehicle",
      miniChartType: "bar",
    },
  ];
}

export default function AnalyticsPage({ isCollapsed = false }) {
  const { summary, loading: summaryLoading } = useAnalyticsSummary();
  const {
    people,
    vehicles,
    alerts,
    loading: tsLoading,
  } = useAnalyticsTimeseries();

  const cards = buildStatCards(summary);

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300
        left-0 md:left-[80px]
        ${isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"}
      `}
      style={{ background: "#F8F8F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 pt-4 px-3 sm:pt-5 sm:px-5">
          <h1
            className="text-xl sm:text-2xl font-semibold mb-4 flex-shrink-0"
            style={{ color: "#01397C" }}
          >
            Analytics Overview
          </h1>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0">
            {cards.map((card) => (
              <AnalyticsStatCard
                key={card.id}
                card={card}
                loading={summaryLoading && !summary}
              />
            ))}
          </div>

          {/* Charts */}
          <div
            className="mt-4 rounded-2xl flex flex-col p-4 gap-4 mb-2 flex-1 min-h-0"
            style={{ background: "#FFFFFF", minHeight: "680px" }}
          >
            {/* Row 1: People & Vehicle timeseries */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1 min-h-[300px]">
              {/* People */}
              <div className="h-[320px] sm:h-auto sm:flex-1 sm:min-w-0 sm:min-h-0 relative">
                {tsLoading && people.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  </div>
                )}
                <AnalyticsLineChart
                  title="People Detection Over Time"
                  data={people}
                  color="#22C55E"
                  gradientId="peopleGrad"
                  gradientStart="#8CF28C"
                  gradientEnd="rgba(21,150,21,0)"
                />
              </div>

              {/* Vehicle */}
              <div className="h-[320px] sm:h-auto sm:flex-1 sm:min-w-0 sm:min-h-0 relative">
                {tsLoading && vehicles.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                  </div>
                )}
                <AnalyticsLineChart
                  title="Vehicle Count"
                  data={vehicles}
                  color="#F59E0B"
                  gradientId="vehicleGrad"
                  gradientStart="#FFDF8C"
                  gradientEnd="rgba(248,201,79,0)"
                />
              </div>
            </div>

            {/* Row 2: Alert timeseries & Donut chart */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1 min-h-[300px]">
              {/* Alert timeseries */}
              <div className="h-[320px] sm:h-auto sm:flex-1 sm:min-w-0 sm:min-h-0 relative">
                {tsLoading && alerts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                  </div>
                )}
                <AnalyticsLineChart
                  title="Alerts Over Time"
                  data={alerts}
                  color="#F84F4F"
                  gradientId="alertGrad"
                  gradientStart="#FFB3B3"
                  gradientEnd="rgba(248,79,79,0)"
                />
              </div>

              {/* Donut chart */}
              <div className="h-[320px] sm:h-auto sm:flex-1 sm:min-w-0 sm:min-h-0">
                <AnalyticsDonutChart />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
