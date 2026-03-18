import { useState } from "react";
import AllowanceSettings from "../components/CompanyProfile/AllowanceSettings";
import LeaveSettings from "../components/CompanyProfile/LeaveSettings";
import OTSetting from "../components/CompanyProfile/OTSetting";
import BonusSettings from "../components/CompanyProfile/BonusSetting";
import Profile from "../components/CompanyProfile/Profile";
import PasswordReset from "../components/CompanyProfile/ResetPassword";
import Department from "../components/CompanyProfile/Department";
import EmployeeProfile from "./Employee/EmployeeProfile";

// Define the types for our tabs
type Tab = {
  id: string;
  label: string;
  component: JSX.Element;
  roles: string[]; // Which roles can access this tab
};

const CompanyProfile = () => {
  // Get user role from localStorage (default to 'EMPLOYEE' if not set)
  const userRole = localStorage.getItem("role") || "EMPLOYEE";
  const [activeTab, setActiveTab] = useState("profile");

  // Define all possible tabs with their access roles
  const allTabs: Tab[] = [
    {
      id: "profile",
      label: "Profile",
      component: <Profile />,
      roles: ["CMPNY", "HR", "MANAGER"] 
    },

    {
      id: "department",
      label: "Department",
      component: <Department />,
      roles: ["CMPNY", "HR"] 
    },
    {
      id: "allowance",
      label: "Allowance Settings",
      component: <AllowanceSettings />,
      roles: ["CMPNY", "HR"] 
    },
    {
      id: "leave",
      label: "Leave Settings",
      component: <LeaveSettings />,
      roles: ["CMPNY", "HR"] 
    },
    {
      id: "payrole",
      label: "OT Settings",
      component: <OTSetting />,
      roles: ["CMPNY", "HR"] 
    },
    {
      id: "bonus",
      label: "Bonus Settings",
      component: <BonusSettings />,
      roles: ["CMPNY"] 
    },
    {
      id: "emp-profile",
      label: " Profile",
      component: <EmployeeProfile />,
      roles: ["EMPLOYEE"] 
    },
    {
      id: "resetPassword",
      label: "Security",
      component: <PasswordReset />,
      roles: ["CMPNY", "HR", "MANAGER", "EMPLOYEE"] 
    }
    
  ];

  // Filter tabs based on user role
  const availableTabs = allTabs.filter(tab => tab.roles.includes(userRole));

  // Set active tab to first available if current active tab is not available
  if (!availableTabs.some(tab => tab.id === activeTab) && availableTabs.length > 0) {
    setActiveTab(availableTabs[0].id);
  }

  return (
    <div className="min-h-screen">
      {/* Main Container */}
      <div className="bg-gray-100 w-full max-w-full mx-auto transition-all duration-500 -mt-10">
        {/* Tab Navigation */}
        {availableTabs.length > 0 && (
          <div className="flex space-x-4 border-b border-gray-300 mb-6 overflow-x-auto">
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2 text-md font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-sky-500 border-b-2 border-sky-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {availableTabs.map(tab => (
          <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
            {tab.component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyProfile;
