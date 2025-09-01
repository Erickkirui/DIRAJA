import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Link } from 'react-router-dom';

const BatchStockList = () => {
  const [batchStock, setBatchStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("inStock"); // Default to 'In Stock'
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchBatchStock = async () => {
      try {
        const response = await axios.get("https://kulima.co.ke/api/diraja/batch-stock-level", {
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

  // Filter stock based on active tab
  const filteredStock = batchStock.filter(stock =>
    activeTab === "inStock" ? stock.total_quantity > 0 : stock.total_quantity === 0
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredStock.slice(startIndex, startIndex + itemsPerPage);

  // Page change handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset pagination
  };

  return (
    <div className="stock-level-container">
      <p>Batch Stock List</p>

      {/* Shared tab styles */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'inStock' ? 'active' : ''}`}
          onClick={() => handleTabChange('inStock')}
        >
          In Stock
        </button>
        <button
          className={`tab-button ${activeTab === 'outOfStock' ? 'active' : ''}`}
          onClick={() => handleTabChange('outOfStock')}
        >
          Out of Stock
        </button>
      </div>

      {loading && <LoadingAnimation />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="tab-content">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Total Remaining</th>
              </tr>
            </thead>
            <tbody className="batchnumber-size">
              {currentItems.length > 0 ? (
                currentItems.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.batch_number}</td>
                    <td>{stock.total_quantity} {stock.metric}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No batch stock data available.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="stock-level-pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span> Page {currentPage} of {totalPages || 1} </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>

          <Link className="view-stock-link" to="/shopstock">View Stock</Link>
        </div>
      )}
    </div>
  );
};

export default BatchStockList;