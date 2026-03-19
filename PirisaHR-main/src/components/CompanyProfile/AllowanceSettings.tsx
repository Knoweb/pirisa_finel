import React, { useState, useEffect, ChangeEvent } from "react";
import { FaEdit, FaSave, FaPlus, FaTrash, FaTag } from "react-icons/fa";
import axios from "axios";

// Define types
interface Allowance {
  id: number;
  name: string;
  epfEligibleStatus: string; // 'yes' or 'no'
}

interface EditFormData {
  name: string;
  epfEligibleStatus: string;
}

const AllowanceSettings: React.FC = () => {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    epfEligibleStatus: "yes",
  });
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newAllowance, setNewAllowance] = useState<EditFormData>({
    name: "",
    epfEligibleStatus: "yes",
  });

  // Helper function to get token
  const getToken = () => localStorage.getItem("token");
  const getCmpId = () => localStorage.getItem("cmpnyId");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(3); // Number of items per page

  // Fetch allowances on component mount
  useEffect(() => {
    fetchAllowances();
  }, []);

  // Fetch allowances from the API
  const fetchAllowances = async () => {
    const token = localStorage.getItem("token"); // Get token from localStorage
    const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage

    if (!token || !cmpId) {
      alert("Token or Company ID is missing. Please log in again.");
      return;
    }

    try {
      const response = await axios.get(
        `/api/allowance/company/${cmpId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API Response:", response); // Debug log

      if (
        response.status === 200 &&
        response.data &&
        response.data.resultCode === 100
      ) {
        // Map the API response to the Allowance type
        interface AllowanceItem {
          id: number;
          allowanceName: string;
          epfEligibleStatus: string;
        }

        const fetchedAllowances = response.data.AllowanceList.map(
          (item: AllowanceItem) => ({
            id: item.id,
            name: item.allowanceName,
            epfEligibleStatus: item.epfEligibleStatus,
          })
        );
        console.log("Mapped Allowances:", fetchedAllowances); // Debug log
        setAllowances(fetchedAllowances);
      } else {
        console.log("Invalid response:", response.data);
        alert('Failed to fetch allowances. Invalid response.');
      }
    } catch (error) {
      console.error("Error fetching allowances:", error);
      alert('An error occurred while fetching allowances.');
    }
  };

  // Handle clicking on an allowance to edit
  const handleEditClick = (allowance: Allowance): void => {
    setEditingId(allowance.id);
    setEditFormData({
      name: allowance.name,
      epfEligibleStatus: allowance.epfEligibleStatus,
    });
  };

  // Handle input changes while editing
  const handleEditChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Handle saving edited allowance
  const handleSaveClick = async (): Promise<void> => {
    const token = getToken();
    const cmpId = getCmpId();

    if (!token || !cmpId) {
      alert("Token or Company ID is missing. Please log in again.");
      return;
    }

    try {
      const payload = {
        id: editingId,
        allowanceName: editFormData.name,
        epfEligibleStatus: editFormData.epfEligibleStatus,
        cmpId: parseInt(cmpId, 10),
      };

      console.log("Update Payload:", payload); // Debug log

      const response = await axios.put(
        "/api/allowance/update_allowance",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Update Response:", response); // Debug log

      if (response.status === 200) {
        console.log("Update successful, refreshing list...");
        await fetchAllowances(); // Refresh the list
        console.log("List refreshed after update");
        setEditingId(null);
      } else {
        console.log("Update Failed:", response);
        alert("Failed to update allowance.");
      }
    } catch (error) {
      console.error("Error updating allowance:", error);
      alert("An error occurred while updating the allowance.");
    }
  };

  // Handle adding new allowance
  const handleAddNewClick = (): void => {
    setIsAddingNew(true);
  };

  // Handle input changes for new allowance
  const handleNewAllowanceChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setNewAllowance({
      ...newAllowance,
      [name]: value,
    });
  };

  // Handle saving new allowance
  const handleAddSave = async (): Promise<void> => {
    if (newAllowance.name.trim() !== "") {
      const token = localStorage.getItem("token"); // Get token from localStorage
      const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage

      if (!token || !cmpId) {
        alert("Token or Company ID is missing. Please log in again.");
        return;
      }

      const payload = {
        allowanceName: newAllowance.name,
        epfEligibleStatus: newAllowance.epfEligibleStatus,
        cmpId: parseInt(cmpId, 10),
      };

      console.log("Add Payload:", payload); // Debug log

      try {
        const response = await axios.post(
          "/api/allowance/add_allowance",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Add Response:", response); // Debug log

        if (response.status === 200) {
          // Refresh the list of allowances after adding a new one
          fetchAllowances();
          setNewAllowance({ name: "", epfEligibleStatus: "yes" });
          setIsAddingNew(false);
        } else {
          console.log("Add Failed:", response);
          alert("Failed to save the new allowance.");
        }
      } catch (error) {
        console.error("Error saving new allowance:", error);
        alert("An error occurred while saving the new allowance.");
      }
    }
  };

  // Handle canceling add or edit
  const handleCancel = (): void => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  // Handle deleting allowance
  const handleDeleteClick = async (id: number): Promise<void> => {
    if (confirm("Are you sure you want to delete this allowance?")) {
      const token = getToken();

      if (!token) {
        alert("Token is missing. Please log in again.");
        return;
      }

      try {
        console.log("Deleting allowance with ID:", id);
        const response = await axios.delete(
          `/api/allowance/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Delete Response:", response);

        if (response.status === 200) {
          console.log("Delete successful, refreshing list...");
          await fetchAllowances(); // Refresh the list
          console.log("List refreshed after delete");
        } else {
          console.log("Delete Failed:", response);
          alert("Failed to delete allowance.");
        }
      } catch (error) {
        console.error("Error deleting allowance:", error);
        alert("An error occurred while deleting the allowance.");
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(allowances.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentAllowances = allowances.slice(indexOfFirstItem, indexOfLastItem);

  const renderPaginationButtons = () => {
    const buttons = [];
    const prevPage = currentPage - 1;
    const nextPage = currentPage + 1;

    // Always show the current page
    buttons.push(
      <button
        key={currentPage}
        onClick={() => setCurrentPage(currentPage)}
        className={`px-4 py-2 mx-1 text-sm ${
          currentPage === currentPage
            ? "bg-sky-500 text-white"
            : "bg-gray-200 text-gray-700"
        } rounded hover:bg-sky-600`}
      >
        {currentPage}
      </button>
    );

    // Show the previous page if it exists
    if (prevPage >= 1) {
      buttons.unshift(
        <button
          key={prevPage}
          onClick={() => setCurrentPage(prevPage)}
          className={`px-4 py-2 mx-1 text-sm ${
            currentPage === prevPage
              ? "bg-sky-500 text-white"
              : "bg-gray-200 text-gray-700"
          } rounded hover:bg-sky-600`}
        >
          {prevPage}
        </button>
      );
    }

    // Show the next page if it exists
    if (nextPage <= totalPages) {
      buttons.push(
        <button
          key={nextPage}
          onClick={() => setCurrentPage(nextPage)}
          className={`px-4 py-2 mx-1 text-sm ${
            currentPage === nextPage
              ? "bg-sky-500 text-white"
              : "bg-gray-200 text-gray-700"
          } rounded hover:bg-sky-600`}
        >
          {nextPage}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md transition hover:shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Allowances</h3>
        <button
          onClick={handleAddNewClick}
          className="text-sky-500 hover:text-sky-800 flex items-center gap-1 text-sm"
        >
          <FaPlus /> Add New Allowance
        </button>
      </div>

      {/* Check if allowances array is empty */}
      {allowances.length === 0 && !isAddingNew ? (
        <div className="mt-4 text-center text-gray-500">
          No data added yet. Click "Add New Allowance" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {currentAllowances.map((allowance) => (
            <div
              key={allowance.id}
              className="border border-gray-200 rounded-md p-4 hover:border-sky-300 transition"
            >
              {editingId === allowance.id ? (
                // Edit mode
                <>
                  <div className="mb-2">
                    <label className="text-gray-500 text-sm flex items-center gap-1">
                      <FaTag /> Allowance Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="w-full p-1.5 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="text-gray-500 text-sm flex items-center gap-1">
                      EPF Eligible
                    </label>
                    <div className="flex gap-4 mt-1">
                      <label>
                        <input
                          type="radio"
                          name="epfEligibleStatus"
                          value="yes"
                          checked={editFormData.epfEligibleStatus === "yes"}
                          onChange={handleEditChange}
                        />{" "}
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="epfEligibleStatus"
                          value="no"
                          checked={editFormData.epfEligibleStatus === "no"}
                          onChange={handleEditChange}
                        />{" "}
                        No
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveClick}
                      className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <FaSave /> Save
                    </button>
                  </div>
                </>
              ) : (
                // View mode
                <>
                  <div>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <FaTag /> Allowance Name
                    </p>
                    <p className="text-gray-900 font-medium">
                      {allowance.name}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      EPF Eligible Status
                    </p>
                    <p className="text-gray-900 font-medium">
                      {allowance.epfEligibleStatus === "yes" ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="mt-3 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handleEditClick(allowance)}
                      className="text-sky-500 hover:text-sky-800 flex items-center gap-1 text-sm"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(allowance.id)}
                      className="text-red-500 hover:text-red-800 flex items-center gap-1 text-sm"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new allowance form */}
          {isAddingNew && (
            <div className="border border-sky-300 rounded-md p-4 bg-blue-50">
              <div className="mb-2">
                <label className="text-gray-500 text-sm flex items-center gap-1">
                  <FaTag /> Allowance Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newAllowance.name}
                  onChange={handleNewAllowanceChange}
                  className="w-full p-1.5 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter allowance name"
                />
              </div>
              <div className="mb-2">
                <label className="text-gray-500 text-sm flex items-center gap-1">
                  EPF Eligible Status
                </label>
                <div className="flex gap-4 mt-1">
                  <label>
                    <input
                      type="radio"
                      name="epfEligibleStatus"
                      value="yes"
                      checked={newAllowance.epfEligibleStatus === "yes"}
                      onChange={handleNewAllowanceChange}
                    />{" "}
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="epfEligibleStatus"
                      value="no"
                      checked={newAllowance.epfEligibleStatus === "no"}
                      onChange={handleNewAllowanceChange}
                    />{" "}
                    No
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSave}
                  className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-1"
                >
                  <FaSave /> Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {allowances.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          {renderPaginationButtons()}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AllowanceSettings;
