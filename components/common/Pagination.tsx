
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // For this project, a simple list of page numbers is sufficient.
  // In a larger application, logic for ellipses (...) would be added here.
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center items-center space-x-1 mt-12" aria-label="Pagination">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100 flex items-center text-sm text-gray-700 shadow-sm border border-gray-200"
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} className="mr-1" />
        Previous
      </button>

      <div className="hidden sm:flex items-center space-x-1">
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageClick(number)}
            className={`px-4 py-2 rounded-md text-sm shadow-sm border border-gray-200 ${
              currentPage === number
                ? 'bg-primary text-white font-bold border-primary'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            aria-current={currentPage === number ? 'page' : undefined}
          >
            {number}
          </button>
        ))}
      </div>
      
      {/* Mobile view for page numbers */}
      <div className="sm:hidden text-sm text-gray-600 px-4">
          Page {currentPage} of {totalPages}
      </div>


      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100 flex items-center text-sm text-gray-700 shadow-sm border border-gray-200"
        aria-label="Go to next page"
      >
        Next
        <ChevronRight size={16} className="ml-1" />
      </button>
    </nav>
  );
};

export default Pagination;
