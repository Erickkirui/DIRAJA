import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";

const InventoryStockCount = () => {
  const [inventoryStock, setInventoryStock] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    item_name: "",
    supplier_name: ""
  });

  // Fetch stock items
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const itemsResponse = await axios.get("api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setStockItems(itemsResponse.data.stock_items || []);
      } catch (err) {
        console.error("Failed to fetch stock items", err);
      }
    };
    fetchStockItems();
  }, []);

  // Fetch inventory stock
  useEffect(() => {
    const fetchInventoryStock = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (filters.item_name) params.append('item_name', filters.item_name);
        if (filters.supplier_name) params.append('supplier_name', filters.supplier_name);

        const url = `api/diraja/inventory-stock-level${params.toString() ? `?${params.toString()}` : ''}`;

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        // Process stock with the same logic as ItemStockList
        const processedStock = (response.data.inventory_stocks || []).map((stock) => {
          const itemInfo = stockItems.find(
            (item) => item.item_name === stock.itemname
          );

          // Default display if no itemInfo found
          if (!itemInfo) {
            return {
              ...stock,
              display: `${stock.total_remaining} ${stock.metric || "pcs"}`,
            };
          }

          // If metric is kg, show in kg only
          if (stock.metric && stock.metric.toLowerCase() === "kg") {
            return {
              ...stock,
              display: `${stock.total_remaining} kg`,
            };
          }

          // For eggs → trays and pieces
          if (
            itemInfo.item_name.toLowerCase().includes("eggs") &&
            (itemInfo.pack_quantity > 0 || !itemInfo.pack_quantity)
          ) {
            const packQty =
              itemInfo.pack_quantity && itemInfo.pack_quantity > 0
                ? itemInfo.pack_quantity
                : 30; // default tray size
            const trays = Math.floor(stock.total_remaining / packQty);
            const pieces = stock.total_remaining % packQty;
            return {
              ...stock,
              display:
                trays > 0
                  ? `${trays} tray${trays !== 1 ? "s" : ""}${
                      pieces > 0 ? `, ${pieces} pcs` : ""
                    }`
                  : `${pieces} pcs`,
            };
          }

          // For other items with pack quantity → pkts and pcs
          if (itemInfo.pack_quantity > 0) {
            const packets = Math.floor(
              stock.total_remaining / itemInfo.pack_quantity
            );
            const pieces = stock.total_remaining % itemInfo.pack_quantity;
            return {
              ...stock,
              display:
                packets > 0
                  ? `${packets} pkt${packets !== 1 ? "s" : ""}${
                      pieces > 0 ? `, ${pieces} pcs` : ""
                    }`
                  : `${pieces} pcs`,
            };
          }

          // Fallback
          return {
            ...stock,
            display: `${stock.total_remaining} ${stock.metric || "pcs"}`,
          };
        });

        setInventoryStock(processedStock);
      } catch (err) {
        setError("An error occurred while fetching inventory stock data.");
        console.error("Failed to fetch inventory stock", err);
      } finally {
        setLoading(false);
      }
    };

    if (stockItems.length > 0) {
      fetchInventoryStock();
    }
  }, [filters, stockItems]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="stock-level-container">
      <div className="top-stock">
        <h2>Inventory Stock Count</h2>
        
        {/* Filter inputs */}
        <div className="filter-controls">
          <input
            type="text"
            name="item_name"
            placeholder="Filter by item name..."
            value={filters.item_name}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="supplier_name"
            placeholder="Filter by supplier..."
            value={filters.supplier_name}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
      </div>

      {loading && <LoadingAnimation />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="tab-content">
          <h3>Current Inventory Stock</h3>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Total Remaining</th>
                <th>Batches</th>
              </tr>
            </thead>
            <tbody className="batchnumber-size">
              {inventoryStock.length > 0 ? (
                inventoryStock.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.itemname}</td>
                    <td>{stock.display}</td>
                    <td>{stock.batch_count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No inventory stock available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryStockCount;