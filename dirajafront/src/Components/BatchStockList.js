import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "./LoadingAnimation";

import { Link } from 'react-router-dom';


const BatchStockList = () => {
  const [batchStock, setBatchStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show 10 items per page

  useEffect(() => {
    const fetchBatchStock = async () => {
      try {
        const response = await axios.get("/api/diraja/batch-stock-level", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setBatchStock(response.data.batch_stocks || []);
      } catch (err) {
        setError("An error occurred while fetching batch stock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBatchStock();
  }, []);

  // Calculate total pages
  const totalPages = Math.ceil(batchStock.length / itemsPerPage);

  // Get the current items to display based on pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = batchStock.slice(startIndex, startIndex + itemsPerPage);

  // Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="stock-level-container">
      <h3>Batch Stock List</h3>

      {loading && <LoadingAnimation />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Total Quantity</th>
                
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.batch_number}</td>
                    <td>{stock.total_quantity} {stock.metric} </td>
                    
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No batch stock data available.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="stock-level-pagination">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              Prev
            </button>

            <span> Page {currentPage} of {totalPages} </span>

            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
          <Link to='/shopstock'>View Stock</Link>
        </>
      )}
    </div>
  );
};

export default BatchStockList;
