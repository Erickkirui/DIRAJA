import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Link } from "react-router-dom";

const ItemStockList = () => {
  const [itemStock, setItemStock] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inStock");

  // Fetch all shops for dropdown and stock items
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch shops
        const shopsResponse = await axios.get("/api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const sortedShops = shopsResponse.data.sort((a, b) =>
          a.shopname.localeCompare(b.shopname)
        );
        setShops(sortedShops);

        // Fetch stock items
        const itemsResponse = await axios.get("http://127.0.0.1:5000/api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setStockItems(itemsResponse.data.stock_items || []);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchInitialData();
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
        
        // Process the stock data to include proper display metrics
        const processedStock = (response.data.item_stocks || []).map(stock => {
          const itemInfo = stockItems.find(item => item.item_name === stock.itemname);
          
          if (!itemInfo) return { ...stock, display: `${stock.total_remaining} ${stock.metric || 'pcs'}` };
          
          // If metric is kgs, don't convert to packets/pieces
          if (stock.metric && stock.metric.toLowerCase() === 'kgs') {
            return {
              ...stock,
              display: `${stock.total_remaining} kgs`
            };
          }
          
          // For eggs, display as trays and pieces
          if (itemInfo.item_name.toLowerCase() === "eggs" && itemInfo.pack_quantity > 0) {
            const trays = Math.floor(stock.total_remaining / itemInfo.pack_quantity);
            const pieces = stock.total_remaining % itemInfo.pack_quantity;
            return {
              ...stock,
              display: trays > 0 
                ? `${trays} tray${trays !== 1 ? 's' : ''}${pieces > 0 ? `, ${pieces} pcs` : ''}`
                : `${pieces} pcs`
            };
          }
          // For other items with pack quantity, display as packets and pieces
          else if (itemInfo.pack_quantity > 0) {
            const packets = Math.floor(stock.total_remaining / itemInfo.pack_quantity);
            const pieces = stock.total_remaining % itemInfo.pack_quantity;
            return {
              ...stock,
              display: packets > 0
                ? `${packets} pkt${packets !== 1 ? 's' : ''}${pieces > 0 ? `, ${pieces} pcs` : ''}`
                : `${pieces} pcs`
            };
          }
          // For items without pack quantity, just display with their metric
          else {
            return {
              ...stock,
              display: `${stock.total_remaining} ${stock.metric || 'pcs'}`
            };
          }
        });
        
        setItemStock(processedStock);
      } catch (err) {
        setError("An error occurred while fetching item stock data.");
      } finally {
        setLoading(false);
      }
    };
    
    if (stockItems.length > 0) {
      fetchItemStock();
    }
  }, [selectedShopId, stockItems]);

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
                    <td>{stock.display}</td>
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