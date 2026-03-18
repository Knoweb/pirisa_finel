/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EmployeeDetailsPopup from "../windows/EmployeeDetailsPopup";
import SearchBar from "../SearchBar";
import Loading from "../Loading/Loading";

// Types
interface BaseItem {
  id: string | number;
   
  [key: string]: any; 
}

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T extends BaseItem> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
  searchKeys?: string[];
  rowClickable?: boolean;
}

const Table = <T extends BaseItem>({
  columns,
  data,
  title,
  pagination,
  className = "",
  searchKeys = [],
  rowClickable = true,
}: TableProps<T>) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

 // In your Table component, modify the filteredData calculation
const filteredData = useMemo(() => {
  if (!searchTerm) return data;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return data.filter((item) => {
    // If searchKeys is provided, only search those keys
    if (searchKeys.length > 0) {
      return searchKeys.some((key) => {
        // Handle nested keys (e.g., "designation.designation")
        if (key.includes('.')) {
          const keys = key.split('.');
          let value: any = item;
          
          // Traverse the nested object structure
          for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
              value = value[k];
            } else {
              value = null;
              break;
            }
          }
          
          return value && 
            value.toString().toLowerCase().includes(lowerSearchTerm);
        }
        
        // Handle regular keys
        const value = item[key as keyof T];
        return value && 
          value.toString().toLowerCase().includes(lowerSearchTerm);
      });
    }
    
    // Otherwise search all string values in the item
    return Object.values(item).some((value) => {
      return typeof value === 'string' && 
        value.toLowerCase().includes(lowerSearchTerm);
    });
  });
}, [data, searchTerm, searchKeys]);

  const openPopup = (rowData: T) => {
    setSelectedRowId(rowData.id as number);
    setIsPopupOpen(true);
    
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedRowId(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => {
            setError('');
            setLoading(true);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white p-3 sm:p-4 rounded-lg ${className}`}>
    {/* Title Section */}
    {title && (
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-600">{title}</h2>
      </div>
    )}
    <div className="py-5">
      <SearchBar onSearch={handleSearch} />
    </div>
    <div className={`w-full bg-white rounded-lg shadow-sm ${className}`}>
      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-max w-full">
          <thead>
            <tr className="text-left bg-gray-100 border-gray-200">
              {columns.length > 0 ? (
                columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 sm:px-6 py-3 text-sm font-medium text-gray-500 ${
                      column.className || ""
                    }`}
                  >
                    {column.title}
                  </th>
                ))
              ) : (
                <th className="px-3 sm:px-6 py-3 text-xs font-medium text-gray-500">
                  No columns available
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-b-neutral-300 last:border-b-0 hover:bg-gray-50 ${
                    rowClickable ? "cursor-pointer" : ""
                  }`}
                  onClick={rowClickable ? () => openPopup(item) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={`${item.id}-${column.key}`}
                      className={`px-3 sm:px-6 py-4 ${column.className || ""}`}
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 sm:px-6 py-4 text-center text-gray-500">
                  {searchTerm ? "No matching records found" : "No data available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {pagination && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="flex items-center gap-2 text-gray-600 disabled:text-gray-400"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={`px-3 py-1 rounded ${
                    pagination.currentPage === page
                      ? "bg-sky-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="flex items-center gap-2 text-gray-600 disabled:text-gray-400"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>

    {/* Popup Section */}
    {rowClickable && isPopupOpen && selectedRowId && (
      <EmployeeDetailsPopup
        isOpen={isPopupOpen}
        onClose={closePopup}
        id={selectedRowId}
      />
    )}
  </div>
  );
};

export default Table;
