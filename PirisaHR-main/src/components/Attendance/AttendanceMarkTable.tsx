import React, { useState, useEffect } from "react";
import Table from "../../components/table/Table";
import { User } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Attendance {
  id: number;
  startedAt: string;
  endedAt: string | null;
  workingStatus: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  epfNo: string;
  department: {
    id: number;
    dpt_name: string;
  };
  attendanceList: Attendance[];
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: Employee[];
}

interface AttendanceRequest {
  startedAt: string;
  endedAt: string | null;
  empId: number;
  working_status: "On-Site" | "Online";
  attendance_status: string;
}

interface EmployeeOnLeave {
  id: number;
  empId: number;
  leaveType: string;
  leaveStartDay: string;
  leaveEndDay: string;
  leaveDays: number;
  leaveReason: string;
  leaveStatus: string;
}

const AttendanceMarkTable = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [employeesOnLeave, setEmployeesOnLeave] = useState<EmployeeOnLeave[]>([]);
  const [departments, setDepartments] = useState<{id: number; dpt_name: string}[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  const [attendanceStatus, setAttendanceStatus] = useState<{
    [key: number]: "On-Site" | "Online";
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Helper function to get local time in simple ISO format (no timezone)
  const getLocalTimeISO = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        if (!token || !companyId) {
          throw new Error("No token or company ID found");
        }

        const response = await fetch(
          `http://localhost:8080/employee/lastattendanceList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setEmployees([]);
            setFilteredEmployees([]);
            return;
          }
          throw new Error("Failed to fetch employees");
        }

        const data: ApiResponse = await response.json();
        if (data.resultCode === 100) {
          const list = data.EmployeeList || [];
          setEmployees(list);
          
          // Extract unique departments
          const uniqueDepts = Array.from(
            new Map(
              list
                .filter((emp): emp is Employee & {department: {id: number; dpt_name: string}} => emp.department !== undefined)
                .map(emp => [emp.department.id, {id: emp.department.id, dpt_name: emp.department.dpt_name}] as [number, {id: number; dpt_name: string}])
            ).values()
          );
          setDepartments(uniqueDepts);
          
          if (list.length > 0) {
            await fetchEmployeePhotos(list, token);
          }
        } else {
          throw new Error(data.resultDesc);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchEmployeesOnLeave = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found");
        }

        const response = await fetch(
          "http://localhost:8080/emp_leave/employees-on-leave-today",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch employees on leave");
        }

        const data = await response.json();
        if (data.resultCode === 100) {
          setEmployeesOnLeave(data.employeesOnLeave || []);
        }
      } catch (err) {
        console.error("Failed to fetch employees on leave:", err);
      }
    };

    // Fetch both data sets sequentially to ensure proper filtering
    const fetchData = async () => {
      await fetchEmployees();
      await fetchEmployeesOnLeave();
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Apply filtering when employees or employeesOnLeave data changes
    if (employees.length > 0) {
      applyDepartmentFilter(employees, selectedDepartment);
    }
  }, [employees, employeesOnLeave, selectedDepartment]);

  useEffect(() => {
    return () => {
      Object.values(photoUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // no-op
        }
      });
    };
  }, [photoUrls]);

  const fetchEmployeePhotos = async (employeeList: Employee[], token: string) => {
    // Cleanup previous URLs
    Object.values(photoUrls).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    });

    const photoUrlMap: Record<number, string> = {};

    await Promise.all(
      employeeList.map(async (employee) => {
        try {
          const existsResp = await fetch(
            `http://localhost:8080/api/profile-image/exists/${employee.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!existsResp.ok) return;
          const existsData: { hasProfileImage?: boolean; exists?: boolean } =
            await existsResp.json();
          const hasImage = Boolean(
            existsData?.hasProfileImage ?? existsData?.exists
          );
          if (!hasImage) return;

          const imgResp = await fetch(
            `http://localhost:8080/api/profile-image/view/${employee.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!imgResp.ok) return;
          const blob = await imgResp.blob();
          if (!blob || blob.size === 0) return;
          photoUrlMap[employee.id] = URL.createObjectURL(blob);
        } catch {
          // ignore photo failures; keep fallback avatar
        }
      })
    );

    setPhotoUrls(photoUrlMap);
  };

  const handleAttendanceStatusChange = (
    empId: number,
    status: "On-Site" | "Online",
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setAttendanceStatus((prev) => ({
      ...prev,
      [empId]: status,
    }));
  };

  const handleMarkAttendance = async (
    empId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const status = attendanceStatus[empId] || "On-Site";

    toast.info(
      <div>
        <p>
          Are you sure you want to mark attendance as <strong>{status}</strong>?
        </p>
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem("token");
                if (!token) {
                  throw new Error("No token found");
                }

                const attendanceData: AttendanceRequest = {
                  startedAt: getLocalTimeISO(),
                  endedAt: null,
                  empId: empId,
                  working_status: status,
                  attendance_status: "ACTIVE",
                };

                const response = await fetch(
                  "http://localhost:8080/attendance/add_attendance",
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(attendanceData),
                  }
                );

                if (!response.ok) {
                  throw new Error("Failed to mark attendance");
                }

                toast.success("Attendance marked successfully!");
                setLoading(true);
                fetchEmployees();
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to mark attendance"
                );
              }
            }}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
      }
    );
  };

  const handleEndDate = async (
    attendanceId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    toast.info(
      <div>
        <p>Are you sure you want to end the attendance?</p>
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem("token");
                if (!token) {
                  throw new Error("No token found");
                }

                const updateData = {
                  endedAt: getLocalTimeISO(),
                };

                const response = await fetch(
                  `http://localhost:8080/attendance/update/${attendanceId}`,
                  {
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                  }
                );

                if (!response.ok) {
                  throw new Error("Failed to update end time");
                }

                toast.success("End time recorded successfully!");
                setLoading(true);
                fetchEmployees();
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to update end time"
                );
              }
            }}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
      }
    );
  };

  const handleCancelLeaveAndMarkAttendance = async (
    employee: Employee,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    const leaveInfo = getEmployeeLeaveInfo(employee.id);
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    toast.info(
      <div className="max-w-md">
        <div className="mb-4">
          <p className="font-semibold text-gray-800 mb-2">
            Cancel Leave & Mark Attendance
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-sm text-yellow-800">
              <strong>{employeeName}</strong> is currently on leave:
            </p>
            <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
              <li>Leave Type: {leaveInfo?.leaveType || "N/A"}</li>
              <li>Period: {leaveInfo ? new Date(leaveInfo.leaveStartDay).toLocaleDateString() : "N/A"} - {leaveInfo ? new Date(leaveInfo.leaveEndDay).toLocaleDateString() : "N/A"}</li>
              <li>Reason: {leaveInfo?.leaveReason || "N/A"}</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Do you want to cancel this leave and mark attendance for today?
          </p>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason (optional):
            </label>
            <input
              type="text"
              id="cancellationReason"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Employee came to office"
              defaultValue="Employee came to office"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem("token");
                if (!token) {
                  throw new Error("No token found");
                }

                const cancellationReason = (document.getElementById('cancellationReason') as HTMLInputElement)?.value || "Employee came to office";
                const currentUser = localStorage.getItem("userName") || "HR Admin";

                const requestData = {
                  empId: employee.id,
                  cancellationReason: cancellationReason,
                  canceledBy: currentUser
                };

                const response = await fetch(
                  "http://localhost:8080/emp_leave/cancel-leave-and-mark-attendance",
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestData),
                  }
                );

                if (!response.ok) {
                  throw new Error("Failed to cancel leave");
                }

                const result = await response.json();
                if (result.resultCode === 100) {
                  toast.success(
                    <div>
                      <p className="font-semibold">Success!</p>
                      <p className="text-sm">Leave cancelled and {employeeName} is now available for attendance marking.</p>
                    </div>
                  );
                  
                  // Refresh data to update both tables
                  setLoading(true);
                  await fetchEmployees();
                } else {
                  toast.error(result.resultDesc || "Failed to cancel leave");
                }
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to cancel leave and mark attendance"
                );
              }
            }}
          >
            Confirm & Mark Attendance
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
      }
    );
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        throw new Error("No token or company ID found");
      }

      const response = await fetch(
        `http://localhost:8080/employee/lastattendanceList/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setEmployees([]);
          setFilteredEmployees([]);
          return;
        }
        throw new Error("Failed to fetch employees");
      }

      const data: ApiResponse = await response.json();
      if (data.resultCode === 100) {
        const list = data.EmployeeList || [];
        setEmployees(list);
        applyDepartmentFilter(list, selectedDepartment);
        
        // Extract unique departments
        const uniqueDepts = Array.from(
          new Map(
            list
              .filter((emp): emp is Employee & {department: {id: number; dpt_name: string}} => emp.department !== undefined)
              .map(emp => [emp.department.id, {id: emp.department.id, dpt_name: emp.department.dpt_name}] as [number, {id: number; dpt_name: string}])
          ).values()
        );
        setDepartments(uniqueDepts);
        
        if (list.length > 0) {
          await fetchEmployeePhotos(list, token);
        }
      } else {
        throw new Error(data.resultDesc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }

    // Also fetch employees on leave
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch(
          "http://localhost:8080/emp_leave/employees-on-leave-today",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.resultCode === 100) {
            setEmployeesOnLeave(data.employeesOnLeave || []);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch employees on leave:", err);
    }
  };

  const applyDepartmentFilter = (employeeList: Employee[], departmentId: number) => {
    let filtered = employeeList;
    
    // Filter by department if selected
    if (departmentId !== 0) {
      filtered = filtered.filter(emp => emp.department && emp.department.id === departmentId);
    }
    
    // Filter out employees who are on leave
    filtered = filtered.filter(emp => !isEmployeeOnLeave(emp.id));
    
    setFilteredEmployees(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDepartmentChange = (departmentId: number) => {
    setSelectedDepartment(departmentId);
    applyDepartmentFilter(employees, departmentId);
  };

  const hasActiveAttendance = (employee: Employee): Attendance | null => {
    if (employee.attendanceList && employee.attendanceList.length > 0) {
      const latestAttendance = employee.attendanceList[0];
      if (latestAttendance.startedAt && latestAttendance.endedAt === null) {
        return latestAttendance;
      }
    }
    return null;
  };

  const isEmployeeOnLeave = (empId: number): boolean => {
    return employeesOnLeave.some(leave => leave.empId === empId);
  };

  const getEmployeeLeaveInfo = (empId: number): EmployeeOnLeave | null => {
    return employeesOnLeave.find(leave => leave.empId === empId) || null;
  };

  // Get employees who are on leave for the leave table
  const getEmployeesOnLeaveData = (): Employee[] => {
    return employees.filter(emp => isEmployeeOnLeave(emp.id));
  };

  // Columns for employees on leave table
  const leaveTableColumns = [
    {
      key: "photo",
      title: "Photo",
      render: (item: Employee) => {
        const imageUrl = photoUrls[item.id] || null;
        return (
          <div className="flex items-center justify-center w-10 h-10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${item.firstName} ${item.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
                onError={() => {
                  setPhotoUrls((prev) => {
                    const next = { ...prev };
                    const existing = next[item.id];
                    if (existing) {
                      try {
                        URL.revokeObjectURL(existing);
                      } catch {
                        // no-op
                      }
                      delete next[item.id];
                    }
                    return next;
                  });
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "name",
      title: "Name",
      render: (item: Employee) => {
        const leaveInfo = getEmployeeLeaveInfo(item.id);
        return (
          <div>
            <span className="text-xs">{`${item.firstName} ${item.lastName}`}</span>
            {leaveInfo && (
              <div className="text-xs text-red-600 font-medium">On Leave</div>
            )}
          </div>
        );
      },
    },
    {
      key: "epfNo",
      title: "Employee ID",
      render: (item: Employee) => <span className="text-xs">{item.epfNo}</span>,
    },
    {
      key: "department",
      title: "Department",
      render: (item: Employee) => (
        <span className="text-xs">{item.department?.dpt_name || "N/A"}</span>
      ),
    },
    {
      key: "leaveType",
      title: "Leave Type",
      render: (item: Employee) => {
        const leaveInfo = getEmployeeLeaveInfo(item.id);
        return <span className="text-xs">{leaveInfo?.leaveType || "N/A"}</span>;
      },
    },
    {
      key: "leavePeriod",
      title: "Leave Period",
      render: (item: Employee) => {
        const leaveInfo = getEmployeeLeaveInfo(item.id);
        if (leaveInfo) {
          const startDate = new Date(leaveInfo.leaveStartDay).toLocaleDateString();
          const endDate = new Date(leaveInfo.leaveEndDay).toLocaleDateString();
          return (
            <span className="text-xs">
              {startDate} - {endDate}
            </span>
          );
        }
        return <span className="text-xs">N/A</span>;
      },
    },
    {
      key: "leaveReason",
      title: "Leave Reason",
      render: (item: Employee) => {
        const leaveInfo = getEmployeeLeaveInfo(item.id);
        return <span className="text-xs">{leaveInfo?.leaveReason || "N/A"}</span>;
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (item: Employee) => {
        return (
          <button
            onClick={(e) => handleCancelLeaveAndMarkAttendance(item, e)}
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
            aria-label="Cancel Leave & Mark Attendance"
          >
            <span className="text-xs text-blue-600">Cancel Leave & Mark Attendance</span>
          </button>
        );
      },
    },
  ];

  const columns = [
    {
      key: "photo",
      title: "Photo",
      render: (item: Employee) => {
        const imageUrl = photoUrls[item.id] || null;
        return (
          <div className="flex items-center justify-center w-10 h-10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${item.firstName} ${item.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
                onError={() => {
                  setPhotoUrls((prev) => {
                    const next = { ...prev };
                    const existing = next[item.id];
                    if (existing) {
                      try {
                        URL.revokeObjectURL(existing);
                      } catch {
                        // no-op
                      }
                      delete next[item.id];
                    }
                    return next;
                  });
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "name",
      title: "Name",
      render: (item: Employee) => (
        <span className="text-xs">{`${item.firstName} ${item.lastName}`}</span>
      ),
    },
    {
      key: "epfNo",
      title: "Employee ID",
      render: (item: Employee) => <span className="text-xs">{item.epfNo}</span>,
    },
    {
      key: "department",
      title: "Department",
      render: (item: Employee) => (
        <span className="text-xs">{item.department.dpt_name}</span>
      ),
    },
    {
      key: "attendanceStatus",
      title: "Attendance Status",
      render: (item: Employee) => {
        const activeAttendance = hasActiveAttendance(item);
        return activeAttendance ? (
          <span className="text-xs text-green-600">Working On</span>
        ) : (
          <select
            className="p-1 border rounded-md text-xs"
            value={attendanceStatus[item.id] || "On-Site"}
            onChange={(e) =>
              handleAttendanceStatusChange(
                item.id,
                e.target.value as "On-Site" | "Online",
                e as unknown as React.MouseEvent
              )
            }
            onClick={(e) => e.stopPropagation()}
          >
            <option value="On-Site">On-Site</option>
            <option value="Online">Online</option>
          </select>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (item: Employee) => {
        const activeAttendance = hasActiveAttendance(item);
        return activeAttendance ? (
          <button
            onClick={(e) => handleEndDate(activeAttendance.id, e)}
            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
            aria-label="End Date"
          >
            <span className="text-xs text-red-600">End Date</span>
          </button>
        ) : (
          <button
            onClick={(e) => handleMarkAttendance(item.id, e)}
            className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
            aria-label="Mark Attendance"
          >
            <span className="text-xs text-green-600">Mark Attendance</span>
          </button>
        );
      },
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
            fetchEmployees();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-700">
            No employees found
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add an employee to start marking attendance.
          </p>
          <button
            className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
            onClick={() => (window.location.href = "/employee/new")} // Adjust the route as needed
          >
            Add Employee
          </button>
          <ToastContainer />
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedData = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-6 space-y-6">
      {/* Department Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
            Showing {filteredEmployees.length} of {employees.length} employees available for attendance
          </div>
        </div>
      </div>

      {/* Employees Available for Attendance */}
      <div>
        <Table
          columns={columns}
          data={paginatedData}
          title="Mark Attendance"
          searchKeys={["firstName", "lastName", "epfNo", "department.dpt_name"]}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Employees on Leave */}
      {getEmployeesOnLeaveData().length > 0 && (
        <div>
          <Table
            columns={leaveTableColumns}
            data={getEmployeesOnLeaveData()}
            title="Employees on Leave (Cannot Mark Attendance)"
            searchKeys={["firstName", "lastName", "epfNo", "department.dpt_name"]}
            pagination={undefined}
          />
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
};

export default AttendanceMarkTable;
