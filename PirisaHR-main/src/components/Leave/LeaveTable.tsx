/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../table/Table";
import { Check, X } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "./leaveTable.css";
import { toast } from "react-toastify";

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface LeaveRecord {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  leaveType: string;
  leaveStartDay: string;
  leaveEndDay: string;
  leaveDays: number;
  leaveReason: string;
  status: string;
}

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

const LeaveTable = () => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeaveStatus>("PENDING");
  const navigate = useNavigate();
  const rowsPerPage = 10;

  useEffect(() => {
    fetchLeaveRecords(activeTab);
  }, [activeTab, navigate]);

  const fetchLeaveRecords = async (status: LeaveStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");

      if (!token || !cmpId) {
        navigate("/login");
        return;
      }

      let endpoint = "";
      switch (status) {
        case "APPROVED":
          endpoint = `http://localhost:8080/employee/ApprovedEmpDetailsList/${cmpId}`;
          break;
        case "REJECTED":
          endpoint = `http://localhost:8080/employee/RejectedEmpDetailsList/${cmpId}`;
          break;
        case "PENDING":
        default:
          endpoint = `http://localhost:8080/employee/PendingEmpDetailsList/${cmpId}`;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        if (response.status === 404) {
          setLeaveRecords([]);
          return;
        }
        throw new Error("Failed to fetch leave records");
      }

      const data = await response.json();

      if (data.resultCode === 100) {
        const transformedData = transformApiData(data.EmployeeList);
        // Sort by leaveStartDay (newest first)
        const sortedData = [...transformedData].sort((a, b) => {
          // First sort by ID (higher IDs come first)
          if (b.id !== a.id) {
            return b.id - a.id;
          }
          // If IDs are equal (unlikely), sort by date
          return (
            new Date(b.leaveStartDay).getTime() -
            new Date(a.leaveStartDay).getTime()
          );
        });
        setLeaveRecords(sortedData);
      } else {
        throw new Error(data.resultDesc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (employeeList: any[]): LeaveRecord[] => {
    return employeeList.flatMap((employee) =>
      employee.leaveList.map((leave: any) => ({
        id: leave.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.epfNo,
        department: employee.department.dpt_name,
        leaveType: leave.leaveType,
        leaveStartDay: new Date(leave.leaveStartDay).toLocaleDateString(),
        leaveEndDay: new Date(leave.leaveEndDay).toLocaleDateString(),
        leaveDays: leave.leaveDays,
        leaveReason: leave.leaveReason,
        status: leave.leaveStatus,
      }))
    );
  };

  const updateLeaveStatus = async (
    leaveId: number,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8080/emp_leave/${leaveId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ leaveStatus: status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update leave status");
      }

      const data = await response.json();

      if (data.response?.resultCode === 100) {
        // Refresh the current tab's data
        fetchLeaveRecords(activeTab);
        toast.success(`Leave ${status.toLowerCase()} successfully!`);
      } else {
        throw new Error(
          data.response?.resultDesc || "Failed to update leave status"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
      console.error("Error updating leave status:", err);
    }
  };

  const handleApproved = (id: number) => {
    updateLeaveStatus(id, "APPROVED");
  };

  const handleRejected = (id: number) => {
    updateLeaveStatus(id, "REJECTED");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500 text-white";
      case "PENDING":
        return "bg-yellow-500 text-white";
      case "REJECTED":
        return "bg-red-500 text-white";
      default:
        return "";
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const columns: Column<LeaveRecord>[] = [
    {
      key: "name",
      title: "Name",
      render: (item) => <span className="text-xs">{item.name}</span>,
      className: "px-2 py-1",
    },
    {
      key: "employeeId",
      title: "Employee ID",
      render: (item) => <span className="text-xs">{item.employeeId}</span>,
      className: "px-2 py-1",
    },
    {
      key: "department",
      title: "Department",
      render: (item) => <span className="text-xs">{item.department}</span>,
      className: "px-2 py-1",
    },
    {
      key: "leaveType",
      title: "Leave Type",
      render: (item) => <span className="text-xs">{item.leaveType}</span>,
      className: "px-2 py-1",
    },
    {
      key: "leaveFrom",
      title: "Leave From",
      render: (item) => <span className="text-xs">{item.leaveStartDay}</span>,
      className: "px-2 py-1",
    },
    {
      key: "leaveTo",
      title: "Leave To",
      render: (item) => <span className="text-xs">{item.leaveEndDay}</span>,
      className: "px-2 py-1",
    },
    {
      key: "numberOfDays",
      title: "No of Days",
      render: (item) => <span className="text-xs">{item.leaveDays}</span>,
      className: "px-2 py-1",
    },
    {
      key: "leaveReason",
      title: "Reason",
      render: (item) => (
        <span
          className="text-xs cursor-pointer"
          data-tooltip-id="reason-tooltip"
          data-tooltip-content={item.leaveReason}
        >
          {truncateText(item.leaveReason, 20)}
        </span>
      ),
      className: "px-2 py-1",
    },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-2 text-xs py-0.5 rounded-full ${getStatusColor(
            item.status
          )}`}
        >
          {item.status}
        </span>
      ),
      className: "px-2 py-1",
    },
    {
      key: "actions",
      title: "Actions",
      render: (item) => (
        <div className="flex space-x-2">
          {activeTab === "PENDING" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproved(item.id);
                }}
                className="p-1 rounded-lg bg-green-300 hover:bg-green-200 transition-colors"
                aria-label="Approve"
              >
                <Check size={16} className="text-green-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejected(item.id);
                }}
                className="p-1 rounded-lg bg-red-300 hover:bg-red-200 transition-colors"
                aria-label="Reject"
              >
                <X size={16} className="text-red-600" />
              </button>
            </>
          )}
          {activeTab !== "PENDING" && (
            <span className="text-xs text-gray-400">No actions</span>
          )}
        </div>
      ),
      className: "px-2 py-1",
    },
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={() => fetchLeaveRecords(activeTab)}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (leaveRecords.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-700">
            No {activeTab.toLowerCase()} leave records found
          </p>
        </div>
      );
    }

    const totalPages = Math.ceil(leaveRecords.length / rowsPerPage);
    const paginatedData = leaveRecords.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

    return (
      <>
        <Table
          columns={columns}
          data={paginatedData}
          title=""
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
          className="compact-table"
        />
        <Tooltip id="reason-tooltip" />
      </>
    );
  };

  return (
    <div className="p-6">
      <div className="flex border-b border-gray-200 mb-4">
        {(["PENDING", "APPROVED", "REJECTED"] as LeaveStatus[]).map((tab) => (
          <button
            key={tab}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === tab
                ? "border-b-2 border-sky-500 text-sky-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()} Leaves
            {leaveRecords.length > 0 && activeTab === tab && (
              <span className="ml-2 bg-sky-100 text-sky-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {leaveRecords.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default LeaveTable;
