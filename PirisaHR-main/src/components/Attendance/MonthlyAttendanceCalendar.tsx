import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, CheckCircle, XCircle, Clock, Coffee } from "lucide-react";

interface AttendanceRecord {
  id: number;
  startedAt: string;
  endedAt: string | null;
  working_status: string;
  attendance_status?: string | null;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  epfNo: string;
  photo?: {
    photoUrl?: string;
  };
  attendanceList: AttendanceRecord[];
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: Employee[];
}

interface EmpDetailsLeaveDTO {
  id: number;
  leaveType: string;
  leaveReason: string;
  leaveStatus: string;
  leaveStartDay: string;
  leaveEndDay: string;
  leaveDays: number;
}

interface EmpDetailsDTO {
  id: number;
  firstName: string;
  lastName: string;
  leaveList?: EmpDetailsLeaveDTO[];
}

interface EmpDetailsApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: EmpDetailsDTO[];
}

interface DayInfo {
  date: number;
  isCurrentMonth: boolean;
  dateKey: string;
  isToday: boolean;
}

interface DaySummary {
  present: number;
  leave: number;
  absent: number;
  pending: number;
  total: number;
}

const parseDateSafe = (value: unknown): Date | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isAttendanceEnded = (att: AttendanceRecord): boolean => {
  const end = parseDateSafe(att.endedAt);
  if (end) return true;
  const status = (att.attendance_status ?? "").toString().trim().toLowerCase();
  return Boolean(status && status !== "active" && status !== "in progress");
};

