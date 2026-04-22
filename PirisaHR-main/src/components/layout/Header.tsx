import React, { useState, useEffect, useRef } from "react";

import {
  FaBell,
  FaEnvelope,
  FaBars,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { TranslatableText } from "../languages/TranslatableText";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../context/LanguageProvider";
import CrossAppNavButton from "./CrossAppNavButton";

interface HeaderProps {
  toggleSidebar: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  createdAt: number;
};

type EmployeeLeaveItem = {
  id: number;
  leaveType?: string;
  leaveStartDay?: string;
  leaveEndDay?: string;
  leaveStatus?: string;
};

type EmployeeLeaveApiResponse = {
  resultCode?: number;
  EmployeeLeaveList?: Array<{ leaveList?: EmployeeLeaveItem[] }>;
};

type PayrollItem = {
  id?: number;
  year?: number;
  month?: string;
};

type EmployeePayrollApiResponse = {
  resultCode?: number;
  EmployeeList?: Array<{ payroleList?: PayrollItem[] }>;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    flag: "https://uxwing.com/wp-content/themes/uxwing/download/flags-landmarks/uk-flag-round-circle-icon.png",
  },
  {
    code: "si",
    name: "සිංහල",
    flag: "https://uxwing.com/wp-content/themes/uxwing/download/flags-landmarks/sri-lanka-flag-round-circle-icon.png",
  },
  {
    code: "ta",
    name: "தமிழ்",
    flag: "https://uxwing.com/wp-content/themes/uxwing/download/flags-landmarks/india-flag-round-circle-icon.png",
  },
];

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { language, setLanguage } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    return () => {
      setLogoUrl((prev) => {
        if (prev) {
          try {
            URL.revokeObjectURL(prev);
          } catch {
            // no-op
          }
        }
        return null;
      });
    };
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  const currentLanguage =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) ||
    LANGUAGE_OPTIONS[0];

  const handleLanguageSelect = (languageCode: string) => {
    setLanguage(languageCode);
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate("/companyProfile");
    setIsProfileDropdownOpen(false); // Close dropdown after click
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("cmpnyId");
    localStorage.removeItem("companyId");
    localStorage.removeItem("empId");
    localStorage.removeItem("username");
    window.location.href = "http://167.71.206.166:3000/login";
    setIsProfileDropdownOpen(false); // Close dropdown after click
    //console.log("User logged out");
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
    if (
      profileDropdownRef.current &&
      !profileDropdownRef.current.contains(event.target as Node)
    ) {
      setIsProfileDropdownOpen(false);
    }
    if (
      notificationDropdownRef.current &&
      !notificationDropdownRef.current.contains(event.target as Node)
    ) {
      setIsNotificationOpen(false);
    }
  };

  const getEmployeeLeaveDecisions = async () => {
    const token = localStorage.getItem("token");
    const empId = localStorage.getItem("empId");
    if (!token || !empId) return { decided: [] as EmployeeLeaveItem[] };

    try {
      const res = await fetch(
        `/api/employee/EmpDetailsListByEmp/${empId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return { decided: [] as EmployeeLeaveItem[] };
      const json: EmployeeLeaveApiResponse = await res.json();
      const list = json?.EmployeeLeaveList?.[0]?.leaveList;
      const leaves = Array.isArray(list) ? list : [];

      const decided = leaves.filter((l) => {
        const s = (l?.leaveStatus ?? "").toString().toUpperCase().trim();
        return s === "APPROVED" || s === "REJECTED" || s === "REJECT";
      });

      return { decided };
    } catch {
      return { decided: [] as EmployeeLeaveItem[] };
    }
  };

  const monthToIndex = (m?: string) => {
    const s = (m || "").toString().trim().toLowerCase();
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const idx = months.indexOf(s);
    return idx >= 0 ? idx : -1;
  };

  const getEmployeeLatestPayslip = async () => {
    const token = localStorage.getItem("token");
    const empId = localStorage.getItem("empId");
    if (!token || !empId) return null as null | { year: number; month: string; key: string };

    try {
      const res = await fetch(
        `/api/employee/payroleListEmp/${empId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return null;
      const json: EmployeePayrollApiResponse = await res.json();
      const list = json?.EmployeeList?.[0]?.payroleList;
      const items = Array.isArray(list) ? list : [];
      if (items.length === 0) return null;

      let best: { year: number; month: string; monthIdx: number } | null = null;
      for (const it of items) {
        const year = typeof it?.year === "number" ? it.year : Number(it?.year);
        const month = (it?.month ?? "").toString();
        const monthIdx = monthToIndex(month);
        if (!year || monthIdx < 0) continue;
        if (!best) {
          best = { year, month, monthIdx };
          continue;
        }
        if (year > best.year || (year === best.year && monthIdx > best.monthIdx)) {
          best = { year, month, monthIdx };
        }
      }

      if (!best) return null;
      const key = `${best.year}-${String(best.monthIdx + 1).padStart(2, "0")}`;
      return { year: best.year, month: best.month, key };
    } catch {
      return null;
    }
  };

  const getPendingLeaveCount = async () => {
    const token = localStorage.getItem("token");
    const cmpnyId = localStorage.getItem("cmpnyId");
    if (!token || !cmpnyId) return 0;

    try {
      const res = await fetch(
        `/api/employee/PendingEmpDetailsList/${cmpnyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) return 0;
      const json = await res.json();
      const list = Array.isArray(json?.EmployeeList) ? json.EmployeeList : [];

      let count = 0;
      for (const emp of list) {
        const leaves = Array.isArray(emp?.leaveList) ? emp.leaveList : [];
        for (const leave of leaves) {
          const status = (leave?.leaveStatus ?? "").toString().toUpperCase().trim();
          if (!status || status === "PENDING") count += 1;
        }
      }
      return count;
    } catch {
      return 0;
    }
  };

  const refreshNotifications = async () => {
    const items: NotificationItem[] = [];

    if (role === "CMPNY") {
      const pendingCount = await getPendingLeaveCount();
      if (pendingCount > 0) {
        items.push({
          id: "pending-leave-requests",
          title: `Leave requests pending (${pendingCount})`,
          description: "Review and approve/reject leave applications",
          href: "/leave/requests",
          createdAt: Date.now(),
        });
      }

      setNotifications(items);

      const key = "notif_seen_pending_leave_count";
      const seenRaw = localStorage.getItem(key);
      const seen = seenRaw ? Number(seenRaw) : 0;
      const nextUnread =
        pendingCount > seen
          ? pendingCount - seen
          : pendingCount === seen
            ? 0
            : pendingCount;
      setUnreadCount(nextUnread);
      return;
    }

    if (role === "EMPLOYEE") {
      const empId = localStorage.getItem("empId") || "";
      const leave = await getEmployeeLeaveDecisions();
      const decided = leave.decided;
      const decidedCount = decided.length;

      const latestPayslip = await getEmployeeLatestPayslip();

      const leaveKey = `notif_emp_seen_leave_decision_count_${empId}`;
      const seenLeaveRaw = localStorage.getItem(leaveKey);
      const seenLeave = seenLeaveRaw ? Number(seenLeaveRaw) : 0;
      const unreadLeaves = decidedCount > seenLeave ? decidedCount - seenLeave : 0;

      const payslipKey = `notif_emp_seen_payslip_key_${empId}`;
      const seenPayslip = localStorage.getItem(payslipKey) || "";
      const unreadPayslip = latestPayslip && latestPayslip.key && latestPayslip.key !== seenPayslip ? 1 : 0;

      const now = Date.now();

      if (unreadPayslip > 0 && latestPayslip) {
        items.push({
          id: `payslip-${latestPayslip.key}`,
          title: `New payslip available (${latestPayslip.month} ${latestPayslip.year})`,
          description: "Download your salary payment sheet",
          href: "/pay-role-list",
          createdAt: now,
        });
      }

      if (unreadLeaves > 0) {
        items.push({
          id: "leave-decision-update",
          title: `Leave status updated (${unreadLeaves})`,
          description: "Your leave request has been approved/rejected",
          href: "/emp-leave",
          createdAt: now - 1,
        });
      }

      setNotifications(items);
      setUnreadCount(unreadPayslip + unreadLeaves);
      return;
    }

    setNotifications([]);
    setUnreadCount(0);
  };

  const markAllAsRead = async () => {
    if (role === "CMPNY") {
      const pendingCount = await getPendingLeaveCount();
      localStorage.setItem("notif_seen_pending_leave_count", String(pendingCount));
      setUnreadCount(0);
      return;
    }

    if (role === "EMPLOYEE") {
      const empId = localStorage.getItem("empId") || "";
      const leave = await getEmployeeLeaveDecisions();
      localStorage.setItem(
        `notif_emp_seen_leave_decision_count_${empId}`,
        String(leave.decided.length)
      );
      const latestPayslip = await getEmployeeLatestPayslip();
      if (latestPayslip?.key) {
        localStorage.setItem(
          `notif_emp_seen_payslip_key_${empId}`,
          latestPayslip.key
        );
      }
      setUnreadCount(0);
    }
  };

  // Fetch logo from API
  useEffect(() => {
    const fetchLogo = async () => {
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");
      const empId = localStorage.getItem("empId");

      if (!token) {
        console.error("Token not found in localStorage");
        return;
      }

      try {
        // If employee, try to fetch employee photo first
        if (role === "EMPLOYEE" && empId) {
          try {
            const existsResp = await fetch(
              `/api/profile-image/exists/${empId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (existsResp.ok) {
              const existsData: { hasProfileImage?: boolean; exists?: boolean } =
                await existsResp.json();
              const hasImage = Boolean(
                existsData?.hasProfileImage ?? existsData?.exists
              );

              if (hasImage) {
                const response = await fetch(
                  `/api/profile-image/view/${empId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (response.ok) {
                  const blob = await response.blob();
                  if (blob && blob.size > 0) {
                    const imageUrl = URL.createObjectURL(blob);
                    setLogoUrl((prev) => {
                      if (prev) {
                        try {
                          URL.revokeObjectURL(prev);
                        } catch {
                          // no-op
                        }
                      }
                      return imageUrl;
                    });
                    return;
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error fetching employee photo:", error);
          }
        }

        if (cmpId) {
          const logoResponse = await fetch(
            `/api/logo/view/${cmpId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (logoResponse.ok) {
            const blob = await logoResponse.blob();
            if (blob.size > 0) {
              // Check if logo exists
              const imageUrl = URL.createObjectURL(blob);
              setLogoUrl(imageUrl);
              return;
            }
          } else if (logoResponse.status === 404) {
            console.log("No company logo found, using default");
          } else {
            console.warn(`Logo fetch failed with status: ${logoResponse.status}`);
          }
        }

        // If no logo found, use default icon based on role
        setLogoUrl(null);
      } catch (error) {
        console.error("Error fetching logo:", error);
        setLogoUrl(null);
      }
    };

    void fetchLogo();
  }, [role]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    void refreshNotifications();

    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 30000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") void refreshNotifications();
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [role]);

  return (
    <div className="bg-white shadow px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center w-full">
      {/* Left: Sidebar Toggle and Search */}
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="text-gray-600 mr-3 sm:mr-4 focus:outline-none cursor-pointer"
        >
          <FaBars className="text-xl" />
        </button>

        <input
          type="text"
          placeholder={language === "en" ? "Search" : "Search"}
          className="bg-gray-100 hidden sm:block w-full max-w-md px-4 py-2 rounded border focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
        {/* Language Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none cursor-pointer"
          >
            <img
              src={currentLanguage.flag}
              alt={currentLanguage.name}
              className="w-4 h-4 rounded-full"
            />
            <span className="text-sm">{currentLanguage.name}</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleLanguageSelect(option.code)}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <img
                    src={option.flag}
                    alt={option.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <FaEnvelope className="text-xl text-gray-600 cursor-pointer hidden sm:block" />

        <div className="relative hidden sm:block" ref={notificationDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationOpen((v) => !v);
              void markAllAsRead();
            }}
            className="relative text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label="Notifications"
          >
            <FaBell className="text-xl cursor-pointer" />
            {unreadCount > 0 ? (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          {isNotificationOpen ? (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Notifications</div>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="max-h-96 overflow-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (n.href) navigate(n.href);
                        setIsNotificationOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{n.title}</div>
                      {n.description ? (
                        <div className="text-xs text-gray-500 mt-1">{n.description}</div>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-500 text-center">
                    No notifications
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    void refreshNotifications();
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <img
              src={logoUrl || "https://via.placeholder.com/150"}
              alt="User"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full cursor-pointer"
            />
            <div className="flex flex-col cursor-pointer">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                <TranslatableText
                  text={localStorage.getItem("username") || "Guest"}
                />
              </span>
              <span className="text-sm text-gray-500 hidden sm:block">
                {localStorage.getItem("role") || "Role"}
              </span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${
                isProfileDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-sky-600 transition-colors duration-200"
                >
                  <FaUser className="mr-3 text-gray-400 group-hover:text-sky-600" />
                  <span>Profile</span>
                </button>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-sky-600 transition-colors duration-200"
                >
                  <FaSignOutAlt className="mr-3 text-gray-400 group-hover:text-sky-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
