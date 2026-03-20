/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { FaDownload, FaFilePdf, FaCalendarAlt } from "react-icons/fa";
import { X } from "lucide-react";
import Loading from "../../components/Loading/Loading";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface PayrollItem {
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

interface EmployeePayrollData {
  id: number;
  epfNo: string;
  firstName: string;
  lastName: string;
  basicSalary: number;
  payroleList: PayrollItem[];
}

// Month order for sorting
const MONTH_ORDER = [
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

const PayroleList = () => {
  const [payrollData, setPayrollData] = useState<EmployeePayrollData | null>(
    null
  );
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollItem | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchPayrollData = async () => {
      const token = localStorage.getItem("token");
      const empId = localStorage.getItem("empId");

      if (!token || !empId) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/employee/payroleListEmp/${empId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payroll data");
        }

        const data = await response.json();
        if (data.resultCode === 100 && data.EmployeeList?.length > 0) {
          const employeeData = data.EmployeeList[0];
          setPayrollData(employeeData);

          // Extract unique years from payroll data
          const years = Array.from<number>(
            new Set(
              employeeData.payroleList.map((item: { year: any }) => item.year)
            )
          ).sort((a, b) => b - a); // Sort descending (newest first)

          setAvailableYears(years);
          if (years.length > 0) {
            setSelectedYear(years[0]); // Set to most recent year by default
          }
        } else {
          throw new Error(data.resultDesc || "No payroll data found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, []);

  const parseAllowances = (allowanceString: string) => {
    if (!allowanceString) return [];
    return allowanceString.split(",").map((item) => {
      const [name, value] = item.split(":");
      return { name: name.trim(), value: parseFloat(value) || 0 };
    });
  };

  const parseBonuses = (bonusString: string) => {
    if (!bonusString) return [];
    return bonusString.split(",").map((item) => {
      const [name, value] = item.split(":");
      return { name: name.trim(), value: parseFloat(value) || 0 };
    });
  };

  const generatePayslipPDF = (payroll: PayrollItem) => {
    const doc = new jsPDF();

    // Add company logo and header
    doc.setFontSize(18);
    doc.text("PirisaHR Payslip", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`${payroll.month} ${payroll.year}`, 105, 30, { align: "center" });

    // Employee information
    doc.setFontSize(14);
    doc.text("Employee Information", 14, 40);
    doc.setFontSize(10);
    doc.text(
      `Name: ${payrollData?.firstName} ${payrollData?.lastName}`,
      14,
      50
    );
    doc.text(`EPF No: ${payrollData?.epfNo}`, 14, 60);
    doc.text(`Period: ${payroll.month} ${payroll.year}`, 14, 70);

    // Earnings table
    const earnings = [
      { description: "Basic Salary", amount: payroll.basic_salary },
      ...parseAllowances(payroll.allowance).map((a) => ({
        description: a.name,
        amount: a.value,
      })),
      { description: "Overtime Pay", amount: payroll.overtime_pay },
      ...parseBonuses(payroll.bonus_pay).map((b) => ({
        description: `${b.name} Bonus`,
        amount: b.value,
      })),
      { description: "Total Earnings", amount: payroll.total_earnings },
    ];

    // Deductions table
    const deductions = [
      { description: "EPF (8%)", amount: payroll.epf_8 },
      { description: "APIT", amount: payroll.appit },
      { description: "Loan", amount: payroll.loan },
      { description: "Other Deductions", amount: payroll.other_deductions },
      { description: "Total Deductions", amount: payroll.total_deductions },
    ];

    // Add tables to PDF
    (doc as any).autoTable({
      startY: 80,
      head: [["Earnings", "Amount (LKR)"]],
      body: earnings.map((e) => [
        e.description,
        e.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Deductions", "Amount (LKR)"]],
      body: deductions.map((d) => [
        d.description,
        d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [231, 76, 60] },
    });

    // Net salary
    doc.setFontSize(14);
    doc.text(
      `Net Salary: ${payroll.net_salary.toLocaleString("en-US", {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
      })}`,
      14,
      (doc as any).lastAutoTable.finalY + 20
    );

    // Footer
    doc.setFontSize(8);
    doc.text(
      "Generated by PirisaHR - " + new Date().toLocaleDateString(),
      105,
      290,
      { align: "center" }
    );

    // Save the PDF
    doc.save(
      `payslip-${payrollData?.epfNo}-${payroll.month}-${payroll.year}.pdf`
    );
  };

  // Filter and sort payroll data
  const getFilteredPayrolls = () => {
    if (!payrollData) return [];

    let filtered = [...payrollData.payroleList];

    // Filter by year if selected
    if (selectedYear !== "all") {
      filtered = filtered.filter((item) => item.year === selectedYear);
    }

    // Sort by year (descending) and month (January to December)
    return filtered.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
    });
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

  if (!payrollData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>No payroll data found</div>
      </div>
    );
  }

  const filteredPayrolls = getFilteredPayrolls();

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        My Payroll History
      </h1>

      {/* Employee Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold">{`${payrollData.firstName} ${payrollData.lastName}`}</h2>
            <p className="text-gray-600">EPF No: {payrollData.epfNo}</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-right md:text-left">
              <p className="text-gray-600">Basic Salary</p>
              <p className="text-xl font-bold text-sky-600">
                {payrollData.basicSalary.toLocaleString("en-US", {
                  style: "currency",
                  currency: "LKR",
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Year Filter */}
            <div className="flex items-center">
              <label htmlFor="yearFilter" className="mr-2 text-gray-600">
                {" "}
                Year :{" "}
              </label>
              <select
                id="yearFilter"
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value === "all" ? "all" : parseInt(e.target.value)
                  )
                }
                className="border rounded-md px-3 py-1"
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredPayrolls.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No payroll records found for the selected filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month/Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayrolls.map((payroll) => (
                  <tr
                    key={payroll.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedPayroll(payroll)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCalendarAlt className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payroll.month}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payroll.year}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.total_earnings.toLocaleString("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.total_deductions.toLocaleString("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {payroll.net_salary.toLocaleString("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generatePayslipPDF(payroll);
                        }}
                        className="text-sky-600 hover:text-sky-900 flex items-center"
                      >
                        <FaDownload className="mr-1" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold">
                Payslip - {selectedPayroll.month} {selectedPayroll.year}
              </h2>
              <button
                onClick={() => setSelectedPayroll(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Employee Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Employee Information
                  </h3>
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span>{" "}
                    {`${payrollData.firstName} ${payrollData.lastName}`}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">EPF No:</span>{" "}
                    {payrollData.epfNo}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Period:</span>{" "}
                    {selectedPayroll.month} {selectedPayroll.year}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold mb-2">Salary Summary</h3>
                  <p className="text-gray-700">
                    <span className="font-medium">Basic Salary:</span>{" "}
                    {selectedPayroll.basic_salary.toLocaleString("en-US", {
                      style: "currency",
                      currency: "LKR",
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Net Salary:</span>{" "}
                    {selectedPayroll.net_salary.toLocaleString("en-US", {
                      style: "currency",
                      currency: "LKR",
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Earnings */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                  Earnings
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span>
                      {selectedPayroll.basic_salary.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {parseAllowances(selectedPayroll.allowance).map(
                    (allowance, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{allowance.name}</span>
                        <span>
                          {allowance.value.toLocaleString("en-US", {
                            style: "currency",
                            currency: "LKR",
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )
                  )}

                  {selectedPayroll.overtime_pay > 0 && (
                    <div className="flex justify-between">
                      <span>Overtime Pay</span>
                      <span>
                        {selectedPayroll.overtime_pay.toLocaleString("en-US", {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {parseBonuses(selectedPayroll.bonus_pay).map(
                    (bonus, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{bonus.name} Bonus</span>
                        <span>
                          {bonus.value.toLocaleString("en-US", {
                            style: "currency",
                            currency: "LKR",
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )
                  )}

                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total Earnings</span>
                    <span>
                      {selectedPayroll.total_earnings.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                  Deductions
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>EPF (8%)</span>
                    <span>
                      {selectedPayroll.epf_8.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>APIT</span>
                    <span>
                      {selectedPayroll.appit.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan</span>
                    <span>
                      {selectedPayroll.loan.toLocaleString("en-US", {
                        style: "currency",
                        currency: "LKR",
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions</span>
                    <span>
                      {selectedPayroll.other_deductions.toLocaleString(
                        "en-US",
                        {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total Deductions</span>
                    <span>
                      {selectedPayroll.total_deductions.toLocaleString(
                        "en-US",
                        {
                          style: "currency",
                          currency: "LKR",
                          minimumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-xl font-bold">
                  <span>Net Salary</span>
                  <span className="text-green-600">
                    {selectedPayroll.net_salary.toLocaleString("en-US", {
                      style: "currency",
                      currency: "LKR",
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => generatePayslipPDF(selectedPayroll)}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg flex items-center"
                >
                  <FaFilePdf className="mr-2" /> Download Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayroleList;
