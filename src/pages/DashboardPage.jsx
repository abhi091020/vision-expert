import { useState } from "react";
import StatCards from "../components/Dashboard/StatCards";
import LiveCamera from "../components/Dashboard/LiveCamera";
import RealTimeAlerts from "../components/Dashboard/RealTimeAlerts";
import Footer from "../components/Common/Footer";

export default function DashboardPage({ isCollapsed = false }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300
  left-0 md:left-[80px]
  ${isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"}
`}
      style={{ background: "#F8F8F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col pt-4 px-3 sm:pt-5 sm:px-5 min-h-0">
          <h1
            className="text-xl sm:text-2xl font-semibold mb-4 flex-shrink-0"
            style={{ color: "#01397C" }}
          >
            Dashboard Overview
          </h1>
          <StatCards />
          {/* flex-1 min-h-0 so this row fills remaining space */}
          <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0 pb-2">
            <LiveCamera selectedAlert={selectedAlert} />
            <RealTimeAlerts
              selectedAlert={selectedAlert}
              onSelectAlert={setSelectedAlert}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
