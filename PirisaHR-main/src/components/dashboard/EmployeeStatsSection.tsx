import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import axios from "axios";
import Loading from "../Loading/Loading";
//import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

// Define the structure of the employee data
interface Employee {
  id: number;
  gender: string;
  dateOfJoining: string;
  status: string;
}

// Define the structure of the API response
interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: Employee[];
}

const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
      <div className="h-8 w-16 bg-gray-200 rounded mb-4"></div>
      <div className="w-full h-24 bg-gray-200 rounded"></div>
    </div>
  );
};

const EmployeeStatsSection: React.FC = () => {
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [maleEmployees, setMaleEmployees] = useState<number>(0);
  const [femaleEmployees, setFemaleEmployees] = useState<number>(0);
  const [newEmployees, setNewEmployees] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  //const navigate = useNavigate(); // Initialize useNavigate for navigation

  // Fetch employee data from the API
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const companyId = localStorage.getItem("cmpnyId");
        const token = localStorage.getItem("token");

        if (!companyId || !token) {
          throw new Error("Company ID or token is missing in localStorage.");
        }

        const response = await axios.get<ApiResponse>(
          `http://localhost:8080/employee/EmpDetailsList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.resultCode === 100 && response.data.EmployeeList) {
          const activeEmployees = response.data.EmployeeList.filter(
            (emp) => emp.status === "ACTIVE"
          );

          // Calculate counts
          const total = activeEmployees.length;
          const male = activeEmployees.filter(
            (emp) => emp.gender === "Male"
          ).length;
          const female = activeEmployees.filter(
            (emp) => emp.gender === "Female"
          ).length;

          // Calculate new employees (joined in the current month)
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          const newEmps = activeEmployees.filter((emp) => {
            const joinDate = new Date(emp.dateOfJoining);
            return (
              joinDate.getMonth() + 1 === currentMonth &&
              joinDate.getFullYear() === currentYear
            );
          }).length;

          setTotalEmployees(total);
          setMaleEmployees(male);
          setFemaleEmployees(female);
          setNewEmployees(newEmps);
        } else {
          throw new Error(
            response.data.resultDesc || "Failed to fetch employee data"
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Treat 404 as "no employees" rather than an error
          setTotalEmployees(0);
          setMaleEmployees(0);
          setFemaleEmployees(0);
          setNewEmployees(0);
        } else {
          setError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
          console.error("Error fetching employee data:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Generate dynamic bar chart data based on the fetched employee data
  const generateBarChartData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((month) => {
      return {
        month,
        total: totalEmployees,
        new: newEmployees,
        male: maleEmployees,
        female: femaleEmployees,
      };
    });
  };

  const barChartData = generateBarChartData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center"
          onClick={() => window.location.reload()}
        >
          <Loading size="sm" color="border-white" className="inline mr-1" />
          Retry
        </button>
      </div>
    );
  }

  // Check if there are no employees (totalEmployees is 0)
  if (totalEmployees === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md mb-8">
        <p className="text-lg font-semibold text-gray-700">
          No employees found
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Add an employee to view statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Employees Card */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
        <h3 className="text-sm text-gray-600">Total Employees</h3>
        <p className="text-2xl font-bold text-gray-800">{totalEmployees}</p>
        <div className="w-full h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Bar dataKey="total" fill="#3b82f6" barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Employees Card */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
        <h3 className="text-sm text-gray-600">New Employees</h3>
        <p className="text-2xl font-bold text-gray-800">{newEmployees}</p>
        <div className="w-full h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Bar dataKey="new" fill="#10b981" barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Male Employees Card */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
        <h3 className="text-sm text-gray-600">Male Employees</h3>
        <p className="text-2xl font-bold text-gray-800">{maleEmployees}</p>
        <div className="w-full h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Bar dataKey="male" fill="#f59e0b" barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Female Employees Card */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
        <h3 className="text-sm text-gray-600">Female Employees</h3>
        <p className="text-2xl font-bold text-gray-800">{femaleEmployees}</p>
        <div className="w-full h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Bar dataKey="female" fill="#ef4498" barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatsSection;
