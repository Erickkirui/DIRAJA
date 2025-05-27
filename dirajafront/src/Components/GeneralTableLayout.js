import React, { useState, useEffect } from 'react';
import '../Styles/GeneralTableLayout.css';

function GeneralTableLayout({ data, columns, onEdit, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (direction) => {
    setCurrentPage((prev) =>
      direction === 'prev' ? Math.max(prev - 1, 1) : Math.min(prev + 1, totalPages)
    );
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="table-container">
      <table className="general-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
            {/* <th>Action</th> */}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {typeof col.render === 'function'
                    ? col.render(item)
                    : item[col.key]}
                </td>
              ))}
              {/* <td className="action-cell">
                <div className="dropdown">
                  <span className="dropdown-trigger">⋮</span>
                  <div className="dropdown-menu">
                    <button onClick={() => onEdit?.(item)}>Edit</button>
                    <button onClick={() => onDelete?.(item)}>Delete</button>
                  </div>
                </div>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination-controls">
        <div className="items-per-page">
          <label>
            Show:{' '}
            <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
        <div className="page-buttons">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <button
            onClick={() => handlePageChange('next')}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default GeneralTableLayout;