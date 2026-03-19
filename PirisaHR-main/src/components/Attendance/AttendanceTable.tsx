import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../table/Table";
import { Trash2 } from "lucide-react";
import DateFilter from "../Filters/DateFilter"; // Import the DateFilter component

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface Attendance {
  id: number;
  firstName: string;
  lastName: string;
  epfNo: string;
  email: string;
  gender: string;
  phone: string;
  address: string;
  dateOfJoining: string;
  nic: string;
  dob: string;
  status: string;
  basicSalary: number;
  department?: {
    id: number;
    dpt_name: string;
  };
  photo?: {
    photoUrl?: string;
  };
  attendanceList: {
    id: number;
    startedAt: string;
    endedAt: string | null;
    working_status: string;
    attendance_status?: string | null;
  }[];
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: Attendance[];
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

const AttendanceTable = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<{id: number; dpt_name: string}[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number>(0);
  const [leaveByEmpId, setLeaveByEmpId] = useState<Record<number, EmpDetailsLeaveDTO[]>>(
      {}
  );
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const rowsPerPage = 10;
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [calendarEmp, setCalendarEmp] = useState<Attendance | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const toDateKeyLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const parseDateOnlyLocal = (value?: string) => {
    if (!value) return null;
    const raw = String(value).trim();
    const m = raw.match(/\d{4}-\d{2}-\d{2}/);
    const s = m ? m[0] : "";
    if (!s) return null;
    const parts = s.split("-").map((v) => Number(v));
    if (parts.length !== 3) return null;
    const [yy, mm, dd] = parts;
    if (!yy || !mm || !dd) return null;
    const dt = new Date(yy, mm - 1, dd);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const parseDateSafe = (value: unknown): Date | null => {
    if (typeof value !== "string" || value.trim().length === 0) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const isAttendanceEnded = (att: {
    endedAt: string | null;
    attendance_status?: string | null;
  }): boolean => {
    const end = parseDateSafe(att.endedAt);
    if (end) return true;

    const status = (att.attendance_status ?? "").toString().trim().toLowerCase();
    return Boolean(status && status !== "active" && status !== "in progress");
  };

  const getDayStatusBadge = (emp: Attendance): { label: string; className: string } => {
    const list = Array.isArray(emp.attendanceList) ? emp.attendanceList : [];
    if (list.length === 0) {
      return { label: "NO RECORD", className: "bg-gray-500" };
    }

    const hasInProgress = list.some((att) => !isAttendanceEnded(att));
    if (hasInProgress) {
      return { label: "IN PROGRESS", className: "bg-green-500" };
    }

    return { label: "COMPLETED", className: "bg-orange-500" };
  };

  // Cleanup photo URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(photoUrls).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoUrls]);

  const fetchEmployeePhotos = async (
      employeeList: Attendance[],
      token: string
  ) => {
    const photoPromises = employeeList.map(async (employee) => {
      try {
        const existsResp = await fetch(
            `/api/profile-image/exists/${employee.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
        );

        if (!existsResp.ok) return { id: employee.id, url: null };
        const existsData: { hasProfileImage?: boolean; exists?: boolean } =
            await existsResp.json();
        const hasImage = Boolean(
            existsData?.hasProfileImage ?? existsData?.exists
        );
        if (!hasImage) return { id: employee.id, url: null };

        const photoResponse = await fetch(
            `/api/profile-image/view/${employee.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
        );

        if (!photoResponse.ok) {
          return { id: employee.id, url: null };
        }

        const blob = await photoResponse.blob();
        if (!blob || blob.size === 0) {
          return { id: employee.id, url: null };
        }

        const imageUrl = URL.createObjectURL(blob);
        return { id: employee.id, url: imageUrl };
      } catch {
        return { id: employee.id, url: null };
      }
    });

    const photoResults = await Promise.all(photoPromises);
    const photoUrlMap: Record<number, string> = {};

    photoResults.forEach(({ id, url }) => {
      if (url) {
        photoUrlMap[id] = url;
      }
    });

    setPhotoUrls(photoUrlMap);
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        navigate("/login");
        return;
      }

      const response = await fetch(
          `/api/employee/attendanceList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      const leaveResponse = await fetch(
          `/api/employee/EmpDetailsList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        if (response.status === 404) {
          setAttendance([]);
          setFilteredAttendance([]);
          return;
        }
        throw new Error("Failed to fetch attendance");
      }

      const data: ApiResponse = await response.json();
      let leaveMap: Record<number, EmpDetailsLeaveDTO[]> = {};
      if (leaveResponse.ok) {
        try {
          const leaveJson: EmpDetailsApiResponse = await leaveResponse.json();
          if (leaveJson?.resultCode === 100 && Array.isArray(leaveJson?.EmployeeList)) {
            leaveMap = {};
            for (const emp of leaveJson.EmployeeList) {
              const list = Array.isArray(emp?.leaveList) ? emp.leaveList : [];
              leaveMap[emp.id] = list;
            }
          }
        } catch {
          leaveMap = {};
        }
      }

      if (data.resultCode === 100) {
        const employeeList = data.EmployeeList || [];
        setAttendance(employeeList);
        setFilteredAttendance(employeeList);
        
        // Extract unique departments
        const uniqueDepts = Array.from(
          new Map(
            employeeList
              .filter((emp): emp is Attendance & {department: {id: number; dpt_name: string}} => emp.department !== undefined)
              .map(emp => [emp.department.id, {id: emp.department.id, dpt_name: emp.department.dpt_name}] as [number, {id: number; dpt_name: string}])
          ).values()
        );
        setDepartments(uniqueDepts);
        
        setLeaveByEmpId(leaveMap);

        if (employeeList.length > 0) {
          await fetchEmployeePhotos(employeeList, token);
        }
      } else {
        setAttendance([]);
        setFilteredAttendance([]);
        setLeaveByEmpId({});
        throw new Error(data.resultDesc);
      }
    } catch (error) {
      setAttendance([]);
      setFilteredAttendance([]);
      setLeaveByEmpId({});
      setError(
          error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAttendance();

    const intervalId = window.setInterval(() => {
      fetchAttendance();
    }, 15000);

    const handleFocus = () => {
      fetchAttendance();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAttendance();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAttendance]);

  useEffect(() => {
    if (selectedDate && attendance.length > 0) {
      const filtered = attendance.map((emp) => ({
        ...emp,
        attendanceList: emp.attendanceList.filter(
            (att) =>
                toDateKeyLocal(new Date(att.startedAt)) === selectedDate
        ),
      }));
      applyDepartmentFilter(filtered, selectedDepartment);
    }
  }, [attendance, selectedDate, selectedDepartment]);

  // Handle date filter change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const filtered = attendance.map((emp) => ({
        ...emp,
        attendanceList: emp.attendanceList.filter(
            (att) => toDateKeyLocal(new Date(att.startedAt)) === date
        ),
      }));
      applyDepartmentFilter(filtered, selectedDepartment);
    } else {
      applyDepartmentFilter(attendance, selectedDepartment); // Reset to all data if no date is selected
    }
  };

  const applyDepartmentFilter = (employeeList: Attendance[], departmentId: number) => {
    if (departmentId === 0) {
      setFilteredAttendance(employeeList);
    } else {
      const filtered = employeeList.filter(emp => emp.department && emp.department.id === departmentId);
      setFilteredAttendance(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDepartmentChange = (departmentId: number) => {
    setSelectedDepartment(departmentId);
    if (selectedDate && attendance.length > 0) {
      const filtered = attendance.map((emp) => ({
        ...emp,
        attendanceList: emp.attendanceList.filter(
            (att) =>
                toDateKeyLocal(new Date(att.startedAt)) === selectedDate
        ),
      }));
      applyDepartmentFilter(filtered, departmentId);
    } else {
      applyDepartmentFilter(attendance, departmentId);
    }
  };

  const yearOptions = useCallback(() => {
    const years = new Set<number>();
    for (const emp of attendance) {
      const list = Array.isArray(emp.attendanceList) ? emp.attendanceList : [];
      for (const att of list) {
        const d = parseDateSafe(att.startedAt);
        if (!d) continue;
        years.add(d.getFullYear());
      }
    }
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [attendance]);

  const workedDaysByEmpId = useCallback(
      (emp: Attendance, year: number) => {
        const set = new Set<string>();
        const list = Array.isArray(emp.attendanceList) ? emp.attendanceList : [];
        for (const att of list) {
          const d = parseDateSafe(att.startedAt);
          if (!d) continue;
          if (d.getFullYear() !== year) continue;
          set.add(toDateKeyLocal(d));
        }
        return set;
      },
      []
  );

  const leaveDaysByEmpId = useCallback(
      (empId: number, year: number) => {
        const set = new Set<string>();
        const leaves = Array.isArray(leaveByEmpId[empId]) ? leaveByEmpId[empId] : [];
        for (const leave of leaves) {
          const status = (leave?.leaveStatus ?? "").toString().toUpperCase().trim();
          if (status !== "APPROVED") continue;
          const start = parseDateOnlyLocal(leave.leaveStartDay);
          const end = parseDateOnlyLocal(leave.leaveEndDay);
          if (!start || !end) continue;
          const s = new Date(start);
          const e = new Date(end);
          if (s > e) continue;

          const min = new Date(year, 0, 1);
          const max = new Date(year, 11, 31);
          const rangeStart = s < min ? min : s;
          const rangeEnd = e > max ? max : e;

          const iter = new Date(rangeStart);
          while (iter <= rangeEnd) {
            set.add(toDateKeyLocal(iter));
            iter.setDate(iter.getDate() + 1);
          }
        }
        return set;
      },
      [leaveByEmpId]
  );

  const summaryRows = useCallback(() => {
    return attendance.map((emp) => {
      const worked = workedDaysByEmpId(emp, selectedYear);
      const leaves = leaveDaysByEmpId(emp.id, selectedYear);
      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        epfNo: emp.epfNo,
        workedDays: worked.size,
        leaveDays: leaves.size,
      };
    });
  }, [attendance, leaveDaysByEmpId, selectedYear, workedDaysByEmpId]);

  const openCalendar = (empId: number) => {
    const emp = attendance.find((e) => e.id === empId) || null;
    if (!emp) return;
    setCalendarEmp(emp);
    setIsCalendarOpen(true);
  };

  const closeCalendar = () => {
    setIsCalendarOpen(false);
    setCalendarEmp(null);
  };

  const calendarMonths = useCallback((year: number) => {
    const months = [] as { month: number; label: string }[];
    for (let m = 0; m < 12; m += 1) {
      const label = new Date(year, m, 1).toLocaleString(undefined, { month: "long" });
      months.push({ month: m, label });
    }
    return months;
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        navigate("/login");
        return;
      }

      const response = await fetch(
          `/api/attendance/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (!response.ok) {
        throw new Error("Failed to delete attendance");
      }

      setAttendance((prevAttendance) =>
          prevAttendance.filter((att) => att.id !== id)
      );
      setFilteredAttendance((prev) => prev.filter((att) => att.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const totalPages = Math.ceil((filteredAttendance?.length || 0) / rowsPerPage);

  const paginatedData = Array.isArray(filteredAttendance)
      ? filteredAttendance.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
      )
      : [];

  const columns: Column<Attendance>[] = [
    {
      key: "photo",
      title: "Photo",
      render: (item) => (
          <div className="flex items-center justify-center">
            {photoUrls[item.id] ? (
                <img
                    src={photoUrls[item.id]}
                    alt={`${item.firstName} ${item.lastName}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.firstName}+${item.lastName}&background=6366f1&color=fff&size=40`;
                    }}
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {item.firstName.charAt(0)}
                {item.lastName.charAt(0)}
              </span>
                </div>
            )}
          </div>
      ),
    },
    {
      key: "name",
      title: "Name",
      render: (item) => (
          <span className="text-xs">{`${item.firstName} ${item.lastName}`}</span>
      ),
    },
    {
      key: "epfNo",
      title: "EPF No",
      render: (item) => <span className="text-xs">{item.epfNo}</span>,
    },
    {
      key: "startedAt",
      title: "Started At",
      render: (item) => (
          <div className="space-y-1">
            {item.attendanceList.map((att, index) => (
                <div key={`${att.id}-${index}`} className="text-xs">
                  {new Date(att.startedAt).toLocaleString()}
                </div>
            ))}
            {item.attendanceList.length === 0 && (
                <span className="text-xs text-gray-500">No records</span>
            )}
          </div>
      ),
    },
    {
      key: "endedAt",
      title: "Ended At",
      render: (item) => (
          <div className="space-y-1">
            {item.attendanceList.map((att, index) => (
                <div key={`${att.id}-${index}`} className="text-xs">
                  {att.endedAt
                      ? new Date(att.endedAt).toLocaleString()
                      : isAttendanceEnded(att)
                          ? "Completed"
                          : "In progress"}
                </div>
            ))}
            {item.attendanceList.length === 0 && (
                <span className="text-xs text-gray-500">No records</span>
            )}
          </div>
      ),
    },
    {
      key: "workingStatus",
      title: "Working Status",
      render: (item) => (
          <div className="space-y-1">
            {item.attendanceList.map((att) => (
                <div key={att.id} className="text-xs">
                  {att.working_status}
                </div>
            ))}
            {item.attendanceList.length === 0 && (
                <span className="text-xs text-gray-500">No records</span>
            )}
          </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item) => (
          (() => {
            const badge = getDayStatusBadge(item);
            return (
                <span
                    className={`px-2 text-xs py-0.5 rounded-full ${badge.className} text-white`}
                >
              {badge.label}
            </span>
            );
          })()
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
          <div className="flex space-x-2">
            <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                aria-label="Delete"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
      ),
    },
  ];

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              onClick={() => {
                setError("");
                setLoading(true);
                const fetchAttendance = async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const companyId = localStorage.getItem("cmpnyId");

                    if (!token || !companyId) {
                      navigate("/login");
                      return;
                    }

                    const response = await fetch(
                        `/api/employee/attendanceList/${companyId}`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                        }
                    );

                    if (!response.ok) {
                      if (response.status === 401) {
                        navigate("/login");
                        return;
                      }
                      if (response.status === 404) {
                        setAttendance([]);
                        setFilteredAttendance([]);
                        return;
                      }
                      throw new Error("Failed to fetch attendance");
                    }

                    const data: ApiResponse = await response.json();
                    if (data.resultCode === 100) {
                      setAttendance(data.EmployeeList || []);
                      setFilteredAttendance(data.EmployeeList || []);
                    } else {
                      setAttendance([]);
                      setFilteredAttendance([]);
                      throw new Error(data.resultDesc);
                    }
                  } catch (error) {
                    setAttendance([]);
                    setFilteredAttendance([]);
                    setError(
                        error instanceof Error
                            ? error.message
                            : "An unknown error occurred"
                    );
                  } finally {
                    setLoading(false);
                  }
                };
                fetchAttendance();
              }}
          >
            Try Again
          </button>
        </div>
    );
  }

  // Check if filteredAttendance is empty or all employees have no attendance records for the selected date
  const hasAttendanceRecords = filteredAttendance.some(
      (emp) => emp.attendanceList.length > 0
  );

  if (!hasAttendanceRecords) {
    return (
        <div className="p-6">
          <DateFilter onDateChange={handleDateChange} />
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md">
            <p className="text-lg font-semibold text-gray-700">
              No attendance records found
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {selectedDate
                  ? `No attendance records for ${new Date(
                      selectedDate
                  ).toLocaleDateString()}.`
                  : "Please select a date to view attendance records."}
            </p>
            <button
                className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                onClick={() => navigate("/attendance/mark")} // Adjust the route as needed
            >
              Add Attendance
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="p-6">
        <DateFilter onDateChange={handleDateChange} />
        
        {/* Department Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Department:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.dpt_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredAttendance.length} of {attendance.length} employees
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="text-lg font-semibold text-gray-800">
              Employee Year Summary
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Year:</div>
              <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-200 rounded-md px-3 py-1 text-sm"
              >
                {yearOptions().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[700px] w-full">
              <thead>
              <tr className="text-left bg-gray-100 border-gray-200">
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Employee</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">EPF No</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Worked Days</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Leave Days</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Action</th>
              </tr>
              </thead>
              <tbody>
              {summaryRows().map((row) => (
                  <tr
                      key={row.id}
                      className="border-b border-b-neutral-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        {photoUrls[row.id] ? (
                            <img
                                src={photoUrls[row.id]}
                                alt={row.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        )}
                        <div className="font-medium">{row.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.epfNo}</td>
                    <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">
                      {row.workedDays}
                    </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                      {row.leaveDays}
                    </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                          type="button"
                          onClick={() => openCalendar(row.id)}
                          className="px-3 py-1.5 rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                      >
                        View Calendar
                      </button>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-sky-400"></span>
              Worked days
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-orange-400"></span>
              Approved leave days
            </div>
          </div>
        </div>

        <Table
            columns={columns}
            data={paginatedData}
            title="Attendance List"
            searchKeys={[
              "firstName",
              "lastName",
              "epfNo",
              "email",
              "attendanceList.working_status",
            ]}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
            }}
        />

        {isCalendarOpen && calendarEmp ? (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="text-base font-semibold text-gray-900">
                    {calendarEmp.firstName} {calendarEmp.lastName} - {selectedYear}
                  </div>
                  <button
                      type="button"
                      onClick={closeCalendar}
                      className="px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                <div className="p-4 overflow-auto max-h-[80vh]">
                  {(() => {
                    const worked = workedDaysByEmpId(calendarEmp, selectedYear);
                    const leaves = leaveDaysByEmpId(calendarEmp.id, selectedYear);
                    const months = calendarMonths(selectedYear);

                    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                    const getCells = (year: number, month: number) => {
                      const firstDay = new Date(year, month, 1);
                      const startWeekday = firstDay.getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const start = new Date(year, month, 1 - startWeekday);
                      const cells: { date: Date; inMonth: boolean; key: string }[] = [];

                      for (let i = 0; i < 42; i += 1) {
                        const d = new Date(start);
                        d.setDate(start.getDate() + i);
                        cells.push({
                          date: d,
                          inMonth: d.getMonth() === month,
                          key: toDateKeyLocal(d),
                        });
                      }

                      if (daysInMonth <= 28 && startWeekday === 0) return cells.slice(0, 35);
                      return cells;
                    };

                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {months.map((m) => (
                              <div key={m.month} className="border border-gray-200 rounded-xl p-3">
                                <div className="text-sm font-semibold text-gray-900 mb-2">
                                  {m.label}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-1">
                                  {weekdayLabels.map((w) => (
                                      <div key={w} className="text-center">{w}</div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {getCells(selectedYear, m.month).map((cell) => {
                                    const isLeave = cell.inMonth && leaves.has(cell.key);
                                    const isWorked = cell.inMonth && worked.has(cell.key);

                                    const bg = isLeave
                                        ? "bg-orange-300"
                                        : isWorked
                                            ? "bg-sky-300"
                                            : "bg-transparent";
                                    const text = cell.inMonth ? "text-gray-800" : "text-gray-300";

                                    const title = cell.inMonth
                                        ? isLeave
                                            ? "Leave"
                                            : isWorked
                                                ? "Worked"
                                                : ""
                                        : "";

                                    return (
                                        <div
                                            key={cell.key}
                                            title={title}
                                            className={`h-8 rounded-md border border-gray-100 flex items-center justify-center ${bg} ${text}`}
                                        >
                                          {cell.date.getDate()}
                                        </div>
                                    );
                                  })}
                                </div>
                              </div>
                          ))}
                        </div>
                    );
                  })()}
                </div>
              </div>
            </div>
        ) : null}
      </div>
  );
};

export default AttendanceTable;
