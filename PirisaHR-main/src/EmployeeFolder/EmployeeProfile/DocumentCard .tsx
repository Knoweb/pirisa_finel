import {
  FaFileAlt,
  FaIdCard,
  FaShieldAlt,
  FaFileInvoiceDollar,
  FaFileSignature,
  FaFileImage,
  FaBirthdayCake,
  FaUpload,
} from "react-icons/fa";
import { useRef } from "react";
import { toast } from "react-toastify";

interface DocumentCardProps {
  name: string;
  type: string;
  onClick: (type: string) => void;
  isAvailable: boolean;
  onDocumentUploaded: () => void;
}

const iconComponents = {
  birthCertificate: <FaBirthdayCake />,
  cv: <FaFileAlt />,
  policeReport: <FaShieldAlt />,
  idCopy: <FaIdCard />,
  bankPassbook: <FaFileInvoiceDollar />,
  appointmentLetter: <FaFileSignature />,
  photo: <FaFileImage />,
};

export const DocumentCard = ({
  name,
  type,
  onClick,
  isAvailable,
  onDocumentUploaded,
}: DocumentCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAvailable) {
      onClick(type);
    }
  };

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
    formData.append(type, file);

    try {
      const response = await fetch(
        `/api/document/update/${empId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (response.ok) {
        toast.success("Document updated successfully!");
        onDocumentUploaded(); // Refresh the document availability
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update document.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    }
  };

  return (
    <div
      className={`p-4 border border-gray-300 rounded-lg transition relative ${
        isAvailable ? "hover:bg-gray-100 cursor-pointer" : "bg-gray-50"
      }`}
      onClick={handleViewClick}
    >
      <div className="flex items-center gap-3">
        <span className={`${isAvailable ? "text-sky-500" : "text-gray-400"}`}>
          {iconComponents[type as keyof typeof iconComponents]}
        </span>
        <div className="flex-1">
          <span
            className={`font-medium ${
              isAvailable ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {name}
          </span>
          {!isAvailable && (
            <div className="text-xs text-gray-400 mt-1">
              No {name.toLowerCase()} available
            </div>
          )}
        </div>
        <button
          type="button"
          className="bg-sky-500 text-white px-2 py-1 rounded hover:bg-sky-600 flex items-center text-xs"
          onClick={handleUploadClick}
        >
          <FaUpload className="mr-1" />
          {isAvailable ? "Update" : "Add"}
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="application/pdf,image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};
