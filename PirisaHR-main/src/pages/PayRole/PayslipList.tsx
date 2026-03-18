/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../components/Loading/Loading";
import PayslipModal from "../../components/PayRole/PayslipModal";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Payslip {
  id: number;
  year: number;
  month: string;
  basic_salary: number;
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: {
    id: number;
    payroleList?: Payslip[];
  }[];
}

const PayslipList: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchPayslips();
  }, [employeeId]);

  const fetchPayslips = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `/employee/payroleListEmp/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch payslips");

      const data: ApiResponse = await response.json();
      if (data.resultCode === 100) {
        const employee = data.EmployeeList.find(
          (emp) => emp.id === parseInt(employeeId || "0")
        );
        if (employee && employee.payroleList) {
          const allPayslips = employee.payroleList.map((p) => ({
            id: p.id,
            year: p.year,
            month: p.month,
            basic_salary: p.basic_salary,
            total_earnings: p.total_earnings,
            total_deductions: p.total_deductions,
            net_salary: p.net_salary,
          }));

          setPayslips(allPayslips);
          const years = [...new Set(allPayslips.map((p) => p.year))].sort(
            (a, b) => b - a
          );
          setAvailableYears(years);
          if (years.length > 0 && !years.includes(selectedYear)) {
            setSelectedYear(years[0]);
          }
        }
      } else {
        throw new Error(data.resultDesc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payslips");
    } finally {
      setLoading(false);
    }
  };

  const handlePayslipClick = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  const handleCloseModal = () => {
    setSelectedPayslip(null);
  };

  const handleYearChange = (direction: "prev" | "next") => {
    const currentIndex = availableYears.indexOf(selectedYear);
    if (direction === "prev" && currentIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentIndex + 1]);
    } else if (direction === "next" && currentIndex > 0) {
      setSelectedYear(availableYears[currentIndex - 1]);
    }
  };

  const filteredPayslips = payslips.filter((p) => p.year === selectedYear);

  if (loading) return <Loading size="lg" className="h-64" />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="mt-3 mx-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchPayslips();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl  text-gray-800"> {selectedYear} Payslips</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleYearChange("prev")}
            disabled={
              availableYears.indexOf(selectedYear) === availableYears.length - 1
            }
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleYearChange("next")}
            disabled={availableYears.indexOf(selectedYear) === 0}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
      <hr className="mb-10 text-gray-300"></hr>

      {filteredPayslips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">
            No payslips found for {selectedYear}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPayslips
            .sort((a, b) => {
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
              return months.indexOf(b.month) - months.indexOf(a.month);
            })
            .map((payslip) => (
              <div
                key={payslip.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1"
                onClick={() => handlePayslipClick(payslip)}
              >
                <div className="text-center flex justify-between">
                  <h3 className="text-xl font-semibold text-gray-600">
                    {payslip.month}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{payslip.year}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {selectedPayslip && (
        <PayslipModal
          payslipId={selectedPayslip.id}
          employeeId={parseInt(employeeId || "0")}
          onClose={handleCloseModal}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default PayslipList;
