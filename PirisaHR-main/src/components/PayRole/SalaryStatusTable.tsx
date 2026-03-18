import React, { useState, useEffect } from "react";
import Table from "../../components/table/Table";
import { User } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Loading from "../Loading/Loading";

interface PayrollEntry {
  id: number;
  net_salary?: number;
  createdAt?: string;
}

interface PayroleEmployeeApi {
  id: number;
  firstName: string;
  lastName: string;
  epfNo: string;
  payroleList?: PayrollEntry[];
}

interface EmpDetailsApi {
  id: number;
  designation?: {
    designation?: string;
  };
  department?: {
    dpt_name?: string;
  };
}

interface EmployeeRow {
  id: number;
  firstName: string;
  lastName: string;
  epfNo: string;
  departmentName: string;
  roleName: string;
  salary: number;
  isPaid: boolean;
}

interface ApiResponse<T> {
  resultCode: number;
  resultDesc: string;
  EmployeeList: T[];
}

const SalaryStatusTable = () => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const rowsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  const fetchEmployeePhotos = async (employeeList: EmployeeRow[], token: string) => {
    const photoPromises = employeeList.map(async (employee) => {
      try {
        const existsResp = await fetch(
          `http://localhost:8080/api/profile-image/exists/${employee.id}`,
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
          `http://localhost:8080/api/profile-image/view/${employee.id}`,
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

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        throw new Error("No token or company ID found");
      }

      const [payrollResponse, detailsResponse] = await Promise.all([
        fetch(`http://localhost:8080/employee/payroleList/${companyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`http://localhost:8080/employee/EmpDetailsList/${companyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!payrollResponse.ok || !detailsResponse.ok) {
        if (payrollResponse.status === 404 || detailsResponse.status === 404) {
          setEmployees([]);
          return;
        }
        throw new Error("Failed to fetch employees");
      }

      const payrollData: ApiResponse<PayroleEmployeeApi> = await payrollResponse.json();
      const detailsData: ApiResponse<EmpDetailsApi> = await detailsResponse.json();

      if (payrollData.resultCode !== 100 || detailsData.resultCode !== 100) {
        throw new Error(
          payrollData.resultDesc || detailsData.resultDesc || "Failed to fetch"
        );
      }

      const payrollEmployees = payrollData.EmployeeList || [];
      const detailsEmployees = detailsData.EmployeeList || [];
      const detailsMap = new Map<number, EmpDetailsApi>();

      detailsEmployees.forEach((e) => {
        detailsMap.set(e.id, e);
      });

      const rows: EmployeeRow[] = payrollEmployees.map((e) => {
        const details = detailsMap.get(e.id);
        const payroleList = Array.isArray(e.payroleList) ? e.payroleList : [];
        const latest = payroleList.length > 0 ? payroleList[0] : undefined;
        const salary = typeof latest?.net_salary === "number" ? latest.net_salary : 0;

        return {
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          epfNo: e.epfNo,
          departmentName: details?.department?.dpt_name || "N/A",
          roleName: details?.designation?.designation || "N/A",
          salary,
          isPaid: payroleList.length > 0,
        };
      });

      setEmployees(rows);

      if (rows.length > 0) {
        await fetchEmployeePhotos(rows, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeSalary = (employeeId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    toast.info(`Make Salary for employee ID: ${employeeId}`);
    navigate(`/payrole/makesalary/${employeeId}`);
  };

  const handleViewPaySlips = (employeeId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    toast.info(`Viewing payslips for employee ID: ${employeeId}`);
    navigate(`/payrole/payslips/${employeeId}`); // Updated route
  };

  const handleDeletePayroll = (
    _employeeId: number,
    event: React.MouseEvent
  ) => {
    //if we want replace _employeeId with employeeId
    event.stopPropagation();

    toast.info(
      <div>
        <p>Are you sure you want to delete this payroll record?</p>
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 mr-2"
            onClick={() => {
              toast.dismiss();
              toast.success("Payroll record deleted successfully!");
              // Implement actual delete functionality here
            }}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
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

  const formatSalary = (amount: number) => {
    return amount.toLocaleString("en-US");
  };

  const columns = [
    {
      key: "photo",
      title: "Photo",
      render: (item: EmployeeRow) => {
        const imageUrl = photoUrls[item.id] || null;
        return (
          <div className="flex items-center justify-center w-10 h-10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${item.firstName} ${item.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
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
      render: (item: EmployeeRow) => (
        <div>
          <div className="font-medium">{`${item.firstName} ${item.lastName}`}</div>
          <div className="text-xs text-gray-500">
            Full time
          </div>
        </div>
      ),
    },
    {
      key: "department",
      title: "Department",
      render: (item: EmployeeRow) => (
        <span className="text-sm">{item.departmentName || "N/A"}</span>
      ),
    },
    {
      key: "epfNo",
      title: "Employee ID",
      render: (item: EmployeeRow) => <span className="text-sm">{item.epfNo}</span>,
    },
    {
      key: "role",
      title: "Role",
      render: (item: EmployeeRow) => (
        <div>
          <div className="text-sm">{item.roleName || "N/A"}</div>
          <div className="text-xs text-gray-500">
            Full time
          </div>
        </div>
      ),
    },
    {
      key: "salary",
      title: "Salary (Rs)",
      render: (item: EmployeeRow) => (
        <span className="text-sm">{formatSalary(item.salary || 0)}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item: EmployeeRow) => (
        <div
          className={`flex items-center p-1 rounded-xl ${
            item.isPaid ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              item.isPaid ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span
            className={`text-sm ${
              item.isPaid ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.isPaid ? "Paid" : "Pending"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Action",
      render: (item: EmployeeRow) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => handleMakeSalary(item.id, e)}
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors hover:scale-105 relative group"
            aria-label="Make Salary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100  transition-opacity">
              Make Salary
            </span>
          </button>
          <button
            onClick={(e) => handleViewPaySlips(item.id, e)}
            className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors hover:scale-105 relative group"
            aria-label="View Payslip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"
              />
            </svg>
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              View Payslip
            </span>
          </button>
          <button
            onClick={(e) => handleDeletePayroll(item.id, e)}
            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
            aria-label="Delete Payroll"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loading size="lg" className="h-64" />;
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
          className="mt-3 mx-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => {
            setError(null);
            setLoading(true);
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
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-700">
            No employees found
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add an employee to View list.
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

  const totalPages = Math.ceil(employees.length / rowsPerPage);
  const paginatedData = employees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-6">
      {/* <h1 className="text-2xl font-semibold mb-6">Employee Payroll</h1> */}
      <Table
        columns={columns}
        data={paginatedData}
        title="Salary Information"
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />
      <ToastContainer />
    </div>
  );
};

export default SalaryStatusTable;
