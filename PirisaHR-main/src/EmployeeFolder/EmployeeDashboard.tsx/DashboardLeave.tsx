/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import axios from "axios";
import LeaveCard from "./LeaveCard";

interface CompanyLeave {
  id: number;
  leaveType: string;
  amount: number;
  cmpId: number;
}

interface EmployeeLeave {
  id: number;
  leaveType: string;
  leaveStatus: string;
  leaveDays: number;
}

interface LeaveSummary {
  leaveType: string;
  available: number;
  taken: number;
  remaining: number;
}

export const LeaveCards: React.FC = () => {
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const companyId = localStorage.getItem("cmpnyId");
        const empId = localStorage.getItem("empId");

        if (!companyId || !empId) {
          throw new Error(
            "Company ID or Employee ID not found in local storage"
          );
        }

        // Set up axios instance with auth token
        const api = axios.create({
          baseURL: "",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch available leaves
        let availableLeaves: CompanyLeave[] = [];
        try {
          const companyLeavesRes = await api.get(
            `/api/company_leave/company/${companyId}`
          );
          if (companyLeavesRes.data.resultCode === 100) {
            availableLeaves = companyLeavesRes.data.LeavetList;
          }
        } catch (err: any) {
          if (err.response && err.response.status === 404) {
            // No leave data set, treat as empty
            availableLeaves = [];
          } else {
            throw err;
          }
        }

        // Fetch employee leaves
        let employeeLeaves: EmployeeLeave[] = [];
        try {
          const employeeLeavesRes = await api.get(
            `/api/employee/EmpDetailsListByEmp/${empId}`
          );
          if (employeeLeavesRes.data.resultCode === 100) {
            employeeLeaves =
              employeeLeavesRes.data.EmployeeLeaveList[0]?.leaveList || [];
          }
        } catch (err: any) {
          if (err.response && err.response.status === 404) {
            // No employee leave data, treat as empty
            employeeLeaves = [];
          } else {
            throw err;
          }
        }

        // Calculate taken leaves (only APPROVED status)
        const takenLeavesMap = new Map<string, number>();
        employeeLeaves
          .filter((leave) => leave.leaveStatus === "APPROVED")
          .forEach((leave) => {
            const current = takenLeavesMap.get(leave.leaveType) || 0;
            takenLeavesMap.set(leave.leaveType, current + leave.leaveDays);
          });

        // Create summary
        const summary = availableLeaves.map((available) => ({
          leaveType: available.leaveType,
          available: available.amount,
          taken: takenLeavesMap.get(available.leaveType) || 0,
          remaining:
            available.amount - (takenLeavesMap.get(available.leaveType) || 0),
        }));

        setLeaveSummary(summary);
        setLoading(false);
      } catch (err) {
        // If error is 404, treat as no leave data, do not show error
        if ((err as any).response && (err as any).response.status === 404) {
          setLeaveSummary([]);
          setLoading(false);
        } else {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          setLoading(false);
        }
      }
    };

    fetchLeaveData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only show error if not a 404/no leave data situation
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Leave Card */}
        <LeaveCard
          title="Available Leave"
          items={leaveSummary.map((item) => ({
            label: item.leaveType,
            value: item.available,
          }))}
          gradient="from-blue-200 to-blue-400"
          textColor="text-blue-800"
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />

        {/* Taken Leave Card */}
        <LeaveCard
          title="Taken Leave"
          items={leaveSummary.map((item) => ({
            label: item.leaveType,
            value: item.taken,
          }))}
          gradient="from-green-300 to-yellow-200"
          textColor="text-green-800"
          icon={
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* Remaining Leave Card */}
        <LeaveCard
          title="Remaining Leave"
          items={leaveSummary.map((item) => ({
            label: item.leaveType,
            value: item.remaining,
          }))}
          gradient="from-red-200 to-orange-300"
          textColor="text-red-800"
          icon={
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
};
