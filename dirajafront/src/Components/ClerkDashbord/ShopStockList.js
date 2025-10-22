import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Alert, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ShopStockList = () => {
  const shopId = localStorage.getItem("shop_id");
  const [itemStock, setItemStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inStock");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [messageType, setMessageType] = useState("success");
  const navigate = useNavigate();

  // Process stock data into human-readable display
  const processStockData = useCallback((stockData, items) => {
    return stockData.map((stock) => {
      const itemInfo = items.find((item) => item.item_name === stock.itemname);

      if (!itemInfo)
        return {
          ...stock,
          display: `${stock.total_remaining} ${stock.metric || "pcs"}`,
        };

      // Kgs stay as kgs
      if (stock.metric && stock.metric.toLowerCase() === "kgs") {
        return { ...stock, display: `${stock.total_remaining} kgs` };
      }

      // Eggs → trays + pieces
      const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
      if (isEggs && itemInfo.pack_quantity > 0) {
        const trays = Math.floor(stock.total_remaining / itemInfo.pack_quantity);
        const pieces = stock.total_remaining % itemInfo.pack_quantity;
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

      // Other items with pack quantity → pkts + pcs
      if (itemInfo.pack_quantity > 0) {
        const packets = Math.floor(stock.total_remaining / itemInfo.pack_quantity);
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
  }, []);

  // Fetch stock items and stock levels
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stock items
        const itemsResponse = await axios.get("api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const items = itemsResponse.data.stock_items || [];
        setStockItems(items);

        // Fetch shop stock
        const stockResponse = await axios.get(
          `api/diraja/item-stock-level?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        const rawStock = stockResponse.data.item_stocks || [];

        // ✅ Group by itemname and sum total_remaining
        const grouped = rawStock.reduce((acc, stock) => {
          if (!acc[stock.itemname]) {
            acc[stock.itemname] = { ...stock };
          } else {
            acc[stock.itemname].total_remaining += stock.total_remaining;
          }
          return acc;
        }, {});

        const combinedStock = Object.values(grouped);

        // ✅ Format display
        const processedStock = processStockData(combinedStock, items);

        // ✅ Sort alphabetically
        processedStock.sort((a, b) => a.itemname.localeCompare(b.itemname));

        setItemStock(processedStock);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load stock data for this shop.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId, processStockData]);

  const filteredStock = itemStock.filter((stock) =>
    activeTab === "inStock"
      ? stock.total_remaining > 0
      : stock.total_remaining === 0
  );

  const handleSubmitReport = async () => {
    setSubmitting(true);
    setMessage("");

    const reportData = {};
    itemStock.forEach((item) => {
      reportData[item.itemname] = `${item.total_remaining} ${item.metric}`;
    });

    const payload = { shop_id: shopId, report: reportData };

    try {
      const response = await axios.post("api/diraja/report-stock", payload, {
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
      {/* Header on top */}
      <h2 style={{ margin: "0 0 20px 0" }}>My Shop Stock</h2>

      {/* Buttons flexing below the header */}
      <div
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "10px",
          marginBottom: "20px"
        }}
      >
        <button className="button" onClick={() => navigate("/transfer")}>
          Transfer Stock
        </button>
        <button className="button" onClick={() => navigate("/broken-eggs")}>
          Broken Eggs
        </button>
        <button className="button" onClick={() => navigate("/cooked")}>
          Cooked Items
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
        {/* <button
          className={`tab-button ${activeTab === "outOfStock" ? "active" : ""}`}
          onClick={() => setActiveTab("outOfStock")}
        >
          Out of Stock
        </button> */}
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
              Check the stock and press submit report if it matches.  
              If not, contact the manager.
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