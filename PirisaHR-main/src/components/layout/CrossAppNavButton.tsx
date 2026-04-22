import React from 'react';

const CrossAppNavButton: React.FC = () => {
  const handleNavigateToDashboard = () => {
    const HOST = window.location.hostname;
    const PROTOCOL = window.location.protocol;
    const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1';

    // Build the URL dynamically based on current environment
    // Main Dashboard: Local (Port 5173) | Production (Port 3000)
    const mainDashboardUrl = IS_LOCAL 
        ? `${PROTOCOL}//${HOST}:5173/dashboard` 
        : `http://167.71.206.166:3000/dashboard`;

    window.location.href = mainDashboardUrl;
  };

  return (
    <button
      onClick={handleNavigateToDashboard}
      className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none"
      title="Return to Main Dashboard"
    >
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Go to Main Dashboard</span>
      <svg
        className="w-3 h-3 sm:w-4 sm:h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </button>
  );
};

export default CrossAppNavButton;
