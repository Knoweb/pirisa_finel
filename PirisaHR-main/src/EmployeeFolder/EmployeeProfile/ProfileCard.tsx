// components/ProfileCard.tsx
import { useRef, useState } from "react";
import { FaBriefcase } from "react-icons/fa";
import { toast } from "react-toastify";

interface ProfileCardProps {
  photoUrl: string;
  firstName: string;
  lastName: string;
  designation: string;
  onPhotoUploaded: () => void;
}

export const ProfileCard = ({
  photoUrl,
  firstName,
  lastName,
  designation,
  onPhotoUploaded,
}: ProfileCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const empId = localStorage.getItem("empId");

    if (!token || !empId) {
      alert("Authentication required.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/profile-image/upload/${empId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.resultCode === 100) {
        toast.success("Profile picture updated successfully!");
        onPhotoUploaded();
      } else {
        toast.error(data.resultDesc || "Failed to update profile picture.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!loading) fileInputRef.current?.click();
  };

  return (
    <div className="w-full lg:w-1/3 flex flex-col items-center bg-gray-50 p-6 rounded-lg shadow-md transition hover:scale-105 relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-10 rounded-lg">
          <svg
            className="animate-spin h-8 w-8 text-sky-500 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span className="text-sky-500 font-medium">Updating photo...</span>
        </div>
      )}
      <img
        className="w-32 h-32 rounded-full border-4 border-gray-300 hover:border-gray-400 transition object-cover"
        src={photoUrl}
        alt="Employee"
        onError={(e) => {
          e.currentTarget.src = "/profile.jpg";
        }}
        style={loading ? { filter: "blur(2px)" } : {}}
      />
      <h2 className="mt-4 text-xl font-semibold text-gray-900 hover:text-gray-700 transition">
        {`${firstName} ${lastName}`}
      </h2>
      <p className="text-gray-500 text-sm text-center flex items-center gap-1">
        <FaBriefcase /> {designation}
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*"
      />
      <button
        onClick={handleButtonClick}
        className={`mt-3 bg-sky-500 text-white px-4 py-2 rounded-lg transition text-sm flex items-center justify-center ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:bg-sky-600"
        }`}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            Updating...
          </>
        ) : (
          "Update Picture"
        )}
      </button>
    </div>
  );
};
