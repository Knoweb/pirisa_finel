import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../Loading/Loading";
import * as XLSX from "xlsx";

interface Payroll {
  id: number;
  year: number;
  month: string;
  allowance: string;
  overtime_pay: number;
  bonus_pay: string;
  appit: number;
  loan: number;
  other_deductions: number;
  epf_8: number;
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
  basic_salary: number;
}

interface Employee {
  id: number;
  epfNo: string;
  firstName: string;
  lastName: string;
  basicSalary: number;
  email: string;
  gender: string;
  phone: string;
  address: string;
  dateOfJoining: string;
  nic: string;
  dob: string;
  status: string;
  payroleList: Payroll[];
}

const PayroleReport: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("May"); // Default to current month
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default to current year
  const printableContentRef = useRef<HTMLDivElement>(null);

  // Available months and years for dropdowns
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = Array.from(
    new Set(employees.flatMap((emp) => emp.payroleList.map((p) => p.year)))
  ).sort();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      toast.error("No token found. Please log in again.");
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchPayrollData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchPayrollData = async () => {
    const cmpId = localStorage.getItem("cmpnyId");
    if (!cmpId || !token) {
      toast.error("Missing company ID or token. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/employee/payroleList/${cmpId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        //throw new Error(`Failed to fetch payroll data: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.resultCode === 100 && Array.isArray(data.EmployeeList)) {
        setEmployees(data.EmployeeList);
      } else {
        throw new Error("Unexpected response format or result code");
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      //toast.error("Failed to fetch payroll data. Please try again.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter payroll data for the selected month and year
  const filteredPayroll = employees.reduce((acc, employee) => {
    const payrolls = employee.payroleList.filter(
      (payroll) =>
        payroll.month === selectedMonth && payroll.year === selectedYear
    );
    if (payrolls.length > 0) {
      payrolls.forEach((payroll) => {
        acc.push({
          epfNo: employee.epfNo,
          fullName: `${employee.firstName} ${employee.lastName}`,
          net_salary: payroll.net_salary,
        });
      });
    }
    return acc;
  }, [] as { epfNo: string; fullName: string; net_salary: number }[]);

  // Calculate total net salary for the selected month
  const totalNetSalary = filteredPayroll.reduce(
    (sum, item) => sum + item.net_salary,
    0
  );

  // Handle print functionality - only print the report section
  const handlePrint = () => {
    const printContent = document.getElementById("printable-content");
    if (!printContent) return;

    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) {
      toast.error(
        "Could not open print window. Please check your popup settings."
      );
      return;
    }

    printWindow.document.write("<html><head><title>Salary Sheet</title>");
    printWindow.document.write("<style>");
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; }
      h3 { color: #333; margin-bottom: 20px; }
      h4 { background: linear-gradient(to right, #0ea5e9, #0369a1); color: white; padding: 10px; border-radius: 5px 5px 0 0; margin: 0; }
      .total-heading { background: linear-gradient(to right, #22c55e, #16a34a); }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f0f9ff; font-weight: bold; }
      .total-section { background-color: #f0fdf4; padding: 15px; border-radius: 0 0 5px 5px; margin-bottom: 30px; }
      .total-value { font-weight: bold; color: #15803d; }
    `);
    printWindow.document.write("</style></head><body>");
    printWindow.document.write(
      `<h3>Payroll Summary - ${selectedMonth} ${selectedYear}</h3>`
    );
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write("</body></html>");

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Export to Excel functionality
  const exportToExcel = () => {
    if (filteredPayroll.length === 0) {
      toast.warning("No data to export!");
      return;
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Format data for Excel
    const data = filteredPayroll.map((item) => ({
      "EPF No": item.epfNo,
      "Full Name": item.fullName,
      "Net Salary (LKR)": item.net_salary,
    }));

    // Add a row for the total
    data.push({
      "EPF No": "",
      "Full Name": "TOTAL",
      "Net Salary (LKR)": totalNetSalary,
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Report");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Payroll_${selectedMonth}_${selectedYear}.xlsx`);

    toast.success("Excel file downloaded successfully!");
  };

  return (
    <div className="w-full mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg transition hover:shadow-xl">
      <h3 className="text-2xl font-bold text-gray-500 mb-6">
        Monthly Salary Report
      </h3>

      {/* Month and Year Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-sky-300 focus:border-sky-500 transition"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-sky-300 focus:border-sky-500 transition"
            disabled={years.length === 0}
          >
            {years.length > 0 ? (
              years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))
            ) : (
              <option value={2025}>2025</option>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center">
          <Loading
            size="md"
            color="border-sky-500"
            text="Loading payroll data..."
          />
        </div>
      ) : filteredPayroll.length === 0 ? (
        <div className="mt-4 text-center text-gray-500 bg-gray-200 p-4 rounded-lg">
          No payroll data available for {selectedMonth} {selectedYear}.
        </div>
      ) : (
        <>
          {/* Printable content section */}
          <div id="printable-content" ref={printableContentRef}>
            {/* Payroll Table for Selected Month */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-0 bg-gradient-to-r from-sky-500 to-sky-700 p-3 rounded-t-lg shadow-md">
                {selectedMonth} {selectedYear}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700 border border-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-sky-50 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 border-b font-semibold">
                        EPF No
                      </th>
                      <th className="px-6 py-3 border-b font-semibold">
                        Full Name
                      </th>
                      <th className="px-6 py-3 border-b font-semibold">
                        Net Salary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayroll.map((item, index) => (
                      <tr key={index} className="hover:bg-sky-50 transition">
                        <td className="px-6 py-3 border-b">{item.epfNo}</td>
                        <td className="px-6 py-3 border-b">{item.fullName}</td>
                        <td className="px-6 py-3 border-b">
                          {item.net_salary.toLocaleString()} LKR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Net Salary for Selected Month */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-0 bg-gradient-to-r from-green-500 to-green-700 p-3 rounded-t-lg shadow-md total-heading">
                Total Net Salary for {selectedMonth} {selectedYear}
              </h4>
              <div className="bg-green-50 p-4 rounded-b-lg shadow-sm total-section">
                <p className="text-lg font-medium text-gray-800">
                  Total:{" "}
                  <span className="text-green-700 total-value">
                    {totalNetSalary.toLocaleString()} LKR
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={exportToExcel}
              className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 hover:scale-105 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export to Excel
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-sky-500 text-white rounded-lg shadow-md hover:bg-sky-600 hover:scale-105 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Report
            </button>
          </div>
        </>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default PayroleReport;
