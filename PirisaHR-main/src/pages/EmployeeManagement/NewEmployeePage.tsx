/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { TranslatableOption, TranslatableText } from "../../components/languages/TranslatableText";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../components/Loading/Loading";

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
  nic: string;
  date_of_joining: string;
  cmp_id: number;
  dptId: number;
  designationId: number;
}

interface Document {
  birthCertificate: File | null;
  cv: File | null;
  idCopy: File | null;
  policeReport: File | null;
  bankPassbook: File | null;
  appointmentLetter: File | null;
  photo: File | null;
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

const EmployeeRegistration: React.FC = () => {
  const [step, setStep] = useState(1);
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
    nic: "",
    date_of_joining: "",
    cmp_id: 0,
    dptId: 0,
    designationId: 0,
  });

  const [documents, setDocuments] = useState<Document>({
    birthCertificate: null,
    cv: null,
    idCopy: null,
    policeReport: null,
    bankPassbook: null,
    appointmentLetter: null,
    photo: null,
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [empId, setEmpId] = useState<number | null>(null); // To store the employee ID from Step 1
  const [submittingDetails, setSubmittingDetails] = useState(false); // Loading state for Step 1
  const [submittingDocs, setSubmittingDocs] = useState(false); // Loading state for Step 2

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error("No token found in local storage");
      // Redirect to login or handle token absence
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchDepartments = async () => {
    const cmpId = localStorage.getItem("cmpnyId");
    if (!cmpId) {
      console.error("Company ID not found in local storage");
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
        console.log("Departments API Response:", data);
        const rawUnits = data.UnitList || data.DepartmentList;
        if (rawUnits && Array.isArray(rawUnits)) {
          console.log("Departments found:", rawUnits);
          setDepartments(rawUnits);
        } else {
          console.error("API response is not in expected format:", data);
        }
      } else {
        console.error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
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
      }));
      setDesignations(selectedDepartment.designationList);
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: string
  ) => {
    const file = e.target.files?.[0] || null;
    setDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      console.error("No token available");
      return;
    }

    const cmpId = localStorage.getItem("cmpnyId");
    if (!cmpId) {
      console.error("Company ID not found in localStorage");
      return;
    }
    setSubmittingDetails(true);
    const formattedDOB = new Date(employeeDetails.DOB)
      .toISOString()
      .split("T")[0];
    const formattedJoiningDate = new Date(employeeDetails.date_of_joining)
      .toISOString()
      .split("T")[0];

    // Validation checks
    if (!employeeDetails.dptId || employeeDetails.dptId === 0) {
      toast.error("Please select a department");
      setSubmittingDetails(false);
      return;
    }
    
    if (!employeeDetails.designationId || employeeDetails.designationId === 0) {
      toast.error("Please select a designation");
      setSubmittingDetails(false);
      return;
    }

    console.log("Current employee details before submission:", employeeDetails);
    console.log("Selected dptId:", employeeDetails.dptId);
    console.log("Selected designationId:", employeeDetails.designationId);
    console.log("Available departments:", departments);
    
    const payload = {
      epf_no: employeeDetails.epf_no,
      emp_no: employeeDetails.emp_no,
      first_name: employeeDetails.first_name,
      last_name: employeeDetails.last_name,
      basic_salary: Number(employeeDetails.basic_salary),
      email: employeeDetails.email,
      gender: employeeDetails.gender,
      dob: formattedDOB,
      phone: employeeDetails.phone,
      address: employeeDetails.address,
      nic: employeeDetails.nic,
      date_of_joining: formattedJoiningDate,
      cmpId: Number(cmpId),
      dptId: Number(employeeDetails.dptId),
      designationId: Number(employeeDetails.designationId),
    };
    
    console.log("Final payload:", payload);

    try {
      const response = await fetch(
        "/api/employee/add_employee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      //console.log("Full response data:", data);

      // Check if we have a successful response
      if (data.response?.resultCode === 100) {
        // The employee ID is inside the Employee object
        const employeeId = data.Employee?.id;

        if (employeeId) {
          setEmpId(employeeId);
          localStorage.setItem("currentEmpId", employeeId.toString());
          //("Employee ID saved:", employeeId);
          toast.success("Employee details saved successfully!");
          // alert('Employee details saved successfully!');
          setStep(2);
        } else {
          console.error(
            "Employee saved but ID not found in response. Full response:",
            JSON.stringify(data)
          );
          // alert('Employee saved but there was an issue getting the ID. Please check console for details.');
        }
      } else {
        console.error("API error:", {
          resultCode: data.response?.resultCode,
          resultDesc: data.response?.resultDesc,
        });
        // alert(data.response?.resultDesc || 'Failed to save employee details');
        toast.error(
          data.response?.resultDesc || "Failed to save employee details"
        );
      }
    } catch (error) {
      console.error("Error submitting employee details:", error);
      // alert('Error saving employee details. Please try again.');
      toast.error("Error saving employee details. Please try again.");
    } finally {
      setSubmittingDetails(false);
    }
  };
  const handleSubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentEmpId = empId || localStorage.getItem("currentEmpId");

    if (!token || !currentEmpId) {
      toast.error(
        "Employee ID not found. Please ensure employee details are saved first."
      );
      return;
    }
    setSubmittingDocs(true);
    const formData = new FormData();

    // Add empId to FormData
    formData.append("empId", currentEmpId.toString());

    // Append files to FormData with exact field names
    if (documents) {
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
    }

    // Debug: Log current documents state
    console.log("Current documents state:", documents);
    
    // Check if we have any files to upload (profile picture or other documents)
    const hasProfilePicture = documents && documents.photo !== null;
    const hasOtherFiles = documents && Object.entries(documents).some(([key, file]) => file && key !== "photo");
    
    console.log("Has profile picture:", hasProfilePicture);
    console.log("Has other files:", hasOtherFiles);
    
    if (!hasProfilePicture && !hasOtherFiles) {
      toast.error("Please select at least one document to upload.");
      setSubmittingDocs(false);
      return;
    }

    try {
      // Handle profile picture separately using ProfileImageController
      if (documents && documents.photo) {
        console.log("Uploading profile picture...");
        const profileFormData = new FormData();
        profileFormData.append("profileImage", documents.photo);
        
        const profileResponse = await fetch(
          `/api/profile-image/upload/${currentEmpId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: profileFormData,
          }
        );
        
        if (!profileResponse.ok) {
          toast.error("Failed to upload profile picture");
        } else {
          console.log("Profile picture uploaded successfully");
        }
      }

      // Handle other documents using document upload API
      const otherDocsFormData = new FormData();
      let hasOtherFiles = false;

      // Add empId to FormData
      otherDocsFormData.append("empId", currentEmpId.toString());

      if (documents) {
        Object.entries(documents).forEach(([key, file]) => {
          if (file && key !== "photo") { // Skip photo as it's handled separately
            otherDocsFormData.append(key, file);
            hasOtherFiles = true;
          }
        });
      }

      let documentResponse = null;
      if (hasOtherFiles) {
        documentResponse = await fetch(
          "/api/document/upload-all",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: otherDocsFormData,
          }
        );

        if (!documentResponse.ok) {
          const errorData = await documentResponse.json();
          throw new Error(errorData.resultDesc || `Failed to upload documents: ${documentResponse.status}`);
        }
      }

      if ((hasOtherFiles && documentResponse?.status === 200) || !hasOtherFiles) {
        toast.success("Documents uploaded successfully!");
        localStorage.removeItem("currentEmpId");
        setStep(1);
        setEmployeeDetails({
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
          nic: "",
          date_of_joining: "",
          cmp_id: 0,
          dptId: 0,
          designationId: 0,
        });
        setDocuments({
          birthCertificate: null,
          cv: null,
          idCopy: null,
          policeReport: null,
          bankPassbook: null,
          appointmentLetter: null,
          photo: null,
        });
      } else {
        toast.error(`Failed to upload documents: ${documentResponse?.status || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Error uploading documents. Please try again.");
    } finally {
      setSubmittingDocs(false);
    }
  };

  // Skip button handler
  const handleSkipDocuments = async () => {
    const currentEmpId = empId || localStorage.getItem("currentEmpId");
    if (!token || !currentEmpId) {
      toast.error(
        "Employee ID not found. Please ensure employee details are saved first."
      );
      return;
    }
    setSubmittingDocs(true);
    const formData = new FormData();
    formData.append("empId", currentEmpId.toString());
    try {
      const response = await fetch(
        "/api/document/upload-all",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (response.status === 200) {
        toast.success("Skipped document upload. Employee registered!");
        localStorage.removeItem("currentEmpId");
        setStep(1);
        setEmployeeDetails({
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
          nic: "",
          date_of_joining: "",
          cmp_id: 0,
          dptId: 0,
          designationId: 0,
        });
        setDocuments({
          birthCertificate: null,
          cv: null,
          idCopy: null,
          policeReport: null,
          bankPassbook: null,
          appointmentLetter: null,
          photo: null,
        });
      } else {
        const text = await response.text();
        toast.error(`Failed to skip document upload: ${response.status} - ${text}`);
      }
    } catch (error) {
      toast.error("Error skipping document upload. Please try again.");
    } finally {
      setSubmittingDocs(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {step === 1 ? (
        <form onSubmit={handleSubmitDetails} className="space-y-6">
          {/* Profile Picture Upload Section */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 border-2 border-gray-300 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center">
                {documents.photo ? (
                  <img
                    src={URL.createObjectURL(documents.photo)}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">No Photo</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <TranslatableText text="Profile Picture" />
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "photo")}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500">
                  <TranslatableText text="Upload profile picture (Optional)" />
                </p>
              </div>
            </div>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <TranslatableText text="Department" />
              </label>
              <select
                name="department"
                value={employeeDetails.dptId}
                onChange={handleDepartmentChange}
                className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                name="designation"
                value={employeeDetails.designationId}
                onChange={handleDesignationChange}
                className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TranslatableText text="Date of Birth" />
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="DOB"
                  value={employeeDetails.DOB}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1 px-3 pr-10 block w-full h-10 sm:h-11 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 text-sm sm:text-base transition-colors duration-200 hover:border-gray-400"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <TranslatableText text="nic" />
              </label>
              <input
                type="text"
                name="nic"
                value={employeeDetails.nic}
                onChange={handleInputChange}
                className="mt-1 px-3 block w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter nic Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TranslatableText text="Date of Joining" />
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date_of_joining"
                  value={employeeDetails.date_of_joining}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1 px-3 pr-10 block w-full h-10 sm:h-11 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 text-sm sm:text-base transition-colors duration-200 hover:border-gray-400"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-start space-x-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 hover:scale-105 flex items-center justify-center disabled:bg-green-400 disabled:cursor-not-allowed"
              disabled={submittingDetails}
            >
              {submittingDetails ? (
                <>
                  <Loading
                    size="xs"
                    color="border-white"
                    className="inline mr-2"
                  />
                  <span>Loading...</span>
                </>
              ) : (
                <TranslatableText text="Next" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmitDocuments} className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <TranslatableText text="Please Upload below documents" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "birthCertificate",
                label: "Birth Certificate",
                accept: ".pdf",
              },
              { name: "cv", label: "CV", accept: ".pdf" },
              { name: "idCopy", label: "ID Copy", accept: ".pdf" },
              { name: "policeReport", label: "Police Report", accept: ".pdf" },
              {
                name: "bankPassbook",
                label: "Bank Passbook Front Page",
                accept: ".pdf",
              },
              {
                name: "appointmentLetter",
                label: "Appointment Letter",
                accept: ".pdf",
              },
              { name: "photo", label: "Photo", accept: ".jpg,.jpeg,.png" },
            ].map((doc) => (
              <div key={doc.name}>
                <label className="block text-sm font-medium text-gray-700">
                  <TranslatableText text={doc.label} />{" "}
                  <span className="text-red-600">*</span>
                </label>
                <div className="mt-1 flex items-center">
                  <label className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <TranslatableText text="Choose File" />
                    <input
                      type="file"
                      className="hidden"
                      accept={doc.accept}
                      onChange={(e) => handleFileChange(e, doc.name)}
                    />
                  </label>
                </div>
                {documents[doc.name as keyof Document] && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {documents[doc.name as keyof Document]?.name}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-start space-x-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 hover:scale-105 flex items-center justify-center disabled:bg-green-400 disabled:cursor-not-allowed"
              disabled={submittingDocs}
            >
              {submittingDocs ? (
                <>
                  <Loading
                    size="xs"
                    color="border-white"
                    className="inline mr-2"
                  />
                  <span>Loading...</span>
                </>
              ) : (
                <TranslatableText text="Submit Documents" />
              )}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 hover:scale-105 flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={submittingDocs}
              onClick={handleSkipDocuments}
            >
              {submittingDocs ? (
                <>
                  <Loading
                    size="xs"
                    color="border-white"
                    className="inline mr-2"
                  />
                  <span>Loading...</span>
                </>
              ) : (
                <TranslatableText text="Skip" />
              )}
            </button>
          </div>
        </form>
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

export default EmployeeRegistration;
