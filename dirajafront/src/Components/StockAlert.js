import React, { useState, useEffect } from "react";
import "../Styles/LowStockAlert.css"; // Import the CSS for styling
import axios from "axios";

const StockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Added state for pagination
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch stock alert data from backend
    const fetchStockData = async () => {
      try {
        // Make the GET request to the backend endpoint
        const response = await axios.get("/diraja/checkstock", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Include the token if needed
          },
        });

        // Set the response data to the state
        setLowStockItems(response.data.low_stock_items || []);
        setOutOfStockItems(response.data.out_of_stock_items || []);
      } catch (err) {
        setError("An error occurred while fetching the stock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  // Pagination logic
  const combinedItems = [...lowStockItems, ...outOfStockItems];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = combinedItems.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="low-stock-container">
      {error && <div className="error-message">{error}</div>}
      {/* Display error message */}
      <h3 className="low-stock-title">Stock Levels</h3>
      <table className="low-stock-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Shop</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, index) => (
            <tr key={index}>
              <td>{item.item}</td>
              <td>{item.shop}</td>
              <td>
                <span
                  className={`status-badge ${
                    lowStockItems.includes(item) ? "low-stock" : "out-of-stock"
                  }`}
                >
                  {lowStockItems.includes(item) ? "Low Stock" : "Out of Stock"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="view-stock-link">
        <a href="/shopstock">View Stock</a>
      </div>

      <div className="pagination">
        {Array.from(
          { length: Math.ceil(combinedItems.length / itemsPerPage) },
          (_, index) => (
            <button
              key={index}
              className={`page-button ${
                currentPage === index + 1 ? "active" : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default StockAlert;
