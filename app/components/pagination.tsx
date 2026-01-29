import React, { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageLimitChange?: (limit: number) => void; // Optional callback
  pageLimit?: number; // Optional page limit
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPageLimitChange,
  pageLimit = 10, // Default limit if not provided
}) => {
  const [selectedLimit, setSelectedLimit] = useState(pageLimit);

  const handlePreviousPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setSelectedLimit(newLimit);
    if (onPageLimitChange) {
      onPageLimitChange(newLimit); // Notify parent component only if callback exists
    }
  };

  return (
  <div className="pt-2">
    {/* Pagination Controls */}
    <div className="flex items-center justify-center">
      <button
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        className="bg-gradient-to-r from-green-900 to-parrotgreen text-white py-1 px-2 rounded hover:bg-blue-700 text-xs sm:text-sm"
      >
        Previous
      </button>
      <div className="flex space-x-1 mx-2 overflow-x-auto">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => onPageChange(index + 1)}
            className={`py-1 px-2 rounded text-xs sm:text-sm ${
              currentPage === index + 1
                ? "bg-deepblue text-white"
                : "bg-gray-200 text-gray-800"
            } hover:bg-blue-500`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="bg-gradient-to-r from-green-900 to-parrotgreen text-white py-1 px-2 rounded hover:bg-blue-700 text-xs sm:text-sm"
      >
        Next
      </button>
    </div>

    {/* Optional Page Limit Dropdown */}
    {onPageLimitChange && (
      <div className="flex items-center justify-center space-x-1 my-1">
        <label htmlFor="pageLimit" className="text-gray-700 text-xs sm:text-sm">
          Items per page:
        </label>
        <select
          id="pageLimit"
          value={selectedLimit}
          onChange={handleLimitChange}
          className="py-1 px-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
        >
          {[10, 20, 50, 75, 100, 125, 200, 500].map((limit) => (
            <option key={limit} value={limit}>
              {limit}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
  );
};

export default Pagination;
