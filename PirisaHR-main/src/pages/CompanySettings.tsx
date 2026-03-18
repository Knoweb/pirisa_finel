import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CompanyDetails {
  cmp_name?: string;
  cmp_address?: string;
  cmpEmail?: string;
  cmp_phone?: string;
  username?: string;
  cmp_reg_no?: string;
  tin_no?: string;
  vat_no?: string;
}

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // State for form inputs
  const [formData, setFormData] = useState<CompanyDetails>({
    cmp_name: "",
    cmp_address: "",
    cmpEmail: "",
    username: "",
    cmp_phone: "",
    cmp_reg_no: "",
    tin_no: "",
    vat_no: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");

      if (!token || !cmpId) {
        setError("Authentication token or Company ID not found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/company/companyDetails/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch company data");
        }

        const data = await response.json();
        if (data.resultCode === 100 && data.CompanyDetails?.length > 0) {
          const companyDetails = data.CompanyDetails[0];
          // Removed setCompanyData as companyData state is no longer used
          setFormData({
            cmp_name: companyDetails.cmp_name || "",
            cmp_address: companyDetails.cmp_address || "",
            cmpEmail: companyDetails.cmpEmail || "",
            username: companyDetails.username || "",
            cmp_phone: companyDetails.cmp_phone || "",
            cmp_reg_no: companyDetails.cmp_reg_no || "",
            tin_no: companyDetails.tin_no || "",
            vat_no: companyDetails.vat_no || "",
          });
        }

        // Fetch existing logo
        const logoResponse = await fetch(
          `http://localhost:8080/logo/view/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (logoResponse.ok) {
          const blob = await logoResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setLogoPreview(imageUrl);
        }
      } catch (err) {
        setError("Error fetching company data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    const cmpId = localStorage.getItem("cmpnyId");

    if (!token || !cmpId) {
      setError("Authentication token or Company ID not found");
      return;
    }

    try {
      // Update company details
      const response = await fetch(
        `http://localhost:8080/company/${cmpId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update company data");
      }

      // Upload logo if a new one is selected
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("comId", cmpId);
        logoFormData.append("logo", logoFile);

        const logoResponse = await fetch(
          "http://localhost:8080/logo/upload",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: logoFormData,
          }
        );

        if (!logoResponse.ok) {
          throw new Error("Failed to upload logo");
        }
      }

      toast.success("Company details updated successfully");
    } catch (err) {
      setError("Error updating company data");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className=" w-full max-w-full mx-auto transition-all duration-500 -mt-10">
        <div className="bg-gray-50 p-8 rounded-lg shadow-md w-full mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Edit Company Details
            </h2>
            <button
              onClick={() => navigate("/companyProfile")}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Back to Profile
            </button>
          </div>

          {/* Company Logo Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <img
                className="w-32 h-32 rounded-full border-4 border-gray-300 object-cover"
                src={logoPreview || "https://via.placeholder.com/150"}
                alt="Company Logo"
              />
              <label
                htmlFor="logo-upload"
                className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full cursor-pointer hover:bg-sky-600 transition"
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
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">Click camera icon to change logo</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FaBuilding /> Company Name
              </label>
              <input
                type="text"
                name="cmp_name"
                value={formData.cmp_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                name="cmpEmail"
                value={formData.cmpEmail}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FaUser /> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FaPhone /> Phone No.
              </label>
              <input
                type="tel"
                name="cmp_phone"
                value={formData.cmp_phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                <FaMapMarkerAlt /> Address
              </label>
              <input
                type="text"
                name="cmp_address"
                value={formData.cmp_address}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm mb-1">
                Company Registration No.
              </label>
              <input
                type="text"
                name="cmp_reg_no"
                value={formData.cmp_reg_no}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm mb-1">VAT No.</label>
              <input
                type="text"
                name="vat_no"
                value={formData.vat_no}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm mb-1">TIN No.</label>
              <input
                type="text"
                name="tin_no"
                value={formData.tin_no}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => navigate("/companyProfile")}
                className="ml-4 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CompanySettings;
