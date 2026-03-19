import React, { useState, useEffect, ChangeEvent } from "react";
import { FaEdit, FaSave, FaPlus, FaTag } from "react-icons/fa";
import axios from "axios";

// Define types
interface Bonus {
  id: number;
  name: string;
}

interface EditFormData {
  name: string;
}

const BonusSettings: React.FC = () => {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
  });
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newBonus, setNewBonus] = useState<EditFormData>({
    name: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(3); // Number of items per page

  // Fetch bonuses on component mount
  useEffect(() => {
    fetchBonuses();
  }, []);

  // Fetch bonuses from the API
  const fetchBonuses = async () => {
    const token = localStorage.getItem("token"); // Get token from localStorage
    const cmpId = localStorage.getItem("cmpnyId"); // Get company ID from localStorage

    if (!token || !cmpId) {
      alert("Token or Company ID is missing. Please log in again.");
      return;
    }

    try {
      const response = await axios.get(
        `/api/bonus/company/${cmpId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      //console.log("API Response:", response); // Log the full response

      if (
        response.status === 200 &&
        response.data &&
        response.data.resultCode === 100
      ) {
        // Map the API response to the Bonus type
        interface BonusItem {
          id: number;
          bonusName: string;
        }

        const fetchedBonuses = response.data.BonusList.map(
          (item: BonusItem) => ({
            id: item.id,
            name: item.bonusName,
          })
        );
        setBonuses(fetchedBonuses);
      } else {
        // alert('Failed to fetch bonuses. Invalid response.');
      }
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      // alert('An error occurred while fetching bonuses.');
    }
  };

  // Handle clicking on a bonus to edit
  const handleEditClick = (bonus: Bonus): void => {
    setEditingId(bonus.id);
    setEditFormData({
      name: bonus.name,
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

  // Handle saving edited bonus
  const handleSaveClick = async (): Promise<void> => {
    const token = localStorage.getItem("token");
    const cmpId = localStorage.getItem("cmpnyId");

    if (!token || !cmpId) {
      alert("Token or Company ID is missing. Please log in again.");
      return;
    }

    try {
      const payload = {
        bonusName: editFormData.name,
        cmpId: parseInt(cmpId, 10),
      };

      const response = await axios.put(
        `/api/bonus/update/${editingId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        fetchBonuses(); // Refresh the list after update
        setEditingId(null);
      } else {
        alert("Failed to update the bonus.");
      }
    } catch (error) {
      console.error("Error updating bonus:", error);
      alert("An error occurred while updating the bonus.");
    }
  };

  // Handle adding new bonus
  const handleAddNewClick = (): void => {
    setIsAddingNew(true);
  };

  // Handle input changes for new bonus
  const handleNewBonusChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setNewBonus({
      ...newBonus,
      [name]: value,
    });
  };

  // Handle saving new bonus
  const handleAddSave = async (): Promise<void> => {
    if (newBonus.name.trim() !== "") {
      const token = localStorage.getItem("token");
      const cmpId = localStorage.getItem("cmpnyId");

      if (!token || !cmpId) {
        alert("Token or Company ID is missing. Please log in again.");
        return;
      }

      const payload = {
        bonusName: newBonus.name,
        cmpId: parseInt(cmpId, 10),
      };

      try {
        const response = await axios.post(
          "/api/bonus/add_bonus",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          // Refresh the list of bonuses after adding a new one
          fetchBonuses();
          setNewBonus({ name: "" });
          setIsAddingNew(false);
        } else {
          alert("Failed to save the new bonus.");
        }
      } catch (error) {
        console.error("Error saving new bonus:", error);
        alert("An error occurred while saving the new bonus.");
      }
    }
  };

  // Handle canceling add or edit
  const handleCancel = (): void => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  // Handle deleting a bonus
  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm("Are you sure you want to delete this bonus?")) {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Token is missing. Please log in again.");
        return;
      }

      try {
        const response = await axios.delete(
          `/api/bonus/delete/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          fetchBonuses(); // Refresh the list after deletion
        } else {
          alert("Failed to delete the bonus.");
        }
      } catch (error) {
        console.error("Error deleting bonus:", error);
        alert("An error occurred while deleting the bonus.");
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(bonuses.length / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentBonuses = bonuses.slice(indexOfFirstItem, indexOfLastItem);

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
        <h3 className="text-lg font-semibold text-gray-900">Bonus Settings</h3>
        <button
          onClick={handleAddNewClick}
          className="text-sky-500 hover:text-sky-800 flex items-center gap-1 text-sm"
        >
          <FaPlus /> Add New Bonus
        </button>
      </div>

      {/* Check if bonuses array is empty */}
      {bonuses.length === 0 && !isAddingNew ? (
        <div className="mt-4 text-center text-gray-500">
          No data added yet. Click "Add New Bonus" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {currentBonuses.map((bonus) => (
            <div
              key={bonus.id}
              className="border border-gray-200 rounded-md p-4 hover:border-sky-300 transition"
            >
              {editingId === bonus.id ? (
                // Edit mode
                <>
                  <div className="mb-2">
                    <label className="text-gray-500 text-sm flex items-center gap-1">
                      <FaTag /> Bonus Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="w-full p-1.5 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
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
                      <FaTag /> Bonus Name
                    </p>
                    <p className="text-gray-900 font-medium">{bonus.name}</p>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => handleDelete(bonus.id)}
                      className="px-3 py-1 text-sm text-red-500 rounded hover:text-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleEditClick(bonus)}
                      className="px-3 py-1 text-sm  text-sky-500 rounded hover:text-sky-600 flex items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new bonus form */}
          {isAddingNew && (
            <div className="border border-sky-300 rounded-md p-4 bg-blue-50">
              <div className="mb-2">
                <label className="text-gray-500 text-sm flex items-center gap-1">
                  <FaTag /> Bonus Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newBonus.name}
                  onChange={handleNewBonusChange}
                  className="w-full p-1.5 border border-gray-300 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter bonus name"
                />
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
      {bonuses.length > 0 && (
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

export default BonusSettings;
