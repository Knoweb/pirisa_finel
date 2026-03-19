import { useState, useEffect } from "react";
import { FaCalendarAlt, FaPaperPlane } from "react-icons/fa";
import Loading from "../components/Loading/Loading";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface LeaveRequestForm {
  leaveType: string;
  leaveStartDay: string;
  leaveEndDay: string;
  leaveReason: string;
  empId: number;
}

interface CompanyLeaveType {
  id: number;
  leaveType: string;
  amount: number;
  cmpId: number;
}

function EmployeeLeaveRequest() {
  const [formData, setFormData] = useState<LeaveRequestForm>({
    leaveType: "",
    leaveStartDay: "",
    leaveEndDay: "",
    leaveReason: "",
    empId: 0,
  });
  const [leaveTypes, setLeaveTypes] = useState<CompanyLeaveType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");

      if (!token || !cmpId) {
        setError("Authentication required. Please log in again.");
        setIsLoadingLeaveTypes(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/company_leave/company/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // if (!response.ok) {
        //   throw new Error("Failed to fetch leave types");
        // }

        const data = await response.json();
        if (data.resultCode === 100 && data.LeavetList) {
          setLeaveTypes(data.LeavetList);
        } else {
          // throw new Error(data.resultDesc || "No leave types found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leave types"
        );
      } finally {
        setIsLoadingLeaveTypes(false);
      }
    };

    const empId = localStorage.getItem("empId");
    if (empId) {
      setFormData((prev) => ({ ...prev, empId: parseInt(empId) }));
    }

    fetchLeaveTypes();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convert to ISO format with time (00:00 for start, 23:59 for end)
    const dateValue =
      name === "leaveStartDay" ? `${value}T00:00:00` : `${value}T23:59:59`;

    setFormData((prev) => ({ ...prev, [name]: dateValue }));
  };

  const validateForm = () => {
    if (!formData.leaveType) {
      setError("Please select a leave type");
      return false;
    }
    if (!formData.leaveStartDay) {
      setError("Please select a start date");
      return false;
    }
    if (!formData.leaveEndDay) {
      setError("Please select an end date");
      return false;
    }
    if (new Date(formData.leaveStartDay) > new Date(formData.leaveEndDay)) {
      setError("End date must be after start date");
      return false;
    }
    if (!formData.leaveReason || formData.leaveReason.trim().length < 10) {
      setError("Please provide a reason (minimum 10 characters)");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/emp_leave/add_leave",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit leave request");
      }

      // Show success toast
      toast.success("Leave request submitted successfully!");

      // Reset form
      setFormData({
        leaveType: "",
        leaveStartDay: "",
        leaveEndDay: "",
        leaveReason: "",
        empId: formData.empId,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while submitting the request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  return (
    <div>
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Leave Request Form
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}

            {/* Leave Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="leaveType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Leave Type <span className="text-red-500">*</span>
                </label>
                {isLoadingLeaveTypes ? (
                  <div className="flex items-center space-x-2">
                    <Loading size="sm" />
                    <span>Loading leave types...</span>
                  </div>
                ) : (
                  <select
                    id="leaveType"
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    disabled={leaveTypes.length === 0}
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.leaveType}>
                        {type.leaveType}
                      </option>
                    ))}
                  </select>
                )}
                {leaveTypes.length === 0 && !isLoadingLeaveTypes && (
                  <p className="text-sm text-red-500 mt-1">
                    No leave types available
                  </p>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="leaveStartDay"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="leaveStartDay"
                    name="leaveStartDay"
                    value={formData.leaveStartDay.split("T")[0]}
                    onChange={handleDateChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="leaveEndDay"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="leaveEndDay"
                    name="leaveEndDay"
                    value={formData.leaveEndDay.split("T")[0]}
                    onChange={handleDateChange}
                    min={formData.leaveStartDay.split("T")[0]}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Selected Dates Preview */}
            {(formData.leaveStartDay || formData.leaveEndDay) && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  {formData.leaveStartDay && formData.leaveEndDay
                    ? `Your leave will be from ${formatDisplayDate(
                        formData.leaveStartDay
                      )} to ${formatDisplayDate(formData.leaveEndDay)}`
                    : formData.leaveStartDay
                    ? `Your leave will start on ${formatDisplayDate(
                        formData.leaveStartDay
                      )}`
                    : `Your leave will end on ${formatDisplayDate(
                        formData.leaveEndDay
                      )}`}
                </p>
              </div>
            )}

            {/* Leave Reason */}
            <div>
              <label
                htmlFor="leaveReason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="leaveReason"
                name="leaveReason"
                value={formData.leaveReason}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Please provide details about your leave request..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters required
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || leaveTypes.length === 0}
                className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-md flex items-center disabled:bg-sky-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EmployeeLeaveRequest;