const MonthlyAttendanceCalendar = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveByEmpId, setLeaveByEmpId] = useState<Record<number, EmpDetailsLeaveDTO[]>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toDateKeyLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getDailySummary = useCallback((dateKey: string): DaySummary => {
    const summary: DaySummary = {
      present: 0,
      leave: 0,
      absent: 0,
      pending: 0,
      total: employees.length
    };

    employees.forEach(employee => {
      // Check if on leave
      const leaves = leaveByEmpId[employee.id] || [];
      let isOnLeave = false;
      
      for (const leave of leaves) {
        if (leave.leaveStatus.toUpperCase() !== "APPROVED") continue;
        const start = parseDateSafe(leave.leaveStartDay);
        const end = parseDateSafe(leave.leaveEndDay);
        if (!start || !end) continue;
        
        const checkDate = new Date(dateKey);
        if (checkDate >= start && checkDate <= end) {
          isOnLeave = true;
          break;
        }
      }

      if (isOnLeave) {
        summary.leave++;
        return;
      }

      // Check attendance
      const attendanceRecords = employee.attendanceList.filter(att => {
        const attDate = parseDateSafe(att.startedAt);
        if (!attDate) return false;
        return toDateKeyLocal(attDate) === dateKey;
      });

      if (attendanceRecords.length > 0) {
        const hasEnded = attendanceRecords.some(att => isAttendanceEnded(att));
        if (hasEnded) {
          summary.present++;
        } else {
          summary.pending++;
        }
      } else {
        summary.absent++;
      }
    });

    return summary;
  }, [employees, leaveByEmpId]);

  const getCalendarDays = (year: number, month: number): DayInfo[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: DayInfo[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        date: day,
        isCurrentMonth: false,
        dateKey: toDateKeyLocal(new Date(prevYear, prevMonth, day)),
        isToday: false
      });
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        dateKey: toDateKeyLocal(date),
        isToday: toDateKeyLocal(date) === toDateKeyLocal(today)
      });
    }
    
    // Next month days to fill the grid
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        date: day,
        isCurrentMonth: false,
        dateKey: toDateKeyLocal(new Date(nextYear, nextMonth, day)),
        isToday: false
      });
    }
    
    return days;
  };

  const fetchEmployeePhotos = async (employeeList: Employee[], token: string) => {
    const photoPromises = employeeList.map(async (employee) => {
      try {
        const existsResp = await fetch(
          `http://localhost:8080/api/profile-image/exists/${employee.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!existsResp.ok) return { id: employee.id, url: null };
        const existsData: { hasProfileImage?: boolean; exists?: boolean } = await existsResp.json();
        const hasImage = Boolean(existsData?.hasProfileImage ?? existsData?.exists);
        if (!hasImage) return { id: employee.id, url: null };

        const photoResponse = await fetch(
          `http://localhost:8080/api/profile-image/view/${employee.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!photoResponse.ok) return { id: employee.id, url: null };
        const blob = await photoResponse.blob();
        if (!blob || blob.size === 0) return { id: employee.id, url: null };

        const imageUrl = URL.createObjectURL(blob);
        return { id: employee.id, url: imageUrl };
      } catch {
        return { id: employee.id, url: null };
      }
    });

    const photoResults = await Promise.all(photoPromises);
    const photoUrlMap: Record<number, string> = {};
    photoResults.forEach(({ id, url }) => { if (url) photoUrlMap[id] = url; });
    setPhotoUrls(photoUrlMap);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        navigate("/login");
        return;
      }

      const [attendanceResponse, leaveResponse] = await Promise.all([
        fetch(`http://localhost:8080/employee/attendanceList/${companyId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        }),
        fetch(`http://localhost:8080/employee/EmpDetailsList/${companyId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        })
      ]);

      if (!attendanceResponse.ok) {
        if (attendanceResponse.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch attendance data");
      }

      const attendanceData: ApiResponse = await attendanceResponse.json();
      
      let leaveMap: Record<number, EmpDetailsLeaveDTO[]> = {};
      if (leaveResponse.ok) {
        try {
          const leaveJson: EmpDetailsApiResponse = await leaveResponse.json();
          if (leaveJson?.resultCode === 100 && Array.isArray(leaveJson?.EmployeeList)) {
            for (const emp of leaveJson.EmployeeList) {
              leaveMap[emp.id] = Array.isArray(emp?.leaveList) ? emp.leaveList : [];
            }
          }
        } catch {
          leaveMap = {};
        }
      }

      if (attendanceData.resultCode === 100) {
        const employeeList = attendanceData.EmployeeList || [];
        setEmployees(employeeList);
        setLeaveByEmpId(leaveMap);
        if (employeeList.length > 0) {
          await fetchEmployeePhotos(employeeList, token);
        }
      } else {
        setEmployees([]);
        setLeaveByEmpId({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const isFutureDate = (dateKey: string): boolean => {
    const today = new Date();
    const todayKey = toDateKeyLocal(today);
    return dateKey > todayKey;
  };

  const getSummaryColor = (summary: DayInfo): string => {
    if (isFutureDate(summary.dateKey)) return "bg-gray-200";
    const daySummary = getDailySummary(summary.dateKey);
    const presentPercentage = daySummary.total > 0 ? (daySummary.present / daySummary.total) * 100 : 0;
    
    if (presentPercentage >= 80) return "bg-green-500";
    if (presentPercentage >= 60) return "bg-yellow-500";
    if (presentPercentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const calendarDays = getCalendarDays(currentYear, currentMonth);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => { setError(null); fetchData(); }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Monthly Attendance Calendar</h1>
                  <p className="text-blue-100 text-sm sm:text-base mt-1">Track and monitor employee attendance patterns</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-white text-sm">Total Employees</div>
                  <div className="text-2xl font-bold text-white">{employees.length}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            {/* Month Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  {new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { month: 'long' })} Overview
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105 shadow-sm"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-medium"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105 shadow-sm"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Enhanced Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                <div>
                  <div className="font-medium text-green-800">Present</div>
                  <div className="text-xs text-green-600">On time</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="w-4 h-4 rounded-full bg-orange-400 shadow-sm"></div>
                <div>
                  <div className="font-medium text-orange-800">Leave</div>
                  <div className="text-xs text-orange-600">Approved</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-sm"></div>
                <div>
                  <div className="font-medium text-yellow-800">In Progress</div>
                  <div className="text-xs text-yellow-600">Working</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="w-4 h-4 rounded-full bg-red-400 shadow-sm"></div>
                <div>
                  <div className="font-medium text-red-800">Absent</div>
                  <div className="text-xs text-red-600">No record</div>
                </div>
              </div>
            </div>

            {/* Enhanced Monthly Calendar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weekdayLabels.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3 bg-gray-50 rounded-lg">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const summary = getDailySummary(day.dateKey);
                    const bgColor = getSummaryColor(day);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center
                          ${day.isCurrentMonth && !isFutureDate(day.dateKey) ? "cursor-pointer hover:scale-105 hover:shadow-lg" : "cursor-default"}
                          transition-all duration-200
                          ${day.isCurrentMonth ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}
                          ${day.isToday ? "ring-3 ring-blue-500 ring-opacity-50 border-blue-300" : ""}
                          ${!day.isCurrentMonth ? "opacity-40" : ""}
                        `}
                        onClick={() => !isFutureDate(day.dateKey) && setSelectedDate(day.dateKey)}
                        title={`${day.dateKey}: ${isFutureDate(day.dateKey) ? 'Future date' : `${summary.present} present, ${summary.leave} leave, ${summary.absent} absent, ${summary.pending} pending`}`}
                      >
                        <span className={`text-sm font-bold ${day.isCurrentMonth ? "text-gray-800" : "text-gray-500"}`}>
                          {day.date}
                        </span>
                        {day.isCurrentMonth && !isFutureDate(day.dateKey) && (
                          <>
                            <div className={`w-full h-1 rounded-full mt-1 ${bgColor} shadow-sm`}></div>
                            <div className="text-xs text-gray-600 mt-1 font-medium hidden sm:block">
                              {summary.present}/{summary.total}
                            </div>
                          </>
                        )}
                        {day.isCurrentMonth && isFutureDate(day.dateKey) && (
                          <div className="text-xs text-gray-400 mt-1 hidden sm:block">
                            Future
                          </div>
                        )}
                        {day.isToday && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Enhanced Day Detail Modal */}
      {selectedDate && !isFutureDate(selectedDate) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh]">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarIcon className="w-6 h-6" />
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {new Date(selectedDate).toLocaleDateString(undefined, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                  </div>
                  <p className="text-blue-100">Detailed attendance breakdown</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-auto max-h-[60vh]">
              {(() => {
                const summary = getDailySummary(selectedDate);
                const presentPercentage = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
                
                return (
                  <div className="space-y-6">
                    {/* Enhanced Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="text-2xl font-bold text-green-700">{summary.present}</div>
                        </div>
                        <div className="text-sm font-medium text-green-600">Present</div>
                        <div className="text-xs text-green-500">{presentPercentage}% attendance</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Coffee className="w-5 h-5 text-orange-600" />
                          <div className="text-2xl font-bold text-orange-700">{summary.leave}</div>
                        </div>
                        <div className="text-sm font-medium text-orange-600">On Leave</div>
                        <div className="text-xs text-orange-500">
                          {summary.total > 0 ? Math.round((summary.leave / summary.total) * 100) : 0}% of team
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <div className="text-2xl font-bold text-red-700">{summary.absent}</div>
                        </div>
                        <div className="text-sm font-medium text-red-600">Absent</div>
                        <div className="text-xs text-red-500">
                          {summary.total > 0 ? Math.round((summary.absent / summary.total) * 100) : 0}% absent
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <div className="text-2xl font-bold text-yellow-700">{summary.pending}</div>
                        </div>
                        <div className="text-sm font-medium text-yellow-600">In Progress</div>
                        <div className="text-xs text-yellow-500">
                          {summary.total > 0 ? Math.round((summary.pending / summary.total) * 100) : 0}% working
                        </div>
                      </div>
                    </div>
                    
                    {/* Employee List */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Employee Details</h3>
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm text-gray-600">
                          {employees.length} employees
                        </span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {employees.map((employee) => {
                          const leaves = leaveByEmpId[employee.id] || [];
                          let isOnLeave = false;
                          
                          for (const leave of leaves) {
                            if (leave.leaveStatus.toUpperCase() !== "APPROVED") continue;
                            const start = parseDateSafe(leave.leaveStartDay);
                            const end = parseDateSafe(leave.leaveEndDay);
                            if (!start || !end) continue;
                            
                            const checkDate = new Date(selectedDate);
                            if (checkDate >= start && checkDate <= end) {
                              isOnLeave = true;
                              break;
                            }
                          }

                          const attendanceRecords = employee.attendanceList.filter(att => {
                            const attDate = parseDateSafe(att.startedAt);
                            if (!attDate) return false;
                            return toDateKeyLocal(attDate) === selectedDate;
                          });

                          let status = "Absent";
                          let statusColor = "bg-red-400";
                          let statusIcon = <XCircle className="w-3 h-3" />;
                          
                          if (isOnLeave) {
                            status = "Leave";
                            statusColor = "bg-orange-400";
                            statusIcon = <Coffee className="w-3 h-3" />;
                          } else if (attendanceRecords.length > 0) {
                            const hasEnded = attendanceRecords.some(att => isAttendanceEnded(att));
                            if (hasEnded) {
                              status = "Present";
                              statusColor = "bg-green-400";
                              statusIcon = <CheckCircle className="w-3 h-3" />;
                            } else {
                              status = "In Progress";
                              statusColor = "bg-yellow-400";
                              statusIcon = <Clock className="w-3 h-3" />;
                            }
                          }
                          
                          return (
                            <div key={employee.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                              {photoUrls[employee.id] ? (
                                <img
                                  src={photoUrls[employee.id]}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800">{employee.firstName} {employee.lastName}</p>
                                <p className="text-sm text-gray-500">{employee.epfNo}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-1 ${statusColor}`}>
                                  {statusIcon}
                                  <span className="hidden sm:inline">{status}</span>
                                  <span className="sm:hidden">{status.charAt(0)}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
  );
};

export default MonthlyAttendanceCalendar;
