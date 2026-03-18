import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Header from "./Header";
import TabHeader from "./TabHeader";

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const location = useLocation();
  const userRole = localStorage.getItem("role") || "EMPLOYEE";
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  useEffect(() => {
    const syncWithViewport = () => {
      // On large screens, keep sidebar open by default
      if (window.innerWidth >= 1024) {
        setIsSidebarVisible(true);
      }
    };

    syncWithViewport();
    window.addEventListener("resize", syncWithViewport);
    return () => window.removeEventListener("resize", syncWithViewport);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isVisible={isSidebarVisible} userRole={userRole} />

      {/* Mobile backdrop when sidebar open */}
      {isSidebarVisible && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="min-w-0 lg:pl-72">
        <div className="sticky top-0 z-30">
          <Header toggleSidebar={toggleSidebar} />
        </div>

        <TabHeader pathname={location.pathname} />

        <main className="p-3 sm:p-4 lg:p-6">
          <Outlet />
          {location.pathname === "/companyProfile"}
        </main>
      </div>
    </div>
  );
};
