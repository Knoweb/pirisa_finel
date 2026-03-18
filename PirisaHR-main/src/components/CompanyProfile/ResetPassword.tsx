import { useState } from "react";
import { FaEye, FaEyeSlash, FaArrowLeft, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PasswordResetFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiResponse {
  resultCode: number;
  resultDesc: string;
}

const PasswordReset = () => {
  const [formData, setFormData] = useState<PasswordResetFormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match");
      return false;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (!/[A-Z]/.test(formData.newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return false;
    }
    if (!/[0-9]/.test(formData.newPassword)) {
      toast.error("Password must contain at least one number");
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(formData.newPassword)) {
      toast.error("Password must contain at least one special character");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const cmpId = localStorage.getItem("cmpnyId");
      const empId = localStorage.getItem("empId");

      if (!token) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      // Determine API endpoint based on role
      let apiUrl = "";
      const requestBody = {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      };

      if (role === "EMPLOYEE" && empId) {
        apiUrl = `/employee/changePassword/${empId}`;
      } else if (role === "CMPNY" && cmpId) {
        apiUrl = `/company/changePassword/${cmpId}`;
      } else {
        throw new Error("Invalid user role or missing ID");
      }

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || data.resultCode !== 100) {
        throw new Error(data.resultDesc || "Password update failed");
      }

      toast.success("Password updated successfully!");

      // Clear sensitive data and redirect
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Optionally log out after password change
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
      console.error("Password reset error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md transition hover:shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
        <button
          onClick={() => navigate(-1)}
          className="text-sky-500 hover:text-sky-800 flex items-center gap-1 text-sm"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                name="oldPassword"
                type={showPasswords.old ? "text" : "password"}
                value={formData.oldPassword}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("old")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.old ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Password Requirements
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li
              className={
                formData.newPassword.length >= 8 ? "text-green-600" : ""
              }
            >
              {formData.newPassword.length >= 8 ? "✓" : "•"} At least 8
              characters
            </li>
            <li
              className={
                /[A-Z]/.test(formData.newPassword) ? "text-green-600" : ""
              }
            >
              {/[A-Z]/.test(formData.newPassword) ? "✓" : "•"} 1 uppercase
              letter
            </li>
            <li
              className={
                /[0-9]/.test(formData.newPassword) ? "text-green-600" : ""
              }
            >
              {/[0-9]/.test(formData.newPassword) ? "✓" : "•"} 1 number
            </li>
            <li
              className={
                /[^A-Za-z0-9]/.test(formData.newPassword)
                  ? "text-green-600"
                  : ""
              }
            >
              {/[^A-Za-z0-9]/.test(formData.newPassword) ? "✓" : "•"} 1 special
              character
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FaSave /> {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordReset;
