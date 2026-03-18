import React, { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  Eye,
  Mail,
  MapPin,
  Phone,
  User,
  X,
  FileText,
  FileImage,
  FileCheck,
  CreditCard,
  FileSignature,
  IdCard,
} from "lucide-react";
import Loading from "../Loading/Loading";
//import profile from "../../../public/profile.jpg";

interface EmployeeDetails {
  id: number;
  epf_no: string;
  first_name: string;
  last_name: string;
  basic_salary: number;
  email: string;
  gender: string;
  phone: string;
  address: string;
  date_of_joining: string;
  dob: string;
  nic: string;

  department: {
    dpt_name: string;
  };
  designation: {
    designation: string;
  };
  employeeLeaves: {
    id: number;
    leaveType: string;
    leaveStartDay: string;
    leaveEndDay: string;
    leaveDays: number;
    leaveReason: string;
    leaveStatus: string;
    empId: number;
  }[];
}

interface CompanyLeave {
  id: number;
  leaveType: string;
  amount: number;
  cmpId: number;
}

interface EmployeeDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  id: number | null;
}

const EmployeeDetailsPopup: React.FC<EmployeeDetailsPopupProps> = ({
  isOpen,
  onClose,
  id,
}) => {
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [companyLeaves, setCompanyLeaves] = useState<CompanyLeave[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [documentAvailability, setDocumentAvailability] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setPhotoUrl((prev) => {
        if (prev) {
          try {
            URL.revokeObjectURL(prev);
          } catch {
            // no-op
          }
        }
        return null;
      });
    };
  }, []);

  const checkDocumentAvailability = async (empId: number, token: string) => {
    const documentTypes = [
      "birthCertificate",
      "cv",
      "policeReport",
      "idCopy",
      "bankPassbook",
      "appointmentLetter",
      "photo",
    ];
    const availability: Record<string, boolean> = {};

    for (const docType of documentTypes) {
      try {
        const response = await fetch(
          `/document/view/emp/${empId}/${docType}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        availability[docType] = response.ok && response.status !== 204;
      } catch {
        availability[docType] = false;
      }
    }

    setDocumentAvailability(availability);
  };

  useEffect(() => {
    if (isOpen && id) {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem("token");
          const cmpnyId = localStorage.getItem("cmpnyId");
          if (!token) {
            throw new Error("No token found");
          }

          // Fetch employee details
          const employeeResponse = await fetch(
            `/employee/emp/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!employeeResponse.ok) {
            throw new Error("Failed to fetch employee details");
          }

          const employeeData = await employeeResponse.json();
          if (employeeData.resultCode === 100) {
            setEmployee(employeeData.Employee_list);
          } else {
            throw new Error(employeeData.resultDesc);
          }

          // Fetch company leave types (non-blocking)
          try {
            const companyLeaveResponse = await fetch(
              `/company_leave/company/${cmpnyId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (companyLeaveResponse.ok) {
              const companyLeaveData = await companyLeaveResponse.json();
              if (
                companyLeaveData.resultCode === 100 &&
                companyLeaveData.LeavetList
              ) {
                setCompanyLeaves(companyLeaveData.LeavetList);
              } else {
                console.warn(
                  "Company leave data not available or invalid:",
                  companyLeaveData.resultDesc
                );
                setCompanyLeaves([]);
              }
            } else {
              console.warn(
                "Failed to fetch company leave types, proceeding without leave data"
              );
              setCompanyLeaves([]);
            }
          } catch (leaveError) {
            console.warn(
              "Could not fetch company leave data, proceeding without it:",
              leaveError
            );
            setCompanyLeaves([]);
          }

          // Check document availability
          await checkDocumentAvailability(id, token);

          // Fetch employee photo
          try {
            const existsResp = await fetch(
              `/api/profile-image/exists/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (existsResp.ok) {
              const existsData: { hasProfileImage?: boolean; exists?: boolean } =
                await existsResp.json();
              const hasImage = Boolean(
                existsData?.hasProfileImage ?? existsData?.exists
              );

              if (hasImage) {
                const imgResp = await fetch(
                  `/api/profile-image/view/${id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (imgResp.ok) {
                  const blob = await imgResp.blob();
                  if (blob && blob.size > 0) {
                    const objUrl = URL.createObjectURL(blob);
                    setPhotoUrl((prev) => {
                      if (prev) {
                        try {
                          URL.revokeObjectURL(prev);
                        } catch {
                          // no-op
                        }
                      }
                      return objUrl;
                    });
                  }
                }
              } else {
                setPhotoUrl((prev) => {
                  if (prev) {
                    try {
                      URL.revokeObjectURL(prev);
                    } catch {
                      // no-op
                    }
                  }
                  return null;
                });
              }
            }
          } catch {
            // ignore photo failures; keep fallback avatar
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen, id]);

  const calculateLeaveBalance = () => {
    if (!employee) return [];

    // If no company leaves are configured, return empty array
    if (!companyLeaves || companyLeaves.length === 0) {
      return [];
    }

    return companyLeaves.map((companyLeave) => {
      // Filter approved leaves of this type
      const approvedLeaves = employee.employeeLeaves.filter(
        (leave) =>
          leave.leaveType === companyLeave.leaveType &&
          leave.leaveStatus === "APPROVED"
      );

      // Calculate total taken days
      const takenDays = approvedLeaves.reduce(
        (total, leave) => total + leave.leaveDays,
        0
      );

      return {
        type: companyLeave.leaveType,
        total: companyLeave.amount,
        taken: takenDays,
        remaining: companyLeave.amount - takenDays,
      };
    });
  };

  const handleDocumentView = async (documentType: string) => {
    try {
      // Clear any previous errors
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      // Check if document is available before trying to fetch
      if (!documentAvailability[documentType]) {
        setError(
          `${documentType
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) =>
              str.toUpperCase()
            )} is not available for this employee`
        );
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
        return;
      }

      const url = `/document/view/emp/${id}/${documentType}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        setError(
          `${documentType
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())} is not available for this employee`
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      window.open(objectUrl, "_blank");

      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to view document";
      setError(errorMessage);
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Data
            </h3>
            <p className="text-gray-600 mb-4">No employee data found</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const leaveBalances = calculateLeaveBalance();
  const documents = [
    { name: "Birth Certificate", type: "birthCertificate", icon: FileCheck },
    { name: "CV", type: "cv", icon: FileText },
    { name: "Police Report", type: "policeReport", icon: FileText },
    { name: "ID", type: "idCopy", icon: CreditCard },
    { name: "Bank Copy", type: "bankPassbook", icon: CreditCard },
    {
      name: "Appointment Letter",
      type: "appointmentLetter",
      icon: FileSignature,
    },
    { name: "Photo", type: "photo", icon: FileImage },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Employee Profile
              </h2>
              <p className="text-gray-600 mt-1"> Employee Information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors duration-200"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Error notification banner */}
          {error && employee && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white">
                      <img
                        src={
                          photoUrl ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                      {employee.designation.designation}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-xl text-sky-600 font-medium mt-1">
                        {employee.department.dpt_name}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Employee ID</p>
                          <p className="font-semibold text-gray-900">
                            {employee.epf_no}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-semibold text-gray-900 truncate">
                            {employee.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Phone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-semibold text-gray-900">
                            {employee.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Joined</p>
                          <p className="font-semibold text-gray-900">
                            {employee.date_of_joining}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p className="font-semibold text-gray-900">
                            {employee.gender}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Basic Salary</p>
                          <p className="font-semibold text-gray-900">
                            LKR {employee.basic_salary.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Birth Day</p>
                          <p className="font-semibold text-gray-900">
                            {employee.dob}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <IdCard className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">NIC</p>
                          <p className="font-semibold text-gray-900">
                            {employee.nic}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">EPF Number</p>
                          <p className="font-semibold text-gray-900">
                            {employee.epf_no}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Address</h4>
              </div>
              <p className="text-gray-700 leading-relaxed pl-13">
                {employee.address}
              </p>
            </div>

            {/* Leave Balance & Documents */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Leave Balance */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Leave Balance
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Current year allocation
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {leaveBalances.length > 0 ? (
                    leaveBalances.map((balance, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            {balance.type}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            <span className="text-blue-600 font-bold">
                              {balance.remaining}
                            </span>{" "}
                            / {balance.total} days
                          </span>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-sky-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (balance.remaining / balance.total) * 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white drop-shadow-sm">
                              {Math.round(
                                (balance.remaining / balance.total) * 100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        No leave types configured for this company
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Contact your administrator to set up leave types
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documents
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Employee documentation
                  </p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc, index) => {
                    const IconComponent = doc.icon;
                    const isAvailable = documentAvailability[doc.type];
                    return (
                      <button
                        key={index}
                        onClick={() => handleDocumentView(doc.type)}
                        disabled={!isAvailable}
                        className={`group flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
                          isAvailable
                            ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
                            : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                              isAvailable
                                ? "bg-gray-100 group-hover:bg-blue-100"
                                : "bg-gray-200"
                            }`}
                          >
                            <IconComponent
                              className={`w-4 h-4 transition-colors duration-200 ${
                                isAvailable
                                  ? "text-gray-600 group-hover:text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <span
                              className={`text-sm font-medium transition-colors duration-200 ${
                                isAvailable
                                  ? "text-gray-700 group-hover:text-blue-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {doc.name}
                            </span>
                            {!isAvailable && (
                              <div className="text-xs text-gray-400">
                                Not available
                              </div>
                            )}
                          </div>
                        </div>
                        {isAvailable ? (
                          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsPopup;
