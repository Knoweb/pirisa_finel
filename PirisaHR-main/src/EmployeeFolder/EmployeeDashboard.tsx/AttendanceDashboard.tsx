import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  id: number;
  startedAt: string;
  endedAt: string | null;
  empId: number;
  working_status: string;
  totalTime: number;
  attendance_status: string | null;
  dayName: string;
  additional_attendance: unknown;
}

interface Leave {
  id: number;
  leaveType: string;
  leaveReason: string;
  leaveStatus: string;
  leaveStartDay: string;
  leaveEndDay: string;
  leaveDays: number;
}

interface Employee {
  id: number;
  epf_no: string;
  emp_no: string;
  first_name: string;
  last_name: string;
  basic_salary: number;
  email: string;
  username: string;
  gender: string;
  phone: string;
  address: string;
  date_of_joining: string;
  status: string;
  role: string;
  cmpId: number;
  dptId: number;
  designationId: number;
  attendanceList: AttendanceRecord[];
  payroleList: unknown[];
}

interface ApiResponse {
  resultCode: number;
  Employee_list: Employee;
}

interface EmployeeDetailsResponse {
  EmployeeLeaveList: Array<{
    leaveList?: Leave[];
  }>;
  resultCode: number;
  resultDesc: string;
}

const AttendanceCalendarDashboard: React.FC = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const empId = localStorage.getItem("empId");

      if (!empId || !token) {
        throw new Error("Employee ID or token not found");
      }

      // Fetch employee data
      const employeeResponse = await fetch(
        `/employee/emp/${empId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Fetch leave data
      const leaveResponse = await fetch(
        `/employee/EmpDetailsListByEmp/${empId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!employeeResponse.ok || !leaveResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const employeeData: ApiResponse = await employeeResponse.json();
      const leaveData: EmployeeDetailsResponse = await leaveResponse.json();

      if (employeeData.resultCode === 100 && leaveData.resultCode === 100) {
        setEmployee(employeeData.Employee_list);
        const first = leaveData.EmployeeLeaveList?.[0] as unknown;
        const leaveList =
          typeof first === "object" && first !== null && "leaveList" in first
            ? ((first as { leaveList?: Leave[] }).leaveList ?? [])
            : [];
        setLeaves(Array.isArray(leaveList) ? leaveList : []);
        setError(null);
      } else {
        throw new Error("Failed to fetch data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const intervalId = window.setInterval(() => {
      fetchData();
    }, 30000);

    const handleFocus = () => {
      fetchData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  useEffect(() => {
    const tickId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(tickId);
    };
  }, []);

  const formatTime = (minutes: number): string => {
    const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const parseDateSafe = (value: unknown): Date | null => {
    if (typeof value !== "string" || value.trim().length === 0) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const diffMinutes = (start: Date, end: Date): number => {
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.floor(ms / 60000);
  };

  const formatRelativeTime = (date: Date, ref: Date): string => {
    const mins = diffMinutes(date, ref);
    if (mins <= 0) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const isAttendanceEnded = useCallback(
    (att: AttendanceRecord): boolean => {
      const end = parseDateSafe(att.endedAt);
      if (end) return true;

      const status = (att.attendance_status ?? "").toString().trim().toLowerCase();
      if (status && status !== "active" && status !== "in progress") return true;

      const minutes = Number.isFinite(att.totalTime) ? att.totalTime : 0;
      return minutes > 0;
    },
    []
  );

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const extractDatePart = (dateTimeString: string): string => {
    // Handles both ISO strings and other date-time formats by falling back to Date parsing
    if (typeof dateTimeString === "string" && dateTimeString.includes("T")) {
      return dateTimeString.split("T")[0];
    }
    return toLocalDateString(new Date(dateTimeString));
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAttendanceForDate = (date: Date): AttendanceRecord | null => {
    if (!employee) return null;

    return (
      employee.attendanceList.find((attendance) => {
        const attendanceDate = new Date(attendance.startedAt);
        return attendanceDate.toDateString() === date.toDateString();
      }) || null
    );
  };

  const getLeaveForDate = (date: Date): Leave | null => {
    const dateString = toLocalDateString(date);
    return (
      leaves.find((leave) => {
        const startDate = extractDatePart(leave.leaveStartDay);
        const endDate = extractDatePart(leave.leaveEndDay);
        return (
          dateString >= startDate &&
          dateString <= endDate &&
          leave.leaveStatus === "APPROVED"
        );
      }) || null
    );
  };

  const getDayStatus = (date: Date): { className: string; label: string } => {
    const attendance = getAttendanceForDate(date);
    const leave = getLeaveForDate(date);

    if (leave) {
      return {
        className: "bg-red-100 text-red-800 border-red-200",
        label: leave.leaveType,
      };
    }

    if (attendance) {
      switch (attendance.working_status) {
        case "On-Site":
          return {
            className: "bg-green-100 text-green-800 border-green-200",
            label: "On-Site",
          };
        case "Online":
          return {
            className: "bg-blue-100 text-blue-800 border-blue-200",
            label: "Online",
          };
        case "Hybrid":
          return {
            className: "bg-purple-100 text-purple-800 border-purple-200",
            label: "Hybrid",
          };
        default:
          return {
            className: "bg-yellow-100 text-yellow-800 border-yellow-200",
            label: attendance.working_status,
          };
      }
    }

    return {
      className: "bg-gray-100 text-gray-400 border-gray-200",
      label: "No Record",
    };
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const monthName = useMemo(
    () =>
      currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    [currentDate]
  );

  const monthAttendance = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    return (employee?.attendanceList ?? []).filter((att) => {
      const d = parseDateSafe(att.startedAt);
      if (!d) return false;
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [currentDate, employee]);

  const approvedLeavesThisMonth = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return leaves.filter((leave) => {
      if (leave.leaveStatus !== "APPROVED") return false;
      const s = parseDateSafe(leave.leaveStartDay);
      const e = parseDateSafe(leave.leaveEndDay);
      if (!s || !e) return false;
      return s <= monthEnd && e >= monthStart;
    });
  }, [currentDate, leaves]);

  const recentAttendance = useMemo(() => {
    const list = [...(employee?.attendanceList ?? [])];
    list.sort((a, b) => {
      const da = parseDateSafe(a.startedAt)?.getTime() ?? 0;
      const db = parseDateSafe(b.startedAt)?.getTime() ?? 0;
      return db - da;
    });
    return list.slice(0, 3);
  }, [employee]);

  const getLiveTotalMinutes = useCallback(
    (att: AttendanceRecord): number => {
      const fromApi =
        Number.isFinite(att.totalTime) && att.totalTime > 0 ? att.totalTime : 0;

      if (isAttendanceEnded(att)) {
        return fromApi;
      }

      const start = parseDateSafe(att.startedAt);
      if (!start) return fromApi;
      const end = parseDateSafe(att.endedAt);
      if (end) {
        const computed = diffMinutes(start, end);
        return computed > 0 ? computed : fromApi;
      }
      const live = diffMinutes(start, now);
      return live > 0 ? live : fromApi;
    },
    [isAttendanceEnded, now]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Attendance Calendar
                </h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ←
                  </button>
                  <h3 className="text-lg font-medium">{monthName}</h3>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((date) => {
                  const { className, label } = getDayStatus(date);
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  const attendance = getAttendanceForDate(date);
                  const leave = getLeaveForDate(date);

                  return (
                    <div
                      key={date.getTime()}
                      onClick={() => setSelectedDate(date)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px]
                        ${isToday ? "ring-2 ring-blue-500" : ""}
                        ${
                          isSelected
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50"
                        }
                        ${className}
                        border
                      `}
                    >
                      <div className="text-sm font-medium">
                        {date.getDate()}
                      </div>
                      <div className="mt-1">
                        <div className="text-xs font-medium">{label}</div>
                        {attendance && !leave && (
                          <div className="text-xs opacity-75">
                            {formatTime(getLiveTotalMinutes(attendance))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monthly Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Days Present</span>
                  <span className="font-medium">
                    {monthAttendance.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Hours</span>
                  <span className="font-medium">
                    {formatTime(
                      monthAttendance.reduce((sum, att) => sum + getLiveTotalMinutes(att), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">On-Site Days</span>
                  <span className="font-medium">
                    {
                      monthAttendance.filter(
                        (att) => att.working_status === "On-Site"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Online Days</span>
                  <span className="font-medium">
                    {
                      monthAttendance.filter(
                        (att) => att.working_status === "Online"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved Leaves</span>
                  <span className="font-medium">
                    {approvedLeavesThisMonth.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>

                {(() => {
                  const dayAttendance = getAttendanceForDate(selectedDate);
                  const dayLeave = getLeaveForDate(selectedDate);

                  if (dayLeave) {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            {dayLeave.leaveType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            Status:{" "}
                            <span className="font-medium">
                              {dayLeave.leaveStatus}
                            </span>
                          </p>
                          <p>Reason: {dayLeave.leaveReason}</p>
                          <p>Duration: {dayLeave.leaveDays} day(s)</p>
                          <p>From: {formatDateTime(dayLeave.leaveStartDay)}</p>
                          <p>To: {formatDateTime(dayLeave.leaveEndDay)}</p>
                        </div>
                      </div>
                    );
                  }

                  if (dayAttendance) {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {dayAttendance.working_status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {formatTime(getLiveTotalMinutes(dayAttendance))}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            Start: {formatDateTime(dayAttendance.startedAt)}
                          </p>
                          <p>
                            End:{" "}
                            {dayAttendance.endedAt
                              ? formatDateTime(dayAttendance.endedAt)
                              : isAttendanceEnded(dayAttendance)
                              ? "Completed"
                              : "In progress"}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p className="text-gray-500 text-sm">
                      No record for this day
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentAttendance.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isAttendanceEnded(attendance)
                          ? "bg-orange-500"
                          : attendance.working_status === "On-Site"
                          ? "bg-green-500"
                          : attendance.working_status === "Online"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {attendance.dayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          const start = parseDateSafe(attendance.startedAt);
                          const relative = start ? formatRelativeTime(start, now) : "";
                          const total = formatTime(getLiveTotalMinutes(attendance));
                          return `${formatDateTime(attendance.startedAt)} • ${total}${relative ? ` • ${relative}` : ""}`;
                        })()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {attendance.working_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendarDashboard;
