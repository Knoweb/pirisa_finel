/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp, FaCircle } from "react-icons/fa";
import { navItems } from "../config/navigation";
import { TranslatableText } from "../languages/TranslatableText";

interface SidebarProps {
  isVisible: boolean;
  userRole: string; // Add userRole prop
}

export const Sidebar: React.FC<SidebarProps> = ({ isVisible, userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedTabs, setExpandedTabs] = useState(() => {
    const currentMainPath = location.pathname.split("/")[1];
    return new Set([currentMainPath]);
  });

  // Check if current path is an edit path or salary-related path
  const isEditPath = location.pathname.includes('/employee/edit/');
  const isMakeSalaryPath = location.pathname.includes('/payrole/makesalary/');
  const isPaySlipsPath = location.pathname.includes('/payrole/payslips/');

  // Automatically expand relevant sections when on specific pages
  useEffect(() => {
    const newExpandedTabs = new Set(expandedTabs);
    
    if (isEditPath && !newExpandedTabs.has('employee')) {
      newExpandedTabs.add('employee');
    }
    
    if ((isMakeSalaryPath || isPaySlipsPath) && !newExpandedTabs.has('payrole')) {
      newExpandedTabs.add('payrole');
    }
    
    if (newExpandedTabs.size !== expandedTabs.size) {
      setExpandedTabs(newExpandedTabs);
    }
  }, [location.pathname, isEditPath, isMakeSalaryPath, isPaySlipsPath]);

  const toggleExpanded = (tabId: string) => {
    setExpandedTabs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Function to check if user has access to an item
  const hasAccess = (roles?: string[]) => {
    // If no roles specified, item is accessible to all
    if (!roles || roles.length === 0) return true;
    return roles.includes(userRole);
  };

  // Improved function to check if a submenu item is active
  const isSubItemActive = (path: string) => {
    // Handle parameterized routes
    if (path.includes(':id') || path.includes(':employeeId')) {
      const pathSegments = path.split('/');
      const currentSegments = location.pathname.split('/');
      
      // Check if the path structure matches (same number of segments)
      if (pathSegments.length !== currentSegments.length) return false;
      
      // Check each segment
      for (let i = 0; i < pathSegments.length; i++) {
        // If it's a parameter segment, skip the value check
        if (pathSegments[i].startsWith(':')) continue;
        // If non-parameter segments don't match, return false
        if (pathSegments[i] !== currentSegments[i]) return false;
      }
      return true;
    }
    // For non-parameterized routes
    return location.pathname === path;
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => hasAccess(item.roles));

  return (
    <div
      className={`bg-gray-50 h-dvh px-1.5 w-72 fixed left-0 top-0 
            transition-transform duration-300 z-50 overflow-y-auto
            ${isVisible ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0`}
    >
      <div className="flex items-center justify-center py-6">
        <img src="/logo.png" alt="PirisaHR" className="w-28 h-10" />
      </div>
      <nav className="mt-6">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            // Filter sub-items based on role
            const filteredSubItems = item.subItems.filter(subItem => hasAccess(subItem.roles));
            
            // Don't show parent item if it has no accessible sub-items (unless it's a direct link)
            if (item.subItems.length > 0 && filteredSubItems.length === 0 && !item.path) {
              return null;
            }

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.subItems.length === 0 || filteredSubItems.length === 0) {
                      handleNavigation(item.path);
                    }
                    toggleExpanded(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-6 py-3 
                                    rounded-2xl text-gray-700 hover:bg-sky-200 cursor-pointer ${
                                      location.pathname.startsWith(item.path)
                                        ? "bg-sky-500 text-white hover:bg-sky-500"
                                        : ""
                                    }`}
                >
                  <div className="flex items-center">
                    <item.icon className="text-lg mr-4" />
                    <span>
                      <TranslatableText text={item.label} />
                    </span>
                  </div>
                  {filteredSubItems.length > 0 &&
                    (expandedTabs.has(item.id) ? (
                      <FaChevronUp className="text-sm" />
                    ) : (
                      <FaChevronDown className="text-sm" />
                    ))}
                </button>
                {expandedTabs.has(item.id) && filteredSubItems.length > 0 && (
                  <ul className="ml-12 mt-2 space-y-2">
                    {filteredSubItems.map((subItem) => {
                      // Determine if we should show this subitem
                      let shouldShow = true;
                      
                      if (subItem.id === 'edit-employee') {
                        shouldShow = isEditPath;
                      } else if (subItem.id === 'makesalary') {
                        shouldShow = isMakeSalaryPath;
                      } else if (subItem.id === 'payslips') {
                        shouldShow = isPaySlipsPath;
                      }
                      
                      return shouldShow ? (
                        <li key={subItem.id}>
                          <button
                            onClick={() => {
                              // Don't navigate for parameterized routes as they need specific IDs
                              if (!subItem.path.includes(':id') && !subItem.path.includes(':employeeId')) {
                                handleNavigation(subItem.path);
                              }
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg 
                                                    text-gray-600 hover:bg-sky-100 ${
                                                      isSubItemActive(subItem.path)
                                                        ? "bg-sky-100 text-sky-600 font-medium"
                                                        : ""
                                                    }`}
                          >
                            <div className="flex flex-row">
                              <FaCircle
                                className={`text-gray-600 w-1.5 mt-1 
                                                        mr-2.5 ${
                                                          isSubItemActive(subItem.path)
                                                            ? "text-sky-600"
                                                            : ""
                                                        }`}
                              />
                              <span>
                                <TranslatableText text={subItem.label} />
                              </span>
                            </div>
                          </button>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
