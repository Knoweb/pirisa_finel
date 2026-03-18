import React, { useState, useEffect, ChangeEvent } from "react";
import { FaSave, FaClock, FaEdit, FaMoneyCheck } from "react-icons/fa";

interface OTDetails {
  id?: number;
  company_start_time: string;
  company_end_time: string;
  normal_ot_rate: number;
  holiday_ot_rate: number;
  ot_cal: number;
  cmpId: number;
  totalTime?: number;
}

interface ApiResponse {
  "OT Details"?: OTDetails;
  Company?: OTDetails;
  resultCode?: number;
  resultDesc?: string;
  response?: {
    resultCode: number;
    resultDesc: string;
  };
}

const OTSetting: React.FC = () => {
  const cmpId = Number(localStorage.getItem("cmpnyId")) || 0;
  const [otDetails, setOtDetails] = useState<OTDetails | null>(null);
  const [editedDetails, setEditedDetails] = useState<OTDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract OTDetails from different response formats
  const extractOTDetails = (data: ApiResponse): OTDetails | null => {
    if (data?.Company) {
      return data.Company;
    }
    if (data?.["OT Details"]) {
      return data["OT Details"];
    }
    return null;
  };

  // Helper to check success status from different response formats
  const isSuccessResponse = (data: ApiResponse): boolean => {
    if (data.response?.resultCode === 100) return true;
    if (data.resultCode === 100) return true;
    return false;
  };

  // Save settings to API
  const saveSettings = async (settingsData: OTDetails) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token not found");
      return false;
    }

    try {
      const method = otDetails?.id ? "PUT" : "POST";
      const url = otDetails?.id
        ? `http://localhost:8080/companyOT/${cmpId}`
        : "http://localhost:8080/companyOT/add_OTDetails";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...settingsData,
          cmpId: cmpId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      const details = extractOTDetails(data);

      if (!isSuccessResponse(data)) {
        throw new Error(
          data.response?.resultDesc || data.resultDesc || "Operation failed"
        );
      }

      if (!details) {
        throw new Error("No OT details in response");
      }

      setOtDetails(details);
      return true;
    } catch (error) {
      console.error("Error saving OT settings:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save settings"
      );
      return false;
    }
  };

  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/companyOT/${cmpId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // If 404, no data exists - we'll show the form
        if (response.status === 404) {
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        const details = extractOTDetails(data);

        if (!isSuccessResponse(data)) {
          throw new Error(
            data.response?.resultDesc || data.resultDesc || "Operation failed"
          );
        }

        if (details) {
          setOtDetails(details);
          setEditedDetails(details);
        } else {
          throw new Error("No OT details in response");
        }
      } catch (error) {
        console.error("Error fetching OT settings:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load settings"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [cmpId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedDetails((prev) => ({
      ...(prev || {
        company_start_time: "",
        company_end_time: "",
        normal_ot_rate: 0,
        holiday_ot_rate: 0,
        ot_cal: 0,
        cmpId: cmpId,
      }),
      [name]:
        name.includes("ot_rate") || name === "ot_cal" ? Number(value) : value,
    }));
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedDetails((prev) => ({
      ...(prev || {
        company_start_time: "00:00:00",
        company_end_time: "00:00:00",
        normal_ot_rate: 0,
        holiday_ot_rate: 0,
        ot_cal: 0,
        cmpId: cmpId,
      }),
      [name]: value + ":00",
    }));
  };

  const handleSave = async () => {
    if (!editedDetails) return;

    setIsLoading(true);
    setError(null);

    const success = await saveSettings(editedDetails);
    if (success) {
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const handleEditClick = () => {
    setEditedDetails(otDetails);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedDetails(otDetails);
  };

  if (isLoading) {
    return (
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md text-center">
        Loading OT settings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md text-center text-red-500">
        {error}
      </div>
    );
  }

  // If no data exists, show empty form for initial setup
  if (!otDetails) {
    return (
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md transition hover:shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Initial OT Settings Setup
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Working Hours */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <FaClock /> Working Hours
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="company_start_time"
                  defaultValue="00:00"
                  onChange={handleTimeChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  step="900"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="company_end_time"
                  defaultValue="00:00"
                  onChange={handleTimeChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  step="900"
                />
              </div>
            </div>
          </div>

          {/* OT Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <FaMoneyCheck /> Overtime Settings
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Normal OT Rate
                </label>
                <input
                  type="number"
                  name="normal_ot_rate"
                  step="0.1"
                  min="1"
                  defaultValue={1.5}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Holiday OT Rate
                </label>
                <input
                  type="number"
                  name="holiday_ot_rate"
                  step="0.1"
                  min="1"
                  defaultValue={2.0}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  OT Calculation (Hours)
                </label>
                <input
                  type="number"
                  name="ot_cal"
                  min="1"
                  defaultValue={240}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FaSave /> {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    );
  }

  // Show existing data with edit option
  return (
    <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md transition hover:shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Company OT Settings
        </h3>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="text-sky-500 hover:text-sky-800 flex items-center gap-1 text-sm"
          >
            <FaEdit /> Edit Settings
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Working Hours */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaClock /> Working Hours
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Start Time
              </label>
              {isEditing ? (
                <input
                  type="time"
                  name="company_start_time"
                  value={
                    editedDetails?.company_start_time?.substring(0, 5) ||
                    "00:00"
                  }
                  onChange={handleTimeChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  step="900"
                />
              ) : (
                <div className="p-2 bg-gray-100 rounded">
                  {otDetails.company_start_time?.substring(0, 5) || "00:00"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                End Time
              </label>
              {isEditing ? (
                <input
                  type="time"
                  name="company_end_time"
                  value={
                    editedDetails?.company_end_time?.substring(0, 5) || "00:00"
                  }
                  onChange={handleTimeChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  step="900"
                />
              ) : (
                <div className="p-2 bg-gray-100 rounded">
                  {otDetails.company_end_time?.substring(0, 5) || "00:00"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OT Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaMoneyCheck /> Overtime Settings
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Normal OT Rate
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="normal_ot_rate"
                  step="0.1"
                  min="1"
                  value={editedDetails?.normal_ot_rate || 0}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <div className="p-2 bg-gray-100 rounded">
                  {otDetails.normal_ot_rate}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Holiday OT Rate
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="holiday_ot_rate"
                  step="0.1"
                  min="1"
                  value={editedDetails?.holiday_ot_rate || 0}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <div className="p-2 bg-gray-100 rounded">
                  {otDetails.holiday_ot_rate}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                OT Calculation (Hours)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="ot_cal"
                  min="1"
                  value={editedDetails?.ot_cal || 0}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <div className="p-2 bg-gray-100 rounded">
                  {otDetails.ot_cal} Hours
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FaSave /> {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
};

export default OTSetting;
