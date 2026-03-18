import React, { useState, useEffect } from "react";

interface DateFilterProps {
  onDateChange: (date: string) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ onDateChange }) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Set default date on component mount
  useEffect(() => {
    // Trigger the parent's date change handler with today's date on component mount
    onDateChange(selectedDate);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleClear = () => {
    setSelectedDate('');
    onDateChange('');
  };

  return (
    <div className="mb-4 flex items-center space-x-2">
      <div className="flex items-center">
        <label htmlFor="date-filter" className="mr-2 text-sm font-medium">
          Filter by Date:
        </label>
        <input
          id="date-filter"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      {selectedDate && (
        <button
          onClick={handleClear}
          className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default DateFilter;
