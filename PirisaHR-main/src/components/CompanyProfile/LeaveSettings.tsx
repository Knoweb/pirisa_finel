import React, { useState, useEffect, ChangeEvent } from "react";
import { FaEdit, FaSave, FaPlus, FaCalendarAlt, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../Loading/Loading"; // Adjust the path as needed

// Define types
interface LeaveType {
  id: number;
  leaveType: string;
  amount: number;
  cmpId: number;
}

interface EditFormData {
  leaveType: string;
  amount: number;
}

const LeaveSettings: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    leaveType: "",
    amount: 0,
  });
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newLeaveType, setNewLeaveType] = useState<EditFormData>({
    leaveType: "",
    amount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true); // Loading state for fetching data
  const [savingEdit, setSavingEdit] = useState<boolean>(false); // Loading state for editing
  const [savingNew, setSavingNew] = useState<boolean>(false); // Loading state for adding new

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(3); // Number of items per page

  // Fetch leave types from API
  const fetchLeaveTypes = async () => {
    const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage
    const token = localStorage.getItem("token"); // Get token from localStorage

    if (!cmpId || !token) {
      toast.error("Missing company ID or token. Please log in again.");
      setLoading(false);
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

      if (!response.ok) {
        throw new Error(
            `Failed to fetch leave types: ${response.statusText}`
        );
      }

      const data = await response.json();
      //console.log("API Response:", data); // Debug log
      if (data.resultCode === 100 && Array.isArray(data.LeavetList)) {
        setLeaveTypes(data.LeavetList);
      } else {
        throw new Error("Unexpected response format or result code");
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
      // toast.error("Failed to fetch leave types. Please try again.");
      setLeaveTypes([]); // Ensure state is reset on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave types from API
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // Handle clicking on a leave type to edit
  const handleEditClick = (leaveType: LeaveType): void => {
    setEditingId(leaveType.id);
    setEditFormData({
      leaveType: leaveType.leaveType,
      amount: leaveType.amount,
    });
  };

  // Handle input changes while editing
  const handleEditChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === "amount" ? Number(value) : value,
    });
  };

  // Handle saving edited leave type
  const handleSaveClick = async (): Promise<void> => {
    const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage
    const token = localStorage.getItem("token"); // Get token from localStorage

    if (!cmpId || !token) {
      toast.error("Missing company ID or token. Please log in again.");
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(
          `/api/company_leave/update_leave`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: editingId,
              leaveType: editFormData.leaveType,
              amount: editFormData.amount,
              cmpId: cmpId,
            }),
          }
      );

      if (!response.ok) {
        throw new Error("Failed to update leave type");
      }

      const updatedLeaveTypes = leaveTypes.map((leaveType) =>
          leaveType.id === editingId
              ? { ...leaveType, ...editFormData }
              : leaveType
      );
      setLeaveTypes(updatedLeaveTypes);
      setEditingId(null);
      toast.success("Leave type updated successfully!");
      
      // Refetch to ensure data consistency
      setTimeout(() => {
        fetchLeaveTypes();
      }, 500);
    } catch (error) {
      console.error("Error updating leave type:", error);
      toast.error("Failed to update leave type. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle adding new leave type
  const handleAddNewClick = (): void => {
    setIsAddingNew(true);
  };

  // Handle input changes for new leave type
  const handleNewLeaveTypeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setNewLeaveType({
      ...newLeaveType,
      [name]: name === "amount" ? Number(value) : value,
    });
  };

  // Handle saving new leave type
  const handleAddSave = async (): Promise<void> => {
    if (newLeaveType.leaveType.trim() === "") {
      toast.error("Leave type cannot be empty.");
      return;
    }

    const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage
    const token = localStorage.getItem("token"); // Get token from localStorage

    if (!cmpId || !token) {
      toast.error("Missing company ID or token. Please log in again.");
      return;
    }

    setSavingNew(true);
    try {
      const response = await fetch(
          `/api/company_leave/add_leave`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              leaveType: newLeaveType.leaveType,
              amount: newLeaveType.amount,
              cmpId: cmpId,
            }),
          }
      );

      if (!response.ok) {
        throw new Error("Failed to add leave type");
      }

      const data = await response.json();
      
      // Extract the new leave type from the API response
      const newLeave = data.Add_CompanyLeave || data;
      
      // Update state with the new leave type from API response
      setLeaveTypes(prev => [...prev, newLeave]);
      setNewLeaveType({ leaveType: "", amount: 0 });
      setIsAddingNew(false);
      toast.success("Leave type added successfully!");
      
      // Refetch to ensure data consistency
      setTimeout(() => {
        fetchLeaveTypes();
      }, 500);
    } catch (error) {
      console.error("Error adding leave type:", error);
      toast.error("Failed to add leave type. Please try again.");
    } finally {
      setSavingNew(false);
    }
  };

  // Handle canceling add or edit
  const handleCancel = (): void => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  // Handle deleting a leave type
  const handleDelete = async (id: number): Promise<void> => {
    const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage
    const token = localStorage.getItem("token"); // Get token from localStorage

    if (!cmpId || !token) {
      toast.error("Missing company ID or token. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
          `/api/company_leave/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      if (!response.ok) {
        throw new Error("Failed to delete leave type");
      }

      setLeaveTypes((prevLeaveTypes) =>
          prevLeaveTypes.filter((lt) => lt.id !== id)
      );
      toast.success("Leave type deleted successfully!");
      
      // Refetch to ensure data consistency
      setTimeout(() => {
        fetchLeaveTypes();
      }, 500);
    } catch (error) {
      console.error("Error deleting leave type:", error);
      toast.error("Failed to delete leave type. Please try again.");
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(leaveTypes.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentLeaveTypes = leaveTypes.slice(indexOfFirstItem, indexOfLastItem);

  // Function to generate pagination buttons
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
      <div className="mt-6 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md transition hover:shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Leave Types</h3>
          <button
              onClick={handleAddNewClick}
              className="text-sky-500 hover:text-sky-800 flex items-center gap-1 text-sm font-medium transition-colors"
              disabled={loading}
          >
            <FaPlus /> Add New Leave Type
          </button>
        </div>

        {loading ? (
            <div className="mt-4 flex justify-center">
              <Loading
                  size="md"
                  color="border-sky-500"
                  text="Loading leave types..."
              />
            </div>
        ) : leaveTypes.length === 0 && !isAddingNew ? (
            <div className="mt-4 text-center text-gray-500 p-8 bg-white rounded-lg border border-gray-200">
              <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-lg font-medium mb-2">No leave types yet</p>
              <p className="text-sm">Click "Add New Leave Type" to get started.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {currentLeaveTypes.map((leaveType) => (
                  <div
                      key={leaveType.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-sky-300 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  >
                    {editingId === leaveType.id ? (
                        // Edit mode
                        <>
                          <div className="mb-3">
                            <label className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-2">
                              <FaCalendarAlt className="text-sky-500" /> Leave Type
                            </label>
                            <input
                                type="text"
                                name="leaveType"
                                value={editFormData.leaveType}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                placeholder="Enter leave type"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-2">
                              <FaCalendarAlt className="text-sky-500" /> Days
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={editFormData.amount}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                                placeholder="Enter number of days"
                                min="0"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={savingEdit}
                            >
                              Cancel
                            </button>
                            <button
                                onClick={handleSaveClick}
                                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                                disabled={savingEdit}
                            >
                              {savingEdit ? (
                                  <>
                                    <Loading
                                        size="xs"
                                        color="border-white"
                                        className="inline"
                                    />
                                    Saving...
                                  </>
                              ) : (
                                  <>
                                    <FaSave /> Save
                                  </>
                              )}
                            </button>
                          </div>
                        </>
                    ) : (
                        // View mode
                        <>
                          <div className="mb-3">
                            <p className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-1">
                              <FaCalendarAlt className="text-sky-500" /> Leave Type
                            </p>
                            <p className="text-gray-900 font-semibold text-lg">
                              {leaveType.leaveType}
                            </p>
                          </div>
                          <div className="mb-4">
                            <p className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-1">
                              <FaCalendarAlt className="text-sky-500" /> Days
                            </p>
                            <p className="text-gray-900 font-semibold text-lg">
                              {leaveType.amount} {leaveType.amount === 1 ? 'day' : 'days'}
                            </p>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => handleEditClick(leaveType)}
                                className="text-sky-500 hover:text-sky-700 flex items-center gap-1 text-sm font-medium transition-colors"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(leaveType.id)}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium transition-colors"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </>
                    )}
                  </div>
              ))}

              {/* Add new leave type form */}
              {isAddingNew && (
                  <div className="border border-sky-300 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-sky-50 shadow-md">
                    <div className="mb-3">
                      <label className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-2">
                        <FaCalendarAlt className="text-sky-500" /> Leave Type
                      </label>
                      <input
                          type="text"
                          name="leaveType"
                          value={newLeaveType.leaveType}
                          onChange={handleNewLeaveTypeChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                          placeholder="Enter leave type"
                          autoFocus
                      />
                    </div>
                    <div className="mb-4">
                      <label className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-2">
                        <FaCalendarAlt className="text-sky-500" /> Days
                      </label>
                      <input
                          type="number"
                          name="amount"
                          value={newLeaveType.amount}
                          onChange={handleNewLeaveTypeChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                          placeholder="Enter number of days"
                          min="0"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                          onClick={handleCancel}
                          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          disabled={savingNew}
                      >
                        Cancel
                      </button>
                      <button
                          onClick={handleAddSave}
                          className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                          disabled={savingNew}
                      >
                        {savingNew ? (
                            <>
                              <Loading
                                  size="xs"
                                  color="border-white"
                                  className="inline"
                              />
                              Saving...
                            </>
                        ) : (
                            <>
                              <FaSave /> Save
                            </>
                        )}
                      </button>
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* Pagination Controls */}
        {!loading && leaveTypes.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, leaveTypes.length)} of {leaveTypes.length} leave types
              </div>
              <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {renderPaginationButtons()}
                <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
        )}
        <ToastContainer
          position="top-right"
          autoClose={3000}
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

export default LeaveSettings;
