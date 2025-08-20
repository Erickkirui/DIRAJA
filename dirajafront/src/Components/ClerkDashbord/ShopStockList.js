import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Alert, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ShopStockList = () => {
  const shopId = localStorage.getItem("shop_id");
  const [itemStock, setItemStock] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inStock");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [stockItems, setStockItems] = useState([]); // ✅ Add this state

  const [messageType, setMessageType] = useState("success");
  const navigate = useNavigate();

  // Fetch stock items
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const itemsResponse = await axios.get("/api/diraja/stockitems", {
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

  // ✅ Fetch stock levels
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stock items metadata
        const itemsRes = await axios.get("/api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const stockItemsData = itemsRes.data.stock_items || [];
        setStockItems(stockItemsData);

        // Fetch shop stock
        const stockRes = await axios.get(
          `/api/diraja/item-stock-level?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        // Apply display formatting
        const processedStock = (stockRes.data.item_stocks || []).map((stock) => {
          const itemInfo = stockItemsData.find(
            (item) => item.item_name === stock.itemname
          );

          if (!itemInfo) {
            return {
              ...stock,
              display: `${stock.total_remaining} ${stock.metric || "pcs"}`,
            };
          }

          // If metric is kgs, display directly
          if (stock.metric && stock.metric.toLowerCase() === "kgs") {
            return { ...stock, display: `${stock.total_remaining} kgs` };
          }

          // Eggs logic → trays and pieces
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

          // Other items with pack_quantity → pkts and pcs
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

          // Default
          return {
            ...stock,
            display: `${stock.total_remaining} ${stock.metric || "pcs"}`,
          };
        });

        setItemStock(processedStock);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data for this shop.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const filteredStock = itemStock.filter((stock) =>
    activeTab === "inStock" ? stock.total_remaining > 0 : stock.total_remaining === 0
  );

  const handleSubmitReport = async () => {
    setSubmitting(true);
    setMessage("");

    const reportData = {};
    itemStock.forEach((item) => {
      reportData[item.itemname] = item.display;
    });

    const payload = {
      shop_id: shopId,
      report: reportData,
    };

    try {
      const response = await axios.post("/api/diraja/report-stock", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      setMessage(response.data.message || "✅ Stock report submitted.");
      setMessageType("success");
      localStorage.setItem("report_status", "true");
      setTimeout(() => {
        navigate("/depositcash");
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "❌ Failed to submit stock report.";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Heading and Transfer Stock Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ margin: 0 }}>My Shop Stock</h2>
        <button className="button" onClick={() => navigate("/transfer")}>
          Transfer Stock
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "inStock" ? "active" : ""}`}
          onClick={() => setActiveTab("inStock")}
        >
          In Stock
        </button>
        <button
          className={`tab-button ${activeTab === "outOfStock" ? "active" : ""}`}
          onClick={() => setActiveTab("outOfStock")}
        >
          Out of Stock
        </button>
      </div>

      {loading && <LoadingAnimation />}
      {error && (
        <Stack sx={{ my: 2 }}>
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        </Stack>
      )}

      {!loading && !error && (
        <>
          {message && (
            <Stack sx={{ my: 2 }}>
              <Alert severity={messageType} variant="outlined">
                {message}
              </Alert>
            </Stack>
          )}

          {/* ✅ Cleaned table */}
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

          {/* Submit Report Button */}
          
          <div style={{ marginTop: "20px" }}>
            <Alert severity="info" style={{ marginBottom: "10px" }}>
              Check the stock and press submit report if it matches. If not,
              contact the manager.
            </Alert>
            <button
              onClick={handleSubmitReport}
              disabled={submitting}
              className="button"
            >
              {submitting ? "Submitting..." : "Submit Stock Report"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopStockList;
