import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { isNonEmpty, isNonNegativeNumber, isPositiveAmount, toNumberSafe } from "../../utils/validation";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  epfNo: string;
  department: {
    dpt_name: string;
  };
  designation: {
    designation: string | null;
  };
  email: string;
  phone: string;
  basicSalary: number;
  photo: {
    photo: string | null;
  };
  attendanceList?: {
    id: number;
    startedAt: string;
    endedAt: string | null;
    working_status: string;
    attendance_status: string | null;
    totalTime: number;
    dayName: string;
  }[];
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
  EmployeeList: Employee[];
}

interface Allowance {
  id: number;
  allowanceName: string;
  epfEligibleStatus: string;
  cmpId: number;
}

interface Bonus {
  id: number;
  bonusName: string;
  cmpId: number;
}

interface SelectedAllowance {
  id: number;
  allowanceName: string;
  amount: string;
}

interface SelectedBonus {
  id: number;
  bonusName: string;
  amount: string;
}

interface CompanyOTSettings {
  id: number;
  company_start_time: string;
  company_end_time: string;
  normal_ot_rate: number;
  holiday_ot_rate: number;
  totalTime: number;
  cmpId: number;
  ot_cal: number;
}

const SalaryForm: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handlenavigate = () => {
    navigate("/payrole/salaryList");
  };

  // Salary form state
  const [month, setMonth] = useState(() => {
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    return currentMonth;
  });
  const [year, setYear] = useState(() => {
    const currentYear = new Date().getFullYear();
    return currentYear.toString();
  });
  const [basic_salary, setBasic_salary] = useState("0");
  const [overTime, setOverTime] = useState("0");

  const [epf_8, setEpf_8] = useState(0);
  const [appit, setAppit] = useState("0");
  const [loan, setLoan] = useState("0");
  const [other_deductions, setOther_deductions] = useState("0");
  const [salary_advance, setSalary_advance] = useState("0"); // Added state for Salary Advance

  // Allowance state
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [selectedAllowances, setSelectedAllowances] = useState<
    SelectedAllowance[]
  >([]);
  const [selectedAllowanceId, setSelectedAllowanceId] = useState<number | null>(
    null
  );
  const [allowanceAmount, setAllowanceAmount] = useState("");
  const [isAddAllowanceModalOpen, setIsAddAllowanceModalOpen] = useState(false);
  const [newAllowanceName, setNewAllowanceName] = useState("");
  const [newAllowanceEpfStatus, setNewAllowanceEpfStatus] = useState("yes");

  // Bonus state
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [selectedBonuses, setSelectedBonuses] = useState<SelectedBonus[]>([]);
  const [selectedBonusId, setSelectedBonusId] = useState<number | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [isAddBonusModalOpen, setIsAddBonusModalOpen] = useState(false);
  const [newBonusName, setNewBonusName] = useState("");

  // Overtime state
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [selectedEmployeeForOvertime, setSelectedEmployeeForOvertime] =
    useState<Employee | null>(null);
  const [companyOTSettings, setCompanyOTSettings] =
    useState<CompanyOTSettings | null>(null);
  const [selectedOtTypes, setSelectedOtTypes] = useState<
    Record<number, string>
  >({});

  //APPIT Regular
  const [appitType, setAppitType] = useState<"manual" | "table">("manual");
  const [isAppitTable1ModalOpen, setIsAppitTable1ModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState("");
  const [apitResult, setApitResult] = useState<number | null>(null);

  //APIT Lump-Sum
  const [paid, setPaid] = useState("");
  const [payable, setPayable] = useState("");
  const [lumpSum, setLumpSum] = useState("");
  const [monthlyTax, setMonthlyTax] = useState("");
  const [prevLumpTax, setPrevLumpTax] = useState("");
  const [isAppitTable2ModalOpen, setIsAppitTable2ModalOpen] = useState(false);

  //APIT Regular(Nonresident)
  const [isAppitTable3ModalOpen, setIsAppitTable3ModalOpen] = useState(false);

  //APIT Lump-Sum(Nonresident)
  const [isAppitTable4ModalOpen, setIsAppitTable4ModalOpen] = useState(false);

  //APIT Cumalative
  const [isAppitTable5ModalOpen, setIsAppitTable5ModalOpen] = useState(false);
  const [cumulativeIncome, setCumulativeIncome] = useState("");
  const [prevTax, setPrevTax] = useState("");

  //APIT Tax-on-tax monthly
  const [isAppitTable6ModalOpen, setIsAppitTable6ModalOpen] = useState(false);

  //APIT Tax-on-tax lump sum
  const [isAppitTable7ModalOpen, setIsAppitTable7ModalOpen] = useState(false);
  const [taxOnTaxMonthly, setTaxOnTaxMonthly] = useState("");
  const [prevLumpTaxOnTax, setPrevLumpTaxOnTax] = useState("");

  //APIT Secondary Resident
  const [isAppitTable8ModalOpen, setIsAppitTable8ModalOpen] = useState(false);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");

  //APIT Secondary Non Resident
  const [isAppitTable9ModalOpen, setIsAppitTable9ModalOpen] = useState(false);

  //APIT Foreign
  const [isAppitTable10ModalOpen, setIsAppitTable10ModalOpen] = useState(false);

  // Calculate totals
  const total_earnings =
    Number(basic_salary) +
    Number(overTime) +
    selectedAllowances.reduce(
      (sum, allowance) => sum + Number(allowance.amount),
      0
    ) +
    selectedBonuses.reduce((sum, bonus) => sum + Number(bonus.amount), 0);

  const total_deductions =
    epf_8 + Number(appit) + Number(loan) + Number(other_deductions) + Number(salary_advance);

  const net_salary = total_earnings - total_deductions;

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        if (!token || !companyId) {
          throw new Error("No token or company ID found");
        }

        // Fetch employee details
        const employeeResponse = await fetch(
          `/api/employee/EmpDetailsList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!employeeResponse.ok) {
          throw new Error("Failed to fetch employee data");
        }

        const employeeData: ApiResponse = await employeeResponse.json();
        if (
          employeeData.resultCode === 100 &&
          employeeData.EmployeeList.length > 0
        ) {
          const selectedEmployee = employeeData.EmployeeList.find(
            (emp) => emp.id === Number(employeeId)
          );
          if (selectedEmployee) {
            setEmployee(selectedEmployee);
            setSelectedEmployeeForOvertime(selectedEmployee);
            setBasic_salary(selectedEmployee.basicSalary?.toString() || "0");
          } else {
            throw new Error("Employee not found");
          }
        } else {
          throw new Error(employeeData.resultDesc);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  // Fetch allowances
  useEffect(() => {
    const fetchAllowances = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        if (!token || !companyId) {
          throw new Error("No token or company ID found");
        }

        const response = await fetch(
          `/api/allowance/company/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch allowances");
        }

        const data = await response.json();
        if (data.resultCode === 100) {
          setAllowances(data.AllowanceList);
        } else {
          throw new Error(data.resultDesc);
        }
      } catch (err) {
        console.error("Error fetching allowances:", err);
      }
    };

    fetchAllowances();
  }, []);

  // Fetch bonuses
  useEffect(() => {
    const fetchBonuses = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        if (!token || !companyId) {
          throw new Error("No token or company ID found");
        }

        const response = await fetch(
          `/api/bonus/company/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bonuses");
        }

        const data = await response.json();
        if (data.resultCode === 100) {
          setBonuses(data.BonusList);
        } else {
          throw new Error(data.resultDesc);
        }
      } catch (err) {
        console.error("Error fetching bonuses:", err);
      }
    };

    fetchBonuses();
  }, []);

  // Fetch company OT settings
  useEffect(() => {
    const fetchCompanyOTSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        if (!token || !companyId) return;

        const response = await fetch(
          `/api/companyOT/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch OT settings");

        const data = await response.json();
        if (data.resultCode === 100) {
          setCompanyOTSettings(data["OT Details"]);
        }
      } catch (err) {
        console.error("Error fetching OT settings:", err);
      }
    };

    fetchCompanyOTSettings();
  }, []);

  // Auto-deduct Salary Advances for the current month and employee
  useEffect(() => {
    const fetchApprovedAdvances = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        // Format selected month-year to YYYY-MM
        const monthNum = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
        const currentSelectedMonth = `${year}-${monthNum.toString().padStart(2, "0")}`;

        if (!token || !companyId || !employeeId) return;

        const res = await fetch(`/api/advances/employee/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const advances: any[] = await res.json();
          // Filter for APPROVED and matching the Repayment Month
          const totalAdvanceDeduction = advances
            .filter((adv) => adv.status === "APPROVED" && adv.repaymentDeductionMonth === currentSelectedMonth)
            .reduce((sum, adv) => sum + Number(adv.amountRequested), 0);

          setSalary_advance(totalAdvanceDeduction.toString());
        }
      } catch (err) {
        console.error("Error fetching salary advances:", err);
      }
    };

    fetchApprovedAdvances();
  }, [employeeId, month, year]);

  // Fetch attendance data when overtime modal opens
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = localStorage.getItem("cmpnyId");

        if (!token || !companyId || !selectedEmployeeForOvertime) return;

        const response = await fetch(
          `/api/employee/attendanceList/${companyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch attendance data");
        }

        const data = await response.json();
        if (data.resultCode === 100) {
          const employeeData = data.EmployeeList.find(
            (emp: Employee) => emp.id === selectedEmployeeForOvertime.id
          );

          if (employeeData) {
            setSelectedEmployeeForOvertime((prev) => ({
              ...prev!,
              attendanceList: employeeData.attendanceList,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching attendance data:", err);
      }
    };

    if (isOvertimeModalOpen && selectedEmployeeForOvertime) {
      fetchAttendanceData();
    }
  }, [isOvertimeModalOpen, selectedEmployeeForOvertime]);

  const handleAddAllowance = () => {
    if (!selectedAllowanceId) {
      toast.error("Please select an allowance");
      return;
    }

    if (!isNonEmpty(allowanceAmount) || !isPositiveAmount(allowanceAmount)) {
      toast.error("Please enter a valid allowance amount");
      return;
    }

    if (selectedAllowanceId && allowanceAmount) {
      const selectedAllowance = allowances.find(
        (a) => a.id === selectedAllowanceId
      );
      if (selectedAllowance) {
        setSelectedAllowances((prev) => [
          ...prev,
          {
            id: selectedAllowance.id,
            allowanceName: selectedAllowance.allowanceName,
            amount: String(toNumberSafe(allowanceAmount) ?? allowanceAmount),
          },
        ]);
        setSelectedAllowanceId(null);
        setAllowanceAmount("");
      }
    }
  };

  const handleAddBonus = () => {
    if (!selectedBonusId) {
      toast.error("Please select a bonus");
      return;
    }

    if (!isNonEmpty(bonusAmount) || !isPositiveAmount(bonusAmount)) {
      toast.error("Please enter a valid bonus amount");
      return;
    }

    if (selectedBonusId && bonusAmount) {
      const selectedBonus = bonuses.find((b) => b.id === selectedBonusId);
      if (selectedBonus) {
        setSelectedBonuses((prev) => [
          ...prev,
          {
            id: selectedBonus.id,
            bonusName: selectedBonus.bonusName,
            amount: String(toNumberSafe(bonusAmount) ?? bonusAmount),
          },
        ]);
        setSelectedBonusId(null);
        setBonusAmount("");
      }
    }
  };

  useEffect(() => {
    const epfEligibleAllowancesTotal = selectedAllowances.reduce(
      (sum, allowance) => {
        const allowanceItem = allowances.find((a) => a.id === allowance.id);
        return (
          sum +
          (allowanceItem?.epfEligibleStatus === "yes"
            ? Number(allowance.amount)
            : 0)
        );
      },
      0
    );

    const newEpf = (Number(basic_salary) + epfEligibleAllowancesTotal) * 0.08;
    setEpf_8(newEpf);
  }, [basic_salary, selectedAllowances, allowances]);

  const handleAddNewAllowance = async () => {
    try {
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        throw new Error("No token or company ID found");
      }

      const response = await fetch(
        "/api/allowance/add_allowance",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            allowanceName: newAllowanceName,
            epfEligibleStatus: newAllowanceEpfStatus,
            cmpId: companyId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add new allowance");
      }

      const data = await response.json();
      if (data.resultCode === 100) {
        setAllowances((prev) => [...prev, data]);
        setIsAddAllowanceModalOpen(false);
        setNewAllowanceName("");
        setNewAllowanceEpfStatus("yes");
        toast.success("New allowance added successfully!");
      } else {
        throw new Error(data.resultDesc);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleAddNewBonus = async () => {
    try {
      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        throw new Error("No token or company ID found");
      }

      const response = await fetch(
        "/api/bonus/add_bonus",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bonusName: newBonusName,
            cmpId: companyId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add new bonus");
      }

      const data = await response.json();
      if (data.resultCode === 100) {
        setBonuses((prev) => [...prev, data.Added_Bonus]);
        setIsAddBonusModalOpen(false);
        setNewBonusName("");
        toast.success("New bonus added successfully!");
      } else {
        throw new Error(data.resultDesc);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  //APIT Regular
  const calculateApitTable1 = async (amount: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/regular?amount=${amount}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT");
      }

      const data = await response.json();
      if (data.result) {
        setApitResult(data.result);
        setAppit(data.result.toString());
        return data.result;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to calculate APIT"
      );
      return 0;
    }
  };
  //APIT Regular(Nonresident)
  const calculateApitTable3 = async (amount: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/nonresident/regular?amount=${amount}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT");
      }

      const data = await response.json();
      if (data.result) {
        setApitResult(data.result);
        setAppit(data.result.toString());
        return data.result;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to calculate APIT"
      );
      return 0;
    }
  };

  //Apit Lump-Sum
  const calculateApitTable2 = async (
    paid: number,
    payable: number,
    lumpSum: number,
    monthlyTax: number,
    prevLumpTax: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/lump-sum?paid=${paid}&payable=${payable}&lumpSum=${lumpSum}&monthlyTax=${monthlyTax}&prevLumpTax=${prevLumpTax}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 2)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 2)"
      );
      return 0;
    }
  };
  //APIT Lump-Sum(Nonresident)
  const calculateApitTable4 = async (
    paid: number,
    payable: number,
    lumpSum: number,
    monthlyTax: number,
    prevLumpTax: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/nonresident/lump-sum?paid=${paid}&payable=${payable}&lumpSum=${lumpSum}&monthlyTax=${monthlyTax}&prevLumpTax=${prevLumpTax}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 4)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 4)"
      );
      return 0;
    }
  };

  //APIT Cumulative
  const calculateApitTable5 = async (
    cumulativeIncome: number,
    prevTax: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/cumulative?cumulativeIncome=${cumulativeIncome}&prevTax=${prevTax}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 5)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 5)"
      );
      return 0;
    }
  };

  //APIT Tax-on-tax monthly

  const calculateApitTable6 = async (amount: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/tax-on-tax/monthly?amount=${amount}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT Table 06");
      }

      const data = await response.json();
      if (data.result) {
        setApitResult(data.result);
        setAppit(data.result.toString());
        return data.result;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to calculate APIT Table 06"
      );
      return 0;
    }
  };

  //APIT Tax-on-tax lump sum
  const calculateApitTable7 = async (
    paid: number,
    payable: number,
    lumpSum: number,
    taxOnTaxMonthly: number,
    prevLumpTaxOnTax: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/tax-on-tax/lump-sum?paid=${paid}&payable=${payable}&lumpSum=${lumpSum}&taxOnTaxMonthly=${taxOnTaxMonthly}&prevLumpTaxOnTax=${prevLumpTaxOnTax}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 7)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 7)"
      );
      return 0;
    }
  };

  //APIT Secondary Resident
  const calculateApitTable8 = async (primary: number, secondary: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/secondary/resident?primary=${primary}&secondary=${secondary}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 8)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 8)"
      );
      return 0;
    }
  };
  //APIT Secondary Non Resident
  const calculateApitTable9 = async (secondary: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/secondary/nonresident?primary=${primary}&secondary=${secondary}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 9)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 9)"
      );
      return 0;
    }
  };
  //APIT Foreign

  const calculateApitTable10 = async (
    cumulativeIncome: number,
    prevTax: number
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(
        `/api/apit/foreign?cumulativeIncome=${cumulativeIncome}&prevTax=${prevTax}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to calculate APIT (Table 10)");
      }

      const data = await response.json();
      if (data.result !== undefined) {
        // Changed this condition
        const calculatedAmount = data.result;
        setApitResult(calculatedAmount);
        setAppit(calculatedAmount.toString());
        return calculatedAmount;
      } else {
        throw new Error("Invalid APIT response");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to calculate APIT (Table 10)"
      );
      return 0;
    }
  };

  const handleSubmit = async () => {
    try {
      // Basic validation
      if (!isNonEmpty(month) || !isNonEmpty(year)) {
        throw new Error("Please select month and year");
      }

      if (!employeeId) {
        throw new Error("Employee ID is missing");
      }

      if (!isNonNegativeNumber(basic_salary)) {
        throw new Error("Basic Salary must be a valid number");
      }

      if (!isNonNegativeNumber(overTime)) {
        throw new Error("Over Time must be a valid number");
      }

      if (!isNonNegativeNumber(appit)) {
        throw new Error("APPIT must be a valid number");
      }

      if (!isNonNegativeNumber(loan)) {
        throw new Error("Loan must be a valid number");
      }

      if (!isNonNegativeNumber(other_deductions)) {
        throw new Error("Other Deductions must be a valid number");
      }

      // Validate selected allowance/bonus amounts
      const invalidAllowance = selectedAllowances.some((a) => !isPositiveAmount(a.amount));
      if (invalidAllowance) {
        throw new Error("One or more allowance amounts are invalid");
      }

      const invalidBonus = selectedBonuses.some((b) => !isPositiveAmount(b.amount));
      if (invalidBonus) {
        throw new Error("One or more bonus amounts are invalid");
      }

      setIsSubmitting(true);

      const token = localStorage.getItem("token");
      const companyId = localStorage.getItem("cmpnyId");

      if (!token || !companyId) {
        throw new Error("No token or company ID found");
      }

      const allowanceString = selectedAllowances
        .map((a) => `${a.allowanceName}:${a.amount}`)
        .join(",");

      const bonusString = selectedBonuses
        .map((b) => `${b.bonusName}:${b.amount}`)
        .join(",");

      const requestBody = {
        year: parseInt(year),
        month: month,
        basic_salary: parseFloat(basic_salary) || 0,
        allowance: allowanceString || "",
        overtime_pay: parseFloat(overTime) || 0,
        bonus_pay: bonusString || "",
        appit: parseFloat(appit) || 0,
        loan: parseFloat(loan) || 0,
        other_deductions: parseFloat(other_deductions) || 0,
        advance_deduction: parseFloat(salary_advance) || 0,
        epf_8: epf_8,
        total_earnings: total_earnings,
        total_deductions: total_deductions,
        net_salary: net_salary,
        empId: parseInt(employeeId),
      };

      //console.log("Request Body:", requestBody); // Log to verify values

      const response = await fetch(
        "/api/payrole/add_payrole",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit payroll data");
      }

      const data = await response.json();

      //console.log("API Response:", data); // Log to inspect response

      if (data.response.resultCode === 100) {
        toast.success("Payroll data saved successfully!");
        setSelectedAllowances([]);
        setSelectedBonuses([]);
        setOverTime("0");
        setAppit("0");
        setLoan("0");
        setOther_deductions("0");
        handlenavigate();
      } else {
        throw new Error(
          data.response.resultDesc || "Failed to save payroll data"
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "An error occurred while submitting payroll"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtTypeChange = (attendanceId: number, otType: string) => {
    setSelectedOtTypes((prev) => ({
      ...prev,
      [attendanceId]: otType,
    }));
  };

  const calculateOtAmount = (
    basicSalary: number,
    otHours: number,
    otCal: number,
    otType: string,
    otSettings: CompanyOTSettings | null
  ) => {
    if (!otSettings) return 0;

    const rate =
      otType === "holiday"
        ? otSettings.holiday_ot_rate
        : otSettings.normal_ot_rate;

    return (basicSalary / otCal) * otHours * rate;
  };

  const calculateTotalOtAmount = () => {
    if (!selectedEmployeeForOvertime?.attendanceList || !companyOTSettings)
      return 0;

    return selectedEmployeeForOvertime.attendanceList.reduce(
      (total, attendance) => {
        const otHours = Math.max(
          0,
          attendance.totalTime / 60 - companyOTSettings.totalTime
        );
        const otType = selectedOtTypes[attendance.id] || "normal";
        return (
          total +
          calculateOtAmount(
            selectedEmployeeForOvertime.basicSalary || 0,
            otHours,
            companyOTSettings.ot_cal,
            otType,
            companyOTSettings
          )
        );
      },
      0
    );
  };

  const removeSelectedAllowance = (id: number) => {
    setSelectedAllowances((prev) => prev.filter((item) => item.id !== id));
  };

  const removeSelectedBonus = (id: number) => {
    setSelectedBonuses((prev) => prev.filter((item) => item.id !== id));
  };

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
      </div>
    );
  }

  return (
    <div className="bg-white p-3 sm:p-4 md:p-8 rounded-lg shadow-md w-full max-w-6xl mx-auto">
      {/* Header with Employee Info */}
      <div className="flex flex-col md:flex-row items-center border-b border-gray-200 pb-6 mb-6 bg-white rounded-lg shadow-sm p-4">
        {/* Employee Photo */}
        <div className="w-32 h-32 mr-6 mb-4 md:mb-0 flex-shrink-0">
          {employee?.photo?.photo ? (
            <img
              src={`data:image/jpeg;base64,${employee.photo.photo}`}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="rounded-full w-full h-full object-cover border-2 border-gray-200 shadow-md"
            />
          ) : (
            <div className="rounded-full w-full h-full bg-purple-100 flex items-center justify-center border-2 border-purple-200 shadow-md">
              <User size={48} className="text-purple-500" />
            </div>
          )}
        </div>

        {/* Employee Details */}
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4 tracking-tight">
              {`${employee?.firstName} ${employee?.lastName}`}
            </h1>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
              <div className="font-medium text-gray-900">Department</div>
              <div className="truncate">: {employee?.department.dpt_name}</div>

              <div className="font-medium text-gray-900">Designation</div>
              <div className="truncate">
                : {employee?.designation.designation || "N/A"}
              </div>

              <div className="font-medium text-gray-900">EPF NO</div>
              <div className="truncate">: {employee?.epfNo}</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 mt-4 md:mt-0">
            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
              <div className="font-medium text-gray-900">Email</div>
              <div className="truncate">: {employee?.email}</div>

              <div className="font-medium text-gray-900">Telephone</div>
              <div className="truncate">: {employee?.phone}</div>

              <div className="font-medium text-gray-900">Date</div>
              <div className="truncate">
                : {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex flex-col md:flex-row mb-8 gap-4">
        <div className="w-full md:w-1/2">
          <label className="block mb-2 font-medium">Month</label>
          <select
            className="w-full p-2 bg-gray-100 rounded"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
        </div>
        <div className="w-full md:w-1/2">
          <label className="block mb-2 font-medium">Year</label>
          <select
            className="w-full p-2 bg-gray-100 rounded"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Select Year</option>
            {Array.from(
              { length: 10 },
              (_, i) => new Date().getFullYear() + i
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Earnings and Deductions */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Earnings */}
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-bold mb-4">This Month Earning</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm">Basic Salary</label>
              <input
                type="text"
                className="w-full p-2 bg-gray-100 rounded"
                placeholder="Rs. 00"
                value={`Rs. ${employee?.basicSalary ?? ""}`}
                onChange={(e) =>
                  setBasic_salary(e.target.value.replace("Rs. ", ""))
                }
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Over Time</label>
              <input
                type="text"
                className="w-full p-2 bg-gray-100 rounded cursor-pointer"
                placeholder="Rs. 00"
                value={`Rs. ${overTime}`}
                onClick={() => {
                  setSelectedEmployeeForOvertime(employee);
                  setIsOvertimeModalOpen(true);
                }}
                readOnly
              />
            </div>

            {/* Allowance Selection */}
            <div>
              <label className="block mb-1 text-sm">Allowance</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  options={[
                    ...allowances.map((allowance) => ({
                      value: allowance.id,
                      label: allowance.allowanceName,
                    })),
                    {
                      value: -1,
                      label: "+ Add New Allowance",
                    },
                  ]}
                  value={
                    selectedAllowanceId
                      ? allowances.find((a) => a.id === selectedAllowanceId)
                        ? {
                            value: selectedAllowanceId,
                            label: allowances.find(
                              (a) => a.id === selectedAllowanceId
                            )?.allowanceName,
                          }
                        : null
                      : null
                  }
                  onChange={(selectedOption) => {
                    if (selectedOption?.value === -1) {
                      setIsAddAllowanceModalOpen(true);
                    } else {
                      setSelectedAllowanceId(selectedOption?.value || null);
                    }
                  }}
                  className="w-full sm:w-1/2"
                  placeholder="Select Allowance"
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      overflowY: "auto",
                      marginBottom: "10px",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      borderTop:
                        state.label === "+ Add New Allowance"
                          ? "1px solid #e5e7eb"
                          : "none",
                      paddingTop:
                        state.label === "Add New Allowance"
                          ? "10px"
                          : provided.paddingTop,
                    }),
                  }}
                />
                <input
                  type="text"
                  className="w-full sm:w-1/2 p-2 bg-gray-100 rounded"
                  placeholder="Amount"
                  value={allowanceAmount}
                  onChange={(e) => setAllowanceAmount(e.target.value)}
                />
                <button
                  className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600"
                  onClick={handleAddAllowance}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Display Selected Allowances */}
            {selectedAllowances.map((allowance) => (
              <div
                key={allowance.id}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <span>{allowance.allowanceName}</span>
                <div className="flex items-center gap-2">
                  <span>Rs {allowance.amount}</span>
                  <button
                    onClick={() => removeSelectedAllowance(allowance.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Bonus Selection */}
            <div>
              <label className="block mb-1 text-sm">Bonus</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  options={[
                    ...bonuses.map((bonus) => ({
                      value: bonus.id,
                      label: bonus.bonusName,
                    })),
                    {
                      value: -1,
                      label: "+ Add New Bonus",
                    },
                  ]}
                  value={
                    selectedBonusId
                      ? bonuses.find((b) => b.id === selectedBonusId)
                        ? {
                            value: selectedBonusId,
                            label: bonuses.find((b) => b.id === selectedBonusId)
                              ?.bonusName,
                          }
                        : null
                      : null
                  }
                  onChange={(selectedOption) => {
                    if (selectedOption?.value === -1) {
                      setIsAddBonusModalOpen(true);
                    } else {
                      setSelectedBonusId(selectedOption?.value || null);
                    }
                  }}
                  className="w-full sm:w-1/2"
                  placeholder="Select Bonus"
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      overflowY: "auto",
                      marginBottom: "10px",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      borderTop:
                        state.label === "+ Add New Bonus"
                          ? "1px solid #e5e7eb"
                          : "none",
                      paddingTop:
                        state.label === "Add New Bonus"
                          ? "10px"
                          : provided.paddingTop,
                    }),
                  }}
                />
                <input
                  type="text"
                  className="w-full sm:w-1/2 p-2 bg-gray-100 rounded"
                  placeholder="Amount"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                />
                <button
                  className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600"
                  onClick={handleAddBonus}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Display Selected Bonuses */}
            {selectedBonuses.map((bonus) => (
              <div
                key={bonus.id}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <span>{bonus.bonusName}</span>
                <div className="flex items-center gap-2">
                  <span>Rs {bonus.amount}</span>
                  <button
                    onClick={() => removeSelectedBonus(bonus.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 font-bold">
            Total Earning:{" "}
            <span className="text-green-600">Rs {total_earnings || "00"}</span>
          </div>
        </div>

        {/* Deductions */}
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-bold mb-4">This Month Deduction</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm">EPF (8%)</label>
              <input
                type="text"
                className="w-full p-2 bg-gray-100 rounded"
                placeholder="Rs. 00"
                value={`Rs. ${epf_8.toFixed(2)}`}
                readOnly
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-blue-700 font-semibold">Salary Advance</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="text"
                  className="w-full p-2 pl-8 bg-blue-50 border border-blue-200 rounded font-medium text-blue-800"
                  placeholder="00"
                  value={salary_advance}
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 italic">Auto-deducted from approved advances</p>
            </div>

            <div>
              <label className="block mb-1 text-sm">APPIT</label>

              <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="appitType"
                    value="manual"
                    checked={appitType === "manual"}
                    onChange={() => {
                      setAppitType("manual");
                      setAppit("0");
                      setApitResult(null);
                    }}
                    className="mr-2"
                  />
                  Manual Input
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="appitType"
                    value="table"
                    checked={appitType === "table"}
                    onChange={() => setAppitType("table")}
                    className="mr-2"
                  />
                  Select Table
                </label>
              </div>

              {appitType === "manual" ? (
                <input
                  type="text"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter APPIT amount"
                  value={appit}
                  onChange={(e) => setAppit(e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-2">
                    <Select
                      options={[
                        { value: "", label: "Select Table" },
                        { value: "Table 1", label: "Table 1 (Regular)" },
                        { value: "Table 2", label: "Table 2 (Lump-Sum)" },
                        {
                          value: "Table 3",
                          label: "Table 3 (Non Resident Regular)",
                        },
                        {
                          value: "Table 4",
                          label: "Table 4 (Non Resident Lump-Sum)",
                        },
                        { value: "Table 5", label: "Table 5 (Cumalative)" },
                        {
                          value: "Table 6",
                          label: "Table 6 (Tax On Tax Monthly)",
                        },
                        {
                          value: "Table 7",
                          label: "Table 7 (Tax On Tax Lump-Sum)",
                        },
                        {
                          value: "Table 8",
                          label: "Table 8 (Secondary Resident)",
                        },
                        {
                          value: "Table 9",
                          label: "Table 9 (Secondary Non Resident)",
                        },
                        { value: "Table 10", label: "Table 10 (Foreign)" },
                      ]}
                      value={
                        selectedTable
                          ? { value: selectedTable, label: selectedTable }
                          : null
                      }
                      onChange={(selectedOption) => {
                        const table = selectedOption?.value || "";
                        setSelectedTable(table);
                        if (table === "Table 1") {
                          setIsAppitTable1ModalOpen(true);
                        } else if (table === "Table 2") {
                          setIsAppitTable2ModalOpen(true);
                        } else if (table === "Table 3") {
                          setIsAppitTable3ModalOpen(true);
                        } else if (table === "Table 4") {
                          setIsAppitTable4ModalOpen(true);
                        } else if (table === "Table 5") {
                          setIsAppitTable5ModalOpen(true);
                        } else if (table === "Table 6") {
                          setIsAppitTable6ModalOpen(true);
                        } else if (table === "Table 7") {
                          setIsAppitTable7ModalOpen(true);
                        } else if (table === "Table 8") {
                          setIsAppitTable8ModalOpen(true);
                        } else if (table === "Table 9") {
                          setIsAppitTable9ModalOpen(true);
                        } else if (table === "Table 10") {
                          setIsAppitTable10ModalOpen(true);
                        }
                      }}
                      className="flex-1"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          backgroundColor: "#f3f4f6",
                          border: "none",
                          minHeight: "40px",
                        }),
                      }}
                    />
                    <input
                      type="text"
                      className="w-full sm:w-1/3 p-2 bg-gray-100 rounded"
                      placeholder="Amount"
                      value={
                        apitResult !== null
                          ? `Rs. ${parseFloat(appit).toFixed(2)}`
                          : ""
                      }
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm">Loans</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="text"
                  className="w-full p-2 pl-8 bg-gray-100 rounded"
                  placeholder="00"
                  value={loan}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setLoan(value);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm">Other Deduction</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="text"
                  className="w-full p-2 pl-8 bg-gray-100 rounded"
                  placeholder="00"
                  value={other_deductions}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setOther_deductions(value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 font-bold">
            Total Deduction:{" "}
            <span className="text-red-600">Rs {total_deductions || "00"}</span>
          </div>
        </div>
      </div>

      {/* Net Salary */}
      <div className="flex justify-end mt-4 mb-6">
        <div className="text-xl font-bold">
          Net Salary:{" "}
          <span className="text-gray-800">Rs {net_salary || "00"}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          className={`bg-green-500 text-white px-10 py-2 rounded-md hover:bg-green-600 transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Submit
        </button>
      </div>

      {/* Add New Allowance Modal */}
      {isAddAllowanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add New Allowance</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Allowance Name</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter allowance name"
                  value={newAllowanceName}
                  onChange={(e) => setNewAllowanceName(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">
                  EPF Eligible Status
                </label>
                <select
                  className="w-full p-2 bg-gray-100 rounded"
                  value={newAllowanceEpfStatus}
                  onChange={(e) => setNewAllowanceEpfStatus(e.target.value)}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => setIsAddAllowanceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={handleAddNewAllowance}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Bonus Modal */}
      {isAddBonusModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Add New Bonus</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Bonus Name</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter bonus name"
                  value={newBonusName}
                  onChange={(e) => setNewBonusName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => setIsAddBonusModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={handleAddNewBonus}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Modal */}
      {isOvertimeModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-500 mb-4">
              Create Overtime Amount for{" "}
              {selectedEmployeeForOvertime?.firstName}{" "}
              {selectedEmployeeForOvertime?.lastName}
            </h2>

            {/* Attendance History Table with OT Calculation */}
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OT Hours
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OT Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OT Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedEmployeeForOvertime?.attendanceList?.map(
                    (attendance) => {
                      const otHours = Math.max(
                        0,
                        attendance.totalTime / 60 -
                          (companyOTSettings?.totalTime || 0)
                      );

                      return (
                        <tr key={attendance.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              attendance.startedAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {attendance.dayName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(attendance.startedAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {attendance.endedAt
                              ? new Date(attendance.endedAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {(attendance.totalTime / 60).toFixed(2)} hours
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {otHours.toFixed(2)} hours
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <select
                              className="border rounded p-1 text-sm"
                              onChange={(e) =>
                                handleOtTypeChange(
                                  attendance.id,
                                  e.target.value
                                )
                              }
                              defaultValue="normal"
                            >
                              <option value="normal">
                                Normal OT (x{companyOTSettings?.normal_ot_rate})
                              </option>
                              <option value="holiday">
                                Holiday OT (x
                                {companyOTSettings?.holiday_ot_rate})
                              </option>
                            </select>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            Rs.{" "}
                            {calculateOtAmount(
                              selectedEmployeeForOvertime?.basicSalary || 0,
                              otHours,
                              companyOTSettings?.ot_cal || 240,
                              selectedOtTypes[attendance.id] || "normal",
                              companyOTSettings
                            ).toFixed(2)}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                onClick={() => setIsOvertimeModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                onClick={() => {
                  const totalOtAmount = calculateTotalOtAmount();
                  setOverTime(totalOtAmount.toString());
                  setIsOvertimeModalOpen(false);
                }}
              >
                Apply Overtime Amount
              </button>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 1 Calculation Modal */}
      {isAppitTable1ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 1 - Regular)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Total Earning</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-100 rounded"
                  value={`Rs. ${total_earnings.toFixed(2)}`}
                  readOnly
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable1ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    const result = await calculateApitTable1(total_earnings);
                    setIsAppitTable1ModalOpen(false);
                    setAppit(result.toString()); // Update the appit state
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 2 Calculation Modal */}
      {isAppitTable2ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 2 - Lump Sum)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Paid</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter paid amount"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Payable</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter payable amount"
                  value={payable}
                  onChange={(e) => setPayable(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Lump Sum</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter lump sum amount"
                  value={lumpSum}
                  onChange={(e) => setLumpSum(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Monthly Tax</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter monthly tax amount"
                  value={monthlyTax}
                  onChange={(e) => setMonthlyTax(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Previous Lump Tax</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter previous lump tax amount"
                  value={prevLumpTax}
                  onChange={(e) => setPrevLumpTax(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable2ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable2(
                        parseFloat(paid) || 0,
                        parseFloat(payable) || 0,
                        parseFloat(lumpSum) || 0,
                        parseFloat(monthlyTax) || 0,
                        parseFloat(prevLumpTax) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable2ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 3 Calculation Modal */}
      {isAppitTable3ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 1 - Non Resident Regular)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Total Earning</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-100 rounded"
                  value={`Rs. ${total_earnings.toFixed(2)}`}
                  readOnly
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable3ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    const result = await calculateApitTable3(total_earnings);
                    setIsAppitTable3ModalOpen(false);
                    setAppit(result.toString()); // Update the appit state
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 4 Calculation Modal */}
      {isAppitTable4ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 4 - Non Resident Lump Sum)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Paid</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter paid amount"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Payable</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter payable amount"
                  value={payable}
                  onChange={(e) => setPayable(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Lump Sum</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter lump sum amount"
                  value={lumpSum}
                  onChange={(e) => setLumpSum(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Monthly Tax</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter monthly tax amount"
                  value={monthlyTax}
                  onChange={(e) => setMonthlyTax(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Previous Lump Tax</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter previous lump tax amount"
                  value={prevLumpTax}
                  onChange={(e) => setPrevLumpTax(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable4ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable4(
                        parseFloat(paid) || 0,
                        parseFloat(payable) || 0,
                        parseFloat(lumpSum) || 0,
                        parseFloat(monthlyTax) || 0,
                        parseFloat(prevLumpTax) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable4ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 5 Calculation Modal */}
      {isAppitTable5ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 5 - Cumulative)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Cumulative Income</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Cumulative Income"
                  value={cumulativeIncome}
                  onChange={(e) => setCumulativeIncome(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Prev Tax</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Prev Tax"
                  value={prevTax}
                  onChange={(e) => setPrevTax(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable5ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable5(
                        parseFloat(cumulativeIncome) || 0,
                        parseFloat(prevTax) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable5ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 6 Calculation Modal */}
      {isAppitTable6ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 6 - Tax On Tax Monthly)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Total Earning</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-100 rounded"
                  value={`Rs. ${total_earnings.toFixed(2)}`}
                  readOnly
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable6ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    const result = await calculateApitTable6(total_earnings);
                    setIsAppitTable6ModalOpen(false);
                    setAppit(result.toString()); // Update the appit state
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 7 Calculation Modal */}
      {isAppitTable7ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 7 - Tax On Tax Lump Sum)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Paid</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter paid amount"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Payable</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter payable amount"
                  value={payable}
                  onChange={(e) => setPayable(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Lump Sum</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter lump sum amount"
                  value={lumpSum}
                  onChange={(e) => setLumpSum(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Tax On Tax Monthly</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Tax On Tax Monthly"
                  value={taxOnTaxMonthly}
                  onChange={(e) => setTaxOnTaxMonthly(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">
                  Tax On Tax Previous Lump{" "}
                </label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter previous lump tax amount"
                  value={prevLumpTaxOnTax}
                  onChange={(e) => setPrevLumpTaxOnTax(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable5ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable7(
                        parseFloat(paid) || 0,
                        parseFloat(payable) || 0,
                        parseFloat(lumpSum) || 0,
                        parseFloat(taxOnTaxMonthly) || 0,
                        parseFloat(prevLumpTaxOnTax) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable7ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 8 Calculation Modal */}
      {isAppitTable8ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 8 - Secondary Resident)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Primary</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Cumulative Income"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Secondary</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Prev Tax"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable8ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable8(
                        parseFloat(primary) || 0,
                        parseFloat(secondary) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable8ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 9 Calculation Modal */}
      {isAppitTable9ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 9 - Secondary Non Resident)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Secondary</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Prev Tax"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable9ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable9(
                        parseFloat(secondary) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable9ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* APIT Table 10 Calculation Modal */}
      {isAppitTable10ModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Calculate APIT (Table 10 - Foreign)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Cumulative Income</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Cumulative Income"
                  value={cumulativeIncome}
                  onChange={(e) => setCumulativeIncome(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Prev Tax</label>
                <input
                  type="number"
                  className="w-full p-2 bg-gray-100 rounded"
                  placeholder="Enter Prev Tax"
                  value={prevTax}
                  onChange={(e) => setPrevTax(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAppitTable10ModalOpen(false);
                    setSelectedTable("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const result = await calculateApitTable10(
                        parseFloat(cumulativeIncome) || 0,
                        parseFloat(prevTax) || 0
                      );

                      // Ensure the result is displayed even if it's 0
                      setAppit(result.toString());
                      setIsAppitTable10ModalOpen(false);

                      // Show success message
                      toast.success(
                        `APIT calculated: Rs. ${result.toFixed(2)}`
                      );
                    } catch {
                      toast.error("Failed to calculate APIT");
                    }
                  }}
                >
                  Calculate APIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryForm;
