/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

interface Unit {
  id: number;
  dpt_name: string;
  dpt_code: string;
  dpt_desc: string;
  cmpId: number;
  designationList: Designation[];
}

interface Designation {
  id: number;
  designation: string;
  dptId: number;
}

interface ApiResponse {
  UnitList: Unit[];
  resultCode: number;
  resultDesc: string;
}

const UnitDesignationManager = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [currentUnit, setCurrentUnit] =
    useState<Partial<Unit> | null>(null);
  const [currentDesignation, setCurrentDesignation] = useState<{
    designation: string;
    dptId: number;
  }>({
    designation: "",
    dptId: 1,
  });
  const [expandedUnit, setExpandedUnit] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get company ID from localStorage
  const getCompanyId = (): number => {
    const cmpnyId = localStorage.getItem("cmpnyId");
    return cmpnyId ? parseInt(cmpnyId) : 1; // Default to 1 if not found
  };

  // Get token from localStorage
  const getToken = (): string => {
    return localStorage.getItem("token") || "";
  };

  // Fetch units and designations
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const cmpId = getCompanyId();
      const response = await axios.get<ApiResponse>(
        `/api/department/company/${cmpId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      //console.log("API Response:", response.data);

      if (
        response.data.resultCode === 100 &&
        Array.isArray(response.data.UnitList)
      ) {
        setUnits(response.data.UnitList);
      } else {
        setError(response.data.resultDesc || "Failed to fetch units");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Treat 404 as "no units" rather than an error
        setUnits([]);
      } else {
        setError("Error fetching units. Please try again later.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add new department
  const addUnit = async (departmentData: Partial<Unit>) => {
    try {
      const cmpId = getCompanyId();
      const payload = {
        dpt_name: departmentData.dpt_name,
        dpt_code: departmentData.dpt_code,
        cmpId: cmpId,
        dpt_desc: departmentData.dpt_desc || "",
      };

      const response = await axios.post(
        "/api/department/add_department",
        payload,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (response.status === 200) {
        await fetchUnits(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding unit:", err);
      setError("Failed to add unit. Please try again.");
      return false;
    }
  };

  // Update existing department
  const updateUnit = async (departmentData: Partial<Unit>) => {
    try {
      if (!departmentData.id) return false;

      const payload = {
        id: departmentData.id,
        dpt_name: departmentData.dpt_name,
        dpt_code: departmentData.dpt_code,
        cmpId: getCompanyId(),
        dpt_desc: departmentData.dpt_desc || "",
      };

      const response = await axios.post(
        "/api/department/update_department",
        payload,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (response.status === 200) {
        await fetchUnits(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating unit:", err);
      setError("Failed to update unit. Please try again.");
      return false;
    }
  };

  // Delete department
  const deleteUnit = async (id: number) => {
    try {
      const response = await axios.delete(
        `/api/department/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (response.status === 200) {
        await fetchUnits(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting unit:", err);
      setError("Failed to delete unit. Please try again.");
      return false;
    }
  };

  // Add new designation
  const addDesignation = async (designationData: {
    designation: string;
    dptId: number;
  }) => {
    try {
      const response = await axios.post(
        "/api/designation/add_designation",
        designationData,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (response.status === 200) {
        await fetchUnits(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding designation:", err);
      setError("Failed to add designation. Please try again.");
      return false;
    }
  };

  // Delete designation
  const deleteDesignation = async (id: number) => {
    try {
      const response = await axios.delete(
        `/api/designation/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (response.status === 200) {
        await fetchUnits(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting designation:", err);
      setError("Failed to delete designation. Please try again.");
      return false;
    }
  };

  // Load units on component mount
  useEffect(() => {
    fetchUnits();
  }, []);

  // Unit Modal Functions
  const handleOpenUnitModal = (dept: Unit | null = null) => {
    if (dept) {
      setCurrentUnit({
        id: dept.id,
        dpt_name: dept.dpt_name,
        dpt_code: dept.dpt_code,
        dpt_desc: dept.dpt_desc,
      });
    } else {
      setCurrentUnit({ dpt_name: "", dpt_code: "", dpt_desc: "" });
    }
    setShowUnitModal(true);
  };

  const handleCloseUnitModal = () => {
    setCurrentUnit(null);
    setShowUnitModal(false);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnit?.dpt_name || !currentUnit?.dpt_code) return;

    let success = false;
    if (currentUnit.id) {
      success = await updateUnit(currentUnit);
    } else {
      success = await addUnit(currentUnit);
    }

    if (success) {
      handleCloseUnitModal();
    }
  };

  // Designation Modal Functions
  const handleOpenDesignationModal = (departmentId: number) => {
    setCurrentDesignation({ designation: "", dptId: departmentId });
    setShowDesignationModal(true);
  };

  const handleCloseDesignationModal = () => {
    setShowDesignationModal(false);
  };

  const handleDesignationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDesignation.designation) return;

    const success = await addDesignation(currentDesignation);
    if (success) {
      handleCloseDesignationModal();
    }
  };

  const toggleUnitExpand = (id: number) => {
    setExpandedUnit(expandedUnit === id ? null : id);
  };

  const handleDeleteUnit = async (id: number) => {
    if (
      confirm(
        "Are you sure you want to delete this unit? All associated designations will also be deleted."
      )
    ) {
      await deleteUnit(id);
    }
  };

  const handleDeleteDesignation = async (id: number) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      await deleteDesignation(id);
    }
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
        <button
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => {
            setError("");
            fetchUnits();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Unit & Designation Management
        </h1>
        <button
          onClick={() => handleOpenUnitModal()}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Unit
        </button>
      </div>

      {/* Unit List */}
      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-700">
            No units found
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add your first unit to get started.
          </p>
          <button
            onClick={() => handleOpenUnitModal()}
            className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
          >
            Add Unit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => toggleUnitExpand(dept.id)}
              >
                <div>
                  <h2 className="text-lg font-medium text-gray-800">
                    {dept.dpt_name}
                  </h2>
                  <p className="text-sm text-gray-500">Code: {dept.dpt_code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenUnitModal(dept);
                    }}
                    className="p-1 text-sky-500 hover:text-sky-600"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUnit(dept.id);
                    }}
                    className="p-1 text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Designations section (expandable) */}
              {expandedUnit === dept.id && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-medium text-gray-700">
                      Designations
                    </h3>
                    <button
                      onClick={() => handleOpenDesignationModal(dept.id)}
                      className="flex items-center px-3 py-1 bg-sky-500 text-white text-sm rounded hover:bg-sky-600 transition-colors"
                    >
                      <PlusCircleIcon className="w-4 h-4 mr-1" />
                      Add Designation
                    </button>
                  </div>

                  {dept.designationList && dept.designationList.length > 0 ? (
                    <div className="space-y-2">
                      {dept.designationList.map((desig) => (
                        <div
                          key={desig.id}
                          className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                        >
                          <span className="text-gray-700">
                            {desig.designation}
                          </span>
                          <button
                            onClick={() => handleDeleteDesignation(desig.id)}
                            className="p-1 text-red-500 hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No designations found
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">
              {currentUnit?.id ? "Edit Unit" : "Add New Unit"}
            </h2>
            <form onSubmit={handleUnitSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={currentUnit?.dpt_name || ""}
                    onChange={(e) =>
                      setCurrentUnit((prev) => ({
                        ...prev!,
                        dpt_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={currentUnit?.dpt_code || ""}
                    onChange={(e) =>
                      setCurrentUnit((prev) => ({
                        ...prev!,
                        dpt_code: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                    rows={3}
                    value={currentUnit?.dpt_desc || ""}
                    onChange={(e) =>
                      setCurrentUnit((prev) => ({
                        ...prev!,
                        dpt_desc: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseUnitModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  {currentUnit?.id ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {showDesignationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Add New Designation</h2>
            <form onSubmit={handleDesignationSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={currentDesignation.dptId}
                    onChange={(e) =>
                      setCurrentDesignation((prev) => ({
                        ...prev,
                        dptId: Number(e.target.value),
                      }))
                    }
                    required
                  >
                    {units.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.dpt_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={currentDesignation.designation}
                    onChange={(e) =>
                      setCurrentDesignation((prev) => ({
                        ...prev,
                        designation: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseDesignationModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitDesignationManager;
