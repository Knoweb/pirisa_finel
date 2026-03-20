/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TranslatableOption, TranslatableText } from "../../components/languages/TranslatableText";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { isEmail, isNonEmpty, isNonNegativeNumber, isPhone } from "../../utils/validation";

interface EmployeeDetails {
  epf_no: string;
  emp_no: string;
  first_name: string;
  last_name: string;
  designation: string;
  department: string;
  basic_salary: number;
  email: string;
  gender: string;
  DOB: string;
  phone: string;
  address: string;
  NIC: string;
  date_of_joining: string;
  cmp_id: number;
  dptId: number;
  designationId: number;
}

interface Department {
  id: number;
  dpt_name: string;
  designationList: Designation[];
}

interface Designation {
  id: number;
  designation: string;
  dptId: number;
}

type UpdateEmployeeApiResponse = {
  response?: {
    resultCode?: number;
    resultDesc?: string;
  };
  resultCode?: number;
  resultDesc?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const EmployeeUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails>({
    epf_no: "",
    emp_no: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    basic_salary: 0,
    email: "",
    gender: "",
    DOB: "",
    phone: "",
    address: "",
    NIC: "",
    date_of_joining: "",
    cmp_id: 0,
    dptId: 0,
    designationId: 0,
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasProfileImage, setHasProfileImage] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error("No token found in local storage");
      setError("Authentication token not found. Please log in.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (token && id) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        await fetchEmployeeDetails();
      };
      void fetchData().catch((err) => {
        console.error("Error in fetchData:", err);
      });
    }
  }, [token, id]);

  useEffect(() => {
    if (employeeDetails.dptId && token) {
      void fetchDepartments().catch((err) => {
        console.error("Error in fetchDepartments:", err);
      });
    }
  }, [employeeDetails.dptId, token]);

  const fetchEmployeeDetails = async () => {
    try {
      const response = await fetch(
        `/api/employee/emp/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        //console.log("Employee API Response:", JSON.stringify(data, null, 2));

        if (data.resultCode === 100 && data.Employee_list) {
          const emp = data.Employee_list;
          setEmployeeDetails({
            epf_no: emp.epf_no || "",
            emp_no: emp.emp_no || "",
            first_name: emp.first_name || "",
            last_name: emp.last_name || "",
            department: emp.department?.dpt_name || "",
            designation: emp.designation?.designation || "",
            basic_salary: emp.basic_salary || 0,
            email: emp.email || "",
            gender: emp.gender || "",
            DOB: (emp.DOB || emp.dob) ? String(emp.DOB || emp.dob).split("T")[0] : "",
            phone: emp.phone || "",
            address: emp.address || "",
            NIC: emp.NIC || emp.nic || "",
            date_of_joining: emp.date_of_joining
              ? emp.date_of_joining.split("T")[0]
              : "",
            cmp_id: emp.cmpId || 0,
            dptId: emp.department?.id || 0,
            designationId: emp.designation?.id || 0,
          });
        } else {
          setError(
            data.resultDesc ||
              "Employee data not found in response. Please check the employee ID."
          );
        }
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to fetch employee details:",
          response.status,
          errorText
        );
        setError(
          `Failed to fetch employee details: ${response.status} - ${errorText}`
        );
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setError("Error fetching employee details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const cmpId = localStorage.getItem("cmpnyId");
    if (!cmpId) {
      console.error("Company ID not found in local storage");
      setError("Company ID not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `/api/department/company/${cmpId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        //("Departments API Response:", JSON.stringify(data, null, 2));
        const rawUnits = data.UnitList || data.DepartmentList;
        if (rawUnits && Array.isArray(rawUnits)) {
          setDepartments(rawUnits);
          const selectedDept = rawUnits.find(
            (dept: Department) => dept.id === employeeDetails.dptId
          );
          if (selectedDept) {
            setDesignations(selectedDept.designationList || []);
          } else {
            setDesignations([]);
          }
        } else {
          setError("Invalid department data received.");
        }
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to fetch departments:",
          response.status,
          errorText
        );
        setError(
          `Failed to fetch departments: ${response.status} - ${errorText}`
        );
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Error fetching departments. Please try again.");
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dptId = parseInt(e.target.value);
    const selectedDepartment = departments.find((dept) => dept.id === dptId);

    if (selectedDepartment) {
      setEmployeeDetails((prev) => ({
        ...prev,
        dptId,
        department: selectedDepartment.dpt_name,
        designationId: 0, // Reset designation when department changes
        designation: "",
      }));
      setDesignations(selectedDepartment.designationList || []);
    } else {
      setDesignations([]);
    }
  };

  const handleDesignationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const designationId = parseInt(e.target.value);
    const selectedDesignation = designations.find(
      (desig) => desig.id === designationId
    );

    if (selectedDesignation) {
      setEmployeeDetails((prev) => ({
        ...prev,
        designationId,
        designation: selectedDesignation.designation,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEmployeeDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true); // Start loading
    setError(null); // Clear any previous errors
    if (!token || !id) {
      console.error("No token or employee ID available");
      setError("Authentication token or employee ID missing.");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.emp_no)) {
      toast.error("EMP Number is required");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.epf_no)) {
      toast.error("EPF Number is required");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.first_name)) {
      toast.error("First Name is required");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.last_name)) {
      toast.error("Last Name is required");
      setIsUpdating(false);
      return;
    }

    if (!employeeDetails.dptId || employeeDetails.dptId === 0) {
      toast.error("Please select a department");
      setIsUpdating(false);
      return;
    }

    if (!employeeDetails.designationId || employeeDetails.designationId === 0) {
      toast.error("Please select a designation");
      setIsUpdating(false);
      return;
    }

    if (!isNonNegativeNumber(employeeDetails.basic_salary)) {
      toast.error("Basic Salary must be a valid number");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.email) || !isEmail(employeeDetails.email)) {
      toast.error("Please enter a valid email address");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.phone) || !isPhone(employeeDetails.phone)) {
      toast.error("Please enter a valid phone number");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.address)) {
      toast.error("Address is required");
      setIsUpdating(false);
      return;
    }

    if (!isNonEmpty(employeeDetails.NIC)) {
      toast.error("NIC is required");
      setIsUpdating(false);
      return;
    }

    const cmpId = localStorage.getItem("cmpnyId");
    if (!cmpId) {
      console.error("Company ID not found in localStorage");
      setError("Company ID not found.");
      return;
    }

    const formatDateOrThrow = (value: string, fieldName: string) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error(`Invalid ${fieldName}`);
      }
      return d.toISOString().split("T")[0];
    };

    let formattedDOB: string;
    let formattedJoiningDate: string;
    try {
      formattedDOB = formatDateOrThrow(employeeDetails.DOB, "Date of Birth");
      formattedJoiningDate = formatDateOrThrow(
        employeeDetails.date_of_joining,
        "Date of Joining"
      );
    } catch (err) {
      console.error("Date validation failed:", err);
      toast.error("Please select valid dates for Date of Birth and Date of Joining");
      setIsUpdating(false);
      return;
    }

    const payload = {
      epf_no: employeeDetails.epf_no.trim(),
      emp_no: employeeDetails.emp_no.trim(),
      first_name: employeeDetails.first_name.trim(),
      last_name: employeeDetails.last_name.trim(),
      basic_salary: Number(employeeDetails.basic_salary),
      email: employeeDetails.email.trim(),
      gender: employeeDetails.gender,
      DOB: formattedDOB,
      phone: employeeDetails.phone.trim(),
      address: employeeDetails.address.trim(),
      NIC: employeeDetails.NIC.trim(),
      date_of_joining: formattedJoiningDate,
      cmpId: Number(cmpId),
      dptId: Number(employeeDetails.dptId),
      designationId: Number(employeeDetails.designationId),
    };

    //console.log("Payload being sent:", payload); // Log the payload to verify

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const response = await fetch(`/api/employee/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data: unknown = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        console.error("Update request failed:", response.status, data);
        const errParsed: UpdateEmployeeApiResponse | undefined = isRecord(data)
          ? (data as UpdateEmployeeApiResponse)
          : undefined;
        const errDesc =
          errParsed?.response?.resultDesc ?? errParsed?.resultDesc ?? undefined;
        toast.error(
          typeof data === "string"
            ? `Failed to update employee details: ${response.status}`
            : errDesc || `Failed to update employee details: ${response.status}`
        );
        return;
      }

      const parsed: UpdateEmployeeApiResponse | undefined = isRecord(data)
        ? (data as UpdateEmployeeApiResponse)
        : undefined;

      const resultCode = parsed?.response?.resultCode ?? parsed?.resultCode;
      const resultDesc = parsed?.response?.resultDesc ?? parsed?.resultDesc;

      if (resultCode === 100) {
        //console.log("Success! Showing toast and navigating...");

        const message = hasProfileImage 
          ? "Employee details and profile image updated successfully!"
          : "Employee details updated successfully!";
        
        toast.success(message);
        navigate("/employee/all");
      } else {
        console.error("API error:", {
          resultCode,
          resultDesc,
        });
        toast.error(
          resultDesc || "Failed to update employee details"
        );
      }
    } catch (error) {
      console.error("Error updating employee details:", error);
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error("Update request timed out. Please try again.");
      } else {
        toast.error("Error updating employee details. Please try again.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsUpdating(false); // Stop loading regardless of success/error
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <button
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchEmployeeDetails();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        <TranslatableText text="Update Employee Details" />
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Section */}
        <div className="flex justify-center mb-8">
          <ProfileImageUpload
            employeeId={id || ""}
            token={token || ""}
            onImageChange={(hasImage) => setHasProfileImage(hasImage)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="EMP Number" />
            </label>
            <input
              type="text"
              name="emp_no"
              value={employeeDetails.emp_no}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter EMP Number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="EPF Number" />
            </label>
            <input
              type="text"
              name="epf_no"
              value={employeeDetails.epf_no}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter EPF Number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="First Name" />
            </label>
            <input
              type="text"
              name="first_name"
              value={employeeDetails.first_name}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter First Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Last Name" />
            </label>
            <input
              type="text"
              name="last_name"
              value={employeeDetails.last_name}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Last Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Department" />
            </label>
            <select
              value={employeeDetails.dptId}
              onChange={handleDepartmentChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">
                <TranslatableOption text="Select Department" />
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.dpt_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Designation" />
            </label>
            <select
              value={employeeDetails.designationId}
              onChange={handleDesignationChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">
                <TranslatableOption text="Select Designation" />
              </option>
              {designations.map((desig) => (
                <option key={desig.id} value={desig.id}>
                  {desig.designation}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Basic Salary" />
            </label>
            <input
              type="number"
              name="basic_salary"
              value={employeeDetails.basic_salary}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Basic Salary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Email" />
            </label>
            <input
              type="email"
              name="email"
              value={employeeDetails.email}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Gender" />
            </label>
            <select
              name="gender"
              value={employeeDetails.gender}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">
                <TranslatableOption text="Select Gender" />
              </option>
              <option value="Male">
                <TranslatableOption text="Male" />
              </option>
              <option value="Female">
                <TranslatableOption text="Female" />
              </option>
              <option value="Other">
                <TranslatableOption text="Other" />
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Date of Birth" />
            </label>
            <input
              type="date"
              name="DOB"
              value={employeeDetails.DOB}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Phone" />
            </label>
            <input
              type="tel"
              name="phone"
              value={employeeDetails.phone}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Phone Number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Address" />
            </label>
            <input
              type="text"
              name="address"
              value={employeeDetails.address}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter Address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="NIC" />
            </label>
            <input
              type="text"
              name="NIC"
              value={employeeDetails.NIC}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter NIC"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <TranslatableText text="Date of Joining" />
            </label>
            <input
              type="date"
              name="date_of_joining"
              value={employeeDetails.date_of_joining}
              onChange={handleInputChange}
              className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="flex justify-start space-x-4">
          <button
            type="submit"
            disabled={isUpdating}
            className={`px-6 py-2 text-white rounded-md hover:scale-105 flex items-center justify-center ${
              isUpdating ? "bg-green-600" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isUpdating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <TranslatableText text="Updating..." />
              </>
            ) : (
              <TranslatableText text="Update Employee" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/employee/all")}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 hover:scale-105"
          >
            <TranslatableText text="Cancel" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeUpdate;
