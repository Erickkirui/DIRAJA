import React from 'react';
import '../Styles/Pagination.css';  // Add custom styles for your pagination

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  const handlePageClick = (page) => {
    onPageChange(page);
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const renderPageNumbers = () => {
    const range = 3;
    const pages = [];
    for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
      pages.push(i);
    }
    return pages.map((page) => (
      <button
        key={page}
        className={`page-button ${currentPage === page ? 'active' : ''}`}
        onClick={() => handlePageClick(page)}
      >
        {page}
      </button>
    ));
  };

  return (
    <div className="pagination-container">
      {/* Items per page dropdown */}
      <div className="items-per-page">
        <span>Show </span>
        <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(e.target.value)} className="per-page-dropdown">
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span> per page</span>
      </div>

      {/* Page navigation */}
      <div className="pagination-navigation">
        <button className="pagination-button" onClick={handlePrevious} disabled={currentPage === 1}>
          Previous
        </button>
        {renderPageNumbers()}
        <button className="pagination-button" onClick={handleNext} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {/* Page number display */}
      <div className="page-info">
        <span>Page {currentPage} of {totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination;
