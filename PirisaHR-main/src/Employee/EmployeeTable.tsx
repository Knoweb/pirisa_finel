import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../components/table/Table";
import { Pencil, Trash2, User } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../components/Loading/Loading";

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  epfNo: string;
  designation: {
    id: number;
    designation: string;
    dptId: number;
  };
  department: {
    id: number;
    dpt_name: string;
    dpt_code: string;
  };
  dateOfJoining: string;
  status: "ACTIVE" | "INACTIVE";
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: Employee[];
}

interface DeleteResponse {
  response: {
    resultCode: number;
    resultDesc: string;
  };
  id: number;
}

const EmployeeTable = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const rowsPerPage = 10;

  const [departmentPages, setDepartmentPages] = useState<Record<string, number>>({});
  const [collapsedDepartments, setCollapsedDepartments] = useState<Record<string, boolean>>({});

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        navigate("/login");
        return;
      }

      const response = await fetch(
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
        if (response.status === 403) {
          throw new Error(
            "Permission error: You do not have access to view employees."
          );
        }
        if (response.status === 404) {
          setEmployees([]);
          return;
        }
        throw new Error("Failed to fetch employees. Please try again later.");
      }

      const data: ApiResponse = await response.json();
      if (data.resultCode === 100) {
        const employeeList = data.EmployeeList || [];
        setEmployees(employeeList);

        if (employeeList.length > 0) {
          await fetchEmployeePhotos(employeeList, token);
        }
      } else {
        throw new Error(data.resultDesc || "Failed to fetch employees");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching employees"
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchEmployees();

    const intervalId = window.setInterval(() => {
      fetchEmployees();
    }, 30000);

    const handleFocus = () => {
      fetchEmployees();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchEmployees();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchEmployees]);

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
    employeeList: Employee[],
    token: string
  ) => {
    const photoPromises = employeeList.map(async (employee) => {
      try {
        // First check if employee has a profile image
        const existsResponse = await fetch(
          `/api/profile-image/exists/${employee.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (existsResponse.ok) {
          const existsData = await existsResponse.json();

          const hasImage = Boolean(
            existsData?.hasProfileImage ?? existsData?.exists
          );

          if (hasImage) {
            // If image exists, fetch it
            const photoResponse = await fetch(
              `/api/profile-image/view/${employee.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (photoResponse.ok) {
              const blob = await photoResponse.blob();
              const imageUrl = URL.createObjectURL(blob);
              return { id: employee.id, url: imageUrl };
            }
          }
        }
        
        return { id: employee.id, url: null };
      } catch (error) {
        console.error(`Error fetching photo for employee ${employee.id}:`, error);
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

  const handleEdit = (id: number) => {
    navigate(`/employee/edit/${id}`);
  };

  const handleDelete = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();

    toast.info(
      <div>
        <p>Are you sure you want to delete this employee?</p>
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem("token");
                const companyId = localStorage.getItem("cmpnyId");

                if (!token || !companyId) {
                  navigate("/login");
                  return;
                }

                const response = await fetch(
                  `/api/employee/${id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (!response.ok) {
                  if (response.status === 403) {
                    throw new Error(
                      "Permission error: You do not have access to delete employees."
                    );
                  }
                  throw new Error("Failed to delete employee");
                }

                const data: DeleteResponse = await response.json();
                //console.log("Delete API Response:", data);

                if (data.response.resultCode === 100) {
                  toast.success("Employee deleted successfully!");
                  setEmployees(employees.filter((emp) => emp.id !== id));
                } else {
                  throw new Error(
                    data.response.resultDesc || "Failed to delete employee"
                  );
                }
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "An error occurred while deleting the employee"
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

  const departmentGroups = useMemo(() => {
    const groups = new Map<string, Employee[]>();

    (employees ?? []).forEach((emp) => {
      const deptName = emp?.department?.dpt_name?.trim() || "Unassigned";
      const list = groups.get(deptName) ?? [];
      list.push(emp);
      groups.set(deptName, list);
    });

    return Array.from(groups.entries())
      .map(([departmentName, list]) => ({ departmentName, list }))
      .sort((a, b) => a.departmentName.localeCompare(b.departmentName));
  }, [employees]);

  const columns: Column<Employee>[] = [
    {
      key: "photo",
      title: "Photo",
      render: (item) => {
        const imageUrl = photoUrls[item.id];
        
        return (
          <div className="flex items-center justify-center w-10 h-10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${item.firstName} ${item.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  // If image fails to load, hide it and show the user icon
                  e.currentTarget.style.display = "none";
                  const nextSibling = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ${
                imageUrl ? "hidden" : ""
              }`}
            >
              <User size={16} className="text-gray-500" />
            </div>
          </div>
        );
      },
    },
    {
      key: "name",
      title: "Name",
      render: (item) => (
        <span className="text-xs">{`${item.firstName} ${item.lastName}`}</span>
      ),
    },
    {
      key: "email",
      title: "Email",
      render: (item) => <span className="text-xs">{item.email}</span>,
    },
    {
      key: "epfNo",
      title: "Employee ID",
      render: (item) => <span className="text-xs">{item.epfNo}</span>,
    },
    {
      key: "designation",
      title: "Position",
      render: (item) => (
        <span className="text-xs">{item.designation.designation}</span>
      ),
    },
    {
      key: "dateOfJoining",
      title: "Joined Date",
      render: (item) => <span className="text-xs">{item.dateOfJoining}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(item.id)}
            className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200 transition-colors"
            aria-label="Edit"
          >
            <Pencil size={16} className="text-sky-600" />
          </button>
          <button
            onClick={(e) => handleDelete(item.id, e)}
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
            const fetchEmployees = async () => {
              try {
                const token = localStorage.getItem("token");
                const companyId = localStorage.getItem("cmpnyId");

                if (!token || !companyId) {
                  navigate("/login");
                  return;
                }

                const response = await fetch(
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
                  if (response.status === 403) {
                    throw new Error(
                      "Permission error: You do not have access to view employees."
                    );
                  }
                  if (response.status === 404) {
                    setEmployees([]);
                    return;
                  }
                  throw new Error(
                    "Failed to fetch employees. Please try again later."
                  );
                }

                const data: ApiResponse = await response.json();
                if (data.resultCode === 100) {
                  const employeeList = data.EmployeeList || [];
                  setEmployees(employeeList);

                  // Fetch photos for all employees
                  if (employeeList.length > 0) {
                    await fetchEmployeePhotos(employeeList, token);
                  }
                } else {
                  throw new Error(
                    data.resultDesc || "Failed to fetch employees"
                  );
                }
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "An error occurred while fetching employees"
                );
              } finally {
                setLoading(false);
              }
            };
            fetchEmployees();
          }}
        >
          <div className="flex">
            <Loading size="sm" color="border-white" className="inline mr-2" />
            Try Again
          </div>
        </button>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md">
        <p className="text-lg font-semibold text-gray-700">
          No employees added yet
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Add your first employee to get started!
        </p>
        <button
          className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
          onClick={() => navigate("/employee/new")}
        >
          Add Employee
        </button>
        <ToastContainer />
      </div>
    );
  }

  const toggleDepartment = (dept: string) => {
    setCollapsedDepartments((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const getDepartmentPage = (dept: string): number => {
    return departmentPages[dept] ?? 1;
  };

  const setDepartmentPage = (dept: string, page: number) => {
    setDepartmentPages((prev) => ({
      ...prev,
      [dept]: page,
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {departmentGroups.map(({ departmentName, list }) => {
        const collapsed = Boolean(collapsedDepartments[departmentName]);
        const currentPage = getDepartmentPage(departmentName);
        const totalPages = Math.max(1, Math.ceil(list.length / rowsPerPage));
        const safePage = Math.min(currentPage, totalPages);
        const paginated = list.slice(
          (safePage - 1) * rowsPerPage,
          safePage * rowsPerPage
        );

        return (
          <div key={departmentName} className="bg-white rounded-lg shadow-sm">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 hover:bg-gray-50"
              onClick={() => toggleDepartment(departmentName)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-700">
                  Employee List • {departmentName}
                </span>
                <span className="text-xs text-gray-500">
                  {list.length} employee(s)
                </span>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {collapsed ? "Show" : "Hide"}
              </span>
            </button>

            {!collapsed && (
              <div className="p-2 sm:p-3">
                <Table
                  columns={columns}
                  data={paginated}
                  searchKeys={[
                    "firstName",
                    "lastName",
                    "email",
                    "epfNo",
                    "designation.designation",
                    "dateOfJoining",
                  ]}
                  pagination={{
                    currentPage: safePage,
                    totalPages,
                    onPageChange: (p) => setDepartmentPage(departmentName, p),
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      <ToastContainer />
    </div>
  );
};

export default EmployeeTable;
