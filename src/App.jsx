import { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import MonitoringPage from "./pages/MonitoringPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AddCameraModal from "./components/Monitoring/AddCameraModal";

export default function App() {
  const [activePage, setActivePage] = useState(
    () => localStorage.getItem("activePage") || "dashboard",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddCamera, setShowAddCamera] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Tablet and below → always collapsed
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
      // Grow past mobile → close the drawer
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigate = (page) => {
    localStorage.setItem("activePage", page);
    setActivePage(page);
    setMobileOpen(false); // close drawer after navigating on mobile
  };

  // Only allow expand/collapse on lg+
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((c) => !c);
    }
  };

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: "#F8F8F8" }}
    >
      <Navbar
        isCollapsed={sidebarCollapsed}
        onHamburgerClick={() => setMobileOpen((o) => !o)}
      />

      {/* Dim overlay behind the mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={activePage}
          onNavigate={handleNavigate}
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
          mobileOpen={mobileOpen}
        />

        <main className="flex-1 overflow-hidden">
          {activePage === "dashboard" && (
            <DashboardPage isCollapsed={sidebarCollapsed} />
          )}
          {activePage === "monitoring" && (
            <MonitoringPage
              isCollapsed={sidebarCollapsed}
              onAddCamera={() => setShowAddCamera(true)}
            />
          )}
          {activePage === "analytics" && (
            <AnalyticsPage isCollapsed={sidebarCollapsed} />
          )}
        </main>
      </div>

      {showAddCamera && (
        <AddCameraModal onClose={() => setShowAddCamera(false)} />
      )}
    </div>
  );
}
