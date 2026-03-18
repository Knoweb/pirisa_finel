import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Loading from "../../components/Loading/Loading";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface LeaveItem {
  id: number;
  leaveType: string;
  leaveReason: string;
  leaveStatus: "PENDING" | "APPROVED" | "REJECTED";
  leaveStartDay: string;
  leaveEndDay: string;
  leaveDays: number;
}

interface EmployeeLeaveData {
  id: number;
  epfNo: string;
  firstName: string;
  lastName: string;
  leaveList: LeaveItem[];
}

const EmployeeLeaveList = () => {
  const [employeeData, setEmployeeData] = useState<EmployeeLeaveData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchLeaveData = async () => {
      const token = localStorage.getItem("token");
      const empId = localStorage.getItem("empId");

      if (!token || !empId) {
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/employee/EmpDetailsListByEmp/${empId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch leave data");
        }

        const data = await response.json();
        if (data.resultCode === 100 && data.EmployeeLeaveList?.length > 0) {
          // Sort leaveList by leaveStartDay in descending order (newest first)
          const sortedLeaveList = [...data.EmployeeLeaveList[0].leaveList].sort(
            (a, b) => {
              return (
                new Date(b.leaveStartDay).getTime() -
                new Date(a.leaveStartDay).getTime()
              );
            }
          );
          setEmployeeData({
            ...data.EmployeeLeaveList[0],
            leaveList: sortedLeaveList,
          });
        } else {
          throw new Error(data.resultDesc || "No leave data found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <FaCheck className="text-green-500" />;
      case "REJECTED":
        return <FaTimes className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Calculate pagination
  const totalPages = employeeData
    ? Math.ceil(employeeData.leaveList.length / rowsPerPage)
    : 0;
  const paginatedData = employeeData
    ? employeeData.leaveList.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      )
    : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const getVisiblePages = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    // Always show first page if not current
    if (currentPage > 2) {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
    }

    // Show current page and adjacent pages
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    // Add last page if needed
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>No leave data found</div>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <div className="max-w-6xl mx-auto mt-12">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          My Leave History
        </h1>

        {/* Leave List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {employeeData.leaveList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              You haven't applied for any leaves yet
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.leaveType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaCalendarAlt className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDate(leave.leaveStartDay)} to{" "}
                                {formatDate(leave.leaveEndDay)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {leave.leaveDays} day
                            {leave.leaveDays !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {leave.leaveReason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(leave.leaveStatus)}
                            <span
                              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                leave.leaveStatus
                              )}`}
                            >
                              {leave.leaveStatus.charAt(0) +
                                leave.leaveStatus.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 text-gray-600 disabled:text-gray-400"
                  >
                    <FaChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {getVisiblePages().map((page, index) =>
                      page === "..." ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-1">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`px-3 py-1 rounded ${
                            currentPage === page
                              ? "bg-sky-500 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 text-gray-600 disabled:text-gray-400"
                  >
                    Next
                    <FaChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveList;
