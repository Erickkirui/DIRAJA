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

  // Fetch all shops and stock items
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
        const itemsResponse = await axios.get("/api/diraja/stockitems", {
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

  // Fetch item stock
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

        const processedStock = (response.data.item_stocks || []).map((stock) => {
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

          // If metric is kgs, show in kgs only
          if (stock.metric && stock.metric.toLowerCase() === "kgs") {
            return {
              ...stock,
              display: `${stock.total_remaining} kgs`,
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

  // Filter to only show items with stock remaining
  const currentStock = itemStock.filter((stock) => stock.total_remaining > 0);

  return (
    <div className="stock-level-container">
      <div className="top-stock">
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

      {loading && <LoadingAnimation />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="tab-content">
          <h3>Current Stock</h3>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Total Remaining</th>
              </tr>
            </thead>
            <tbody className="batchnumber-size">
              {currentStock.length > 0 ? (
                currentStock.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.itemname}</td>
                    <td>{stock.display}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No current stock available.</td>
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
