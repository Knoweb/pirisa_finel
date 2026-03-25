import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaStar,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  interface CompanyDetails {
    cmp_name?: string;
    cmp_address?: string;
    cmpEmail?: string;
    cmp_phone?: string;
    username?: string;
    cmp_reg_no?: string;
    tin_no?: string;
    vat_no?: string;
    package_name?: string;
    company_status?: string;
    joinedAt?: string;
    industryType?: string;
    factoryAddress?: string;
  }


  const [companyData, setCompanyData] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyData = async () => {
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");

      console.log("DEBUG - localStorage values:", { token: token ? "exists" : "null", cmpId });

      if (!token || !cmpId) {
        console.error("Token or Company ID not found in localStorage");
        setLoading(false);
        return;
      }

      try {
        // Fetch company details
        const companyResponse = await fetch(
          `/api/company/companyDetails/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!companyResponse.ok) {
          throw new Error("Failed to fetch company data");
        }

        const companyData = await companyResponse.json();
        console.log("DEBUG - Company API Response:", companyData);
        if (
          companyData.resultCode === 100 &&
          companyData.CompanyDetails?.length > 0
        ) {
          console.log("DEBUG - Setting company data:", companyData.CompanyDetails[0]);
          setCompanyData(companyData.CompanyDetails[0]);
        } else {
          console.log("DEBUG - No company data found or invalid response");
        }

        // Fetch logo
        const logoResponse = await fetch(
          `/api/logo/view/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (logoResponse.ok) {
          const blob = await logoResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setLogoUrl(imageUrl);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleSettingsClick = () => {
    navigate("/company-settings");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row gap-6 pt-6">
        {/* Profile Card */}
        <div className="w-full lg:w-1/3 flex flex-col items-center bg-gray-50 p-6 rounded-lg shadow-md transition hover:scale-105">
          <img
            className="w-24 h-24 rounded-full border-4 border-gray-300 hover:border-gray-400 transition"
            src={logoUrl || "https://via.placeholder.com/150"}
            alt="Company Logo"
          />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 hover:text-gray-700 transition">
            {companyData?.cmp_name || "Company Name"}
          </h2>
          <p className="text-gray-500 text-sm text-center flex items-center gap-1">
            <FaMapMarkerAlt /> {companyData?.cmp_address || "Company Address"}
          </p>
          <button
            onClick={handleSettingsClick}
            className="mt-3 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition text-sm"
          >
            Change Settings
          </button>
        </div>

        {/* Company Info */}
        <div className="w-full lg:w-2/3 bg-gray-50 p-6 rounded-lg shadow-md transition hover:shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <FaBuilding /> Company Name
              </p>
              <p className="text-gray-900 font-medium">
                {companyData?.cmp_name || "Company Name"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <FaEnvelope /> Email
              </p>
              <p className="text-gray-900 font-medium">
                {companyData?.cmpEmail}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <FaPhone /> Phone No.
              </p>
              <p className="text-gray-900 font-medium">
                {companyData?.cmp_phone}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">
                <FaUser />
                User Name
              </p>
              <p className="text-gray-900 font-medium">
                {companyData?.username}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Company Category</p>
              <p className="text-gray-900 font-medium">{companyData?.industryType || "General"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md transition hover:shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          Additional Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-gray-500 text-sm">Company Registration No.</p>
            <p className="text-gray-900 font-medium">
              {companyData?.cmp_reg_no}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">VAT No.</p>
            <p className="text-gray-900 font-medium">{companyData?.vat_no}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">TIN No.</p>
            <p className="text-gray-900 font-medium">{companyData?.tin_no}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <FaMapMarkerAlt /> Company Registered Address
            </p>
            <p className="text-gray-900 font-medium">
              {companyData?.cmp_address}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Company Factory Address</p>
            <p className="text-gray-900 font-medium">{companyData?.factoryAddress || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <FaGlobe /> Package
            </p>
            <p className="text-gray-900 font-medium">
              {companyData?.package_name}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <FaStar /> Status
            </p>
            <p className="text-gray-900 font-medium">
              {companyData?.company_status}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <FaCalendarAlt /> Date Joined
            </p>
            <p className="text-gray-900 font-medium">
              {companyData?.joinedAt ? new Date(companyData.joinedAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
