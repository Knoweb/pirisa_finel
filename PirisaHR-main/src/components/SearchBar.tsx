import React, { useEffect, useState } from "react";

interface SearchBarProps {
  onSearch: (term: string) => void;
  debounceDelay?: number;
}

const SearchBar: React.FC <SearchBarProps>= ({ 
  onSearch, 
  debounceDelay = 300 
}) => {

  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceDelay);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch, debounceDelay]);
  return (
    <div className="w-full">
      {/* Title */}
      {/* <div>
        <h2 className="text-xl font-semibold mb-4">
          <span className="text-sky-500">All Employees</span>
        </h2>
        <div className="relative">
          <hr className="border-t-2 border-gray-200 mb-4" />
          <hr
            className="border-t-2 border-sky-500 mb-4 absolute top-0"
            style={{ width: "120px" }}
          />
        </div>
      </div> */}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Employee by name, role, ID or any related keywords"
          className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {/* Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
