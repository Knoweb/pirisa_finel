import React from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarAlt,
  FaDollarSign,
  FaChartBar,
  FaAccusoft,
  FaBuilding,
} from "react-icons/fa";
import { TranslatableText } from "../languages/TranslatableText";
import CrossAppNavButton from "./CrossAppNavButton";

interface TabHeaderProps {
  pathname: string;
}

const TabHeader: React.FC<TabHeaderProps> = ({ pathname }) => {
  // Extract active tab and subtab from pathname
  const getActiveTabInfo = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    return {
      activeTab: parts[0] || "dashboard",
      activeSubTab: parts[1] || "",
    };
  };

  const { activeTab, activeSubTab } = getActiveTabInfo(pathname);

  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case "dashboard":
        return <FaTachometerAlt className="text-xl mr-2" />;
      case "employee":
        return <FaUsers className="text-xl mr-2" />;
      case "attendance":
        return <FaCalendarAlt className="text-xl mr-2" />;
      case "payrole":
        return <FaDollarSign className="text-xl mr-2" />;
      case "leave":
        return <FaAccusoft className="text-xl mr-2" />;
      case "performance":
        return <FaChartBar className="text-xl mr-2" />;
      case "department":
        return <FaBuilding className="text-xl mr-2" />;
      case "reports":
        return <FaChartBar className="text-xl mr-2" />;
      case "pay-role-list":
        return <FaDollarSign className="text-xl mr-2" />;
      case "employee-dashboard":
        return <FaTachometerAlt className="text-xl mr-2" />; 
      default:
        return null;
    }
  };

  const getTabLabel = (tabId: string) => {
    switch (tabId) {
      case "dashboard":
        return "Dashboard";
      case "employee":
        return "Employee";
      case "attendance":
        return "Attendance";
      case "payrole":
        return "Payrole";
      case "leave":
        return "Leave";
      case "performance":
        return "Performance Appraisal";
      case "department":
        return "Department";
      case "reports":
        return "Reports";
      case "pay-role-list":
        return "Payrole List";    
      case "employee-dashboard":
        return "Employee Dashboard";
      case "emp-leave":
        return "Employee Leave";  
      default:
        return "";
    }
  };

  const getSubTabLabel = (tabId: string, subTabId: string) => {
    const subTabMappings: Record<string, Record<string, string>> = {
      dashboard: {
        daily: "Daily",
        "summary-report": "Summary Report",
      },
      employee: {
        all: "All Employees",
        new: "New Employee",
        edit: "Edit Employee",
      },
      attendance: {
        list: "Attendance List",
        mark: "Mark Attendance",
      },
      payrole: {
        salary: "Salary List",
        makesalary: "Make Salary",
        payslips: "Pay Slips",
      },
      leave: {
        requests: "Leave Requests",
        settings: "Leave Settings",
      },
      performance: {
        evaluationForm: "Evaluation Form",
        newForm: "New Form",
      },
      reports: {
        payRoleReport: "Salary Reports",
        new: "New Record",
      },
    };

    return subTabMappings[tabId]?.[subTabId] || "";
  };

  return (
    <div className="flex items-center justify-between p-4 mt-20">
      <div className="flex items-center">
        <div className="text-sky-500 gap-2 flex items-center font-bold">
          {getTabIcon(activeTab)}
          <span className="font-semibold text-lg">
            <TranslatableText text={getTabLabel(activeTab)} />
          </span>
        </div>
        {activeSubTab && (
          <div className="ml-4 flex items-center text-gray-600">
            <span className="text-lg">/</span>
            <span className="ml-2">
              <TranslatableText text={getSubTabLabel(activeTab, activeSubTab)} />
            </span>
          </div>
        )}
      </div>

      {/* Return to Dashboard Button */}
      <div className="flex-shrink-0 ml-4">
        <CrossAppNavButton />
      </div>
    </div>
  );
};

export default TabHeader;
