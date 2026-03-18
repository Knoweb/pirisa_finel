/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../Loading/Loading";

interface PayslipDetail {
  id: number;
  year: number;
  month: string;
  basic_salary: number;
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
  createdAt: string;
}

interface CompanyDetails {
  cmp_name: string;
  cmp_address: string;
  cmp_phone: string;
  cmp_email: string;
}

interface EmployeeDetails {
  first_name: string;
  last_name: string;
  epf_no: string;
  emp_no: string;
  address: string;
  designation: string;
  department: string;
}

interface PayslipModalProps {
  payslipId: number;
  employeeId: number;
  onClose: () => void;
}

const PayslipModal: React.FC<PayslipModalProps> = ({
  payslipId,
  employeeId,
  onClose,
}) => {
  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslipData();
  }, [payslipId, employeeId]);

  const fetchPayslipData = async () => {
    try {
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");
      if (!token || !companyId) throw new Error("No token or company ID found");

      // Fetch payslip details
      const payslipRes = await fetch(
        `/employee/payroleListEmp/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const payslipData = await payslipRes.json();

      // Find the specific payslip
      interface Employee {
        id: number;
        payroleList: Payrole[];
        [key: string]: string | number | Payrole[] | undefined;
      }
      const employeeData = payslipData.EmployeeList.find(
        (emp: Employee) => emp.id === employeeId
      );
      interface Payrole {
        id: number;
        [key: string]: string | number | undefined;
      }
      const foundPayslip = employeeData?.payroleList.find(
        (p: Payrole) => p.id === payslipId
      );
      if (!foundPayslip) throw new Error("Payslip not found");
      setPayslip(foundPayslip as PayslipDetail);

      // Fetch company details
      const companyRes = await fetch(
        `/company/companyDetails/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const companyData = await companyRes.json();
      if (
        companyData.resultCode === 100 &&
        companyData.CompanyDetails.length > 0
      ) {
        setCompany(companyData.CompanyDetails[0]);
      }

      // Fetch employee details
      const employeeRes = await fetch(
        `/employee/emp/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const employeeDetails = await employeeRes.json();
      if (employeeDetails.resultCode === 100) {
        setEmployee({
          first_name: employeeDetails.Employee_list.first_name,
          last_name: employeeDetails.Employee_list.last_name,
          epf_no: employeeDetails.Employee_list.epf_no,
          emp_no: employeeDetails.Employee_list.emp_no,
          address: employeeDetails.Employee_list.address,
          designation:
            employeeDetails.Employee_list.designation?.designation || "N/A",
          department:
            employeeDetails.Employee_list.department?.dpt_name || "N/A",
        });
      }

      // Fetch company logo
      const logoRes = await fetch(
        `/logo/view/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (logoRes.ok) {
        const logoBlob = await logoRes.blob();
        const logoUrl = URL.createObjectURL(logoBlob);
        setLogo(logoUrl);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch payslip data"
      );
    } finally {
      setLoading(false);
    }
  };

  const parseAllowance = (allowanceString: string) => {
    if (!allowanceString) return [];
    return allowanceString.split(",").map((item) => {
      const [name, value] = item.split(":");
      return { name: name.trim(), value: parseFloat(value) };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Loading size="lg" className="h-64" />;

  if (!payslip || !company || !employee) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p>Failed to load payslip data</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const allowances = parseAllowance(payslip.allowance);
  const bonuses = parseAllowance(payslip.bonus_pay);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-8">
          {/* Header with Logo */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                {logo && (
                  <img
                    src={logo}
                    alt="Company Logo"
                    className="h-20 w-auto mr-4 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {company.cmp_name}
                  </h1>
                  <p className="text-gray-600">{company.cmp_address}</p>
                  <p className="text-gray-600">{company.cmp_phone}</p>
                  <p className="text-gray-600">{company.cmp_email}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  PAYSLIP
                </h2>
                <p className="text-gray-600">#{payslip.id}</p>
                <p className="text-green-600 font-medium">Status: Success</p>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8 border-t pt-4">
            <div>
              <h3 className="font-bold text-lg">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-gray-600">{employee.address}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-gray-600">Employee ID: {employee.epf_no}</p>
              <p className="text-gray-600">
                Designation: {employee.designation}
              </p>
              <p className="text-gray-600">Department: {employee.department}</p>
              <p className="text-gray-600">
                Salary Month: {payslip.month} {payslip.year}
              </p>
              <p className="text-gray-600">
                Generated: {new Date(payslip.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Earnings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>Rs. {payslip.basic_salary.toLocaleString()}</span>
              </div>

              {allowances.length > 0 && (
                <div className="col-span-2">
                  <div className="flex justify-between font-medium">
                    <span>Allowance</span>
                    <span>
                      Rs.{" "}
                      {allowances
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="pl-4 mt-1">
                    {allowances.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>{item.name}</span>
                        <span>Rs. {item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span>Over Time</span>
                <span>Rs. {payslip.overtime_pay.toLocaleString()}</span>
              </div>

              {bonuses.length > 0 && (
                <div className="col-span-2">
                  <div className="flex justify-between font-medium">
                    <span>Bonus</span>
                    <span>
                      Rs.{" "}
                      {bonuses
                        .reduce((sum, item) => sum + item.value, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="pl-4 mt-1">
                    {bonuses.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>{item.name}</span>
                        <span>Rs. {item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4 border-t pt-2 font-bold">
              <span>Total Earning</span>
              <span>Rs. {payslip.total_earnings.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Deductions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>EPF (8%)</span>
                <span>Rs. {payslip.epf_8.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>APPIT</span>
                <span>Rs. {payslip.appit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Loans</span>
                <span>Rs. {payslip.loan.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Deductions</span>
                <span>Rs. {payslip.other_deductions.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between mt-4 border-t pt-2 font-bold">
              <span>Total Deduction</span>
              <span>Rs. {payslip.total_deductions.toLocaleString()}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-t-2 pt-4">
            <div>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
              >
                Print
              </button>
            </div>
            <div className="text-left sm:text-right space-y-2">
              <div className="flex justify-between">
                <span className="font-bold mr-4">Total Earning</span>
                <span>Rs. {payslip.total_earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold mr-4">Total Deduction</span>
                <span>Rs. {payslip.total_deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span className="mr-4">Net Salary</span>
                <span>Rs. {payslip.net_salary.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipModal;
