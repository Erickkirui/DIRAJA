import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Link } from 'react-router-dom';

const ItemStockList = () => {
  const [itemStock, setItemStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("inStock");
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchItemStock = async () => {
      try {
        const response = await axios.get("/api/diraja/item-stock-level", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setItemStock(response.data.item_stocks || []);
      } catch (err) {
        setError("An error occurred while fetching item stock data.");
      } finally {
        setLoading(false);
      }
    };
    fetchItemStock();
  }, []);

  const filteredStock = itemStock.filter(stock =>
    activeTab === "inStock" ? stock.total_remaining > 0 : stock.total_remaining === 0
  );

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredStock.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="stock-level-container">
      <p>Item Stock List</p>

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
                <th>Item Name</th>
                <th>Total Remaining</th>
              </tr>
            </thead>
            <tbody className="batchnumber-size">
              {currentItems.length > 0 ? (
                currentItems.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.itemname}</td>
                    <td>{stock.total_remaining} {stock.metric}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No item stock data available.</td>
                </tr>
              )}
            </tbody>
          </table>

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

export default ItemStockList;
