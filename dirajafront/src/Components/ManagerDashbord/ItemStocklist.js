import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Link } from "react-router-dom";

const ItemStockList = () => {
  const [itemStock, setItemStock] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(""); // default to all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inStock");

  // Fetch all shops for dropdown
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get("/api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const sortedShops = response.data.sort((a, b) =>
          a.shopname.localeCompare(b.shopname)
        );

        setShops(sortedShops);
      } catch (err) {
        console.error("Failed to fetch shops", err);
      }
    };
    fetchShops();
  }, []);

  // Fetch item stock (optionally filtered by shop)
  useEffect(() => {
    const fetchItemStock = async () => {
      setLoading(true);
      try {
        const url = selectedShopId
          ? `/api/diraja/item-stock-level?shop_id=${selectedShopId}`
          : `/api/diraja/item-stock-level`;

        const response = await axios.get(url, {
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
  }, [selectedShopId]);

  const filteredStock = itemStock.filter((stock) =>
    activeTab === "inStock"
      ? stock.total_remaining > 0
      : stock.total_remaining === 0
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="stock-level-container">
      <div className="metric-top">
        <p>Item Stock List</p>
        <select
          value={selectedShopId}
          onChange={(e) => setSelectedShopId(e.target.value)}
        >
          <option value="">All Shops</option>
          {shops.map((shop) => (
            <option key={shop.shop_id} value={shop.shop_id}>
              {shop.shopname}
            </option>
          ))}
        </select>
      </div>

      <Link className="view-stock-link" to="/shopstock">
        View Stock
      </Link>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "inStock" ? "active" : ""}`}
          onClick={() => handleTabChange("inStock")}
        >
          In Stock
        </button>
        <button
          className={`tab-button ${activeTab === "outOfStock" ? "active" : ""}`}
          onClick={() => handleTabChange("outOfStock")}
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
              {filteredStock.length > 0 ? (
                filteredStock.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.itemname}</td>
                    <td>
                      {stock.total_remaining} {stock.metric}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No item stock data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ItemStockList;
