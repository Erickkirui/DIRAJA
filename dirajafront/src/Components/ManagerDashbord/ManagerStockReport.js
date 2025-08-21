import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { Alert, Stack } from "@mui/material";

const ManagerReportStock = () => {
  const [itemStock, setItemStock] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inStock");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Popup states
  const [showDifferencePopup, setShowDifferencePopup] = useState(false);
  const [differenceEntries, setDifferenceEntries] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [actualQty, setActualQty] = useState("");
  const [expectedQty, setExpectedQty] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get("https://kulima.co.ke/api/diraja/allshops", {
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

  useEffect(() => {
    if (!selectedShopId) return;
    const fetchItemStock = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://kulima.co.ke/api/diraja/item-stock-level?shop_id=${selectedShopId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        setItemStock(response.data.item_stocks || []);
        setError("");
      } catch (err) {
        console.error("Fetch stock error:", err);
        setError("Failed to fetch stock for selected shop.");
        setItemStock([]);
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

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleSubmitReport = async () => {
    if (!selectedShopId) {
      setMessage("❌ Please select a shop before submitting.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const reportData = {};
    itemStock.forEach((item) => {
      reportData[item.itemname] = `${item.total_remaining} ${item.metric}`;
    });

    const differences = {};
    differenceEntries.forEach((entry) => {
      differences[entry.itemname] = {
        actual: entry.actual,
        expected: entry.expected,
        difference: entry.difference,
        reason: entry.reason,
      };
    });

    if (Object.keys(differences).length > 0) {
      reportData["differences"] = differences;
    }

    const payload = {
      shop_id: selectedShopId,
      report: reportData,
    };

    try {
      const response = await axios.post("https://kulima.co.ke/api/diraja/report-stock", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      setMessage(response.data.message || "✅ Stock report submitted successfully.");
      setMessageType("success");
      setDifferenceEntries([]);
    } catch (err) {
      console.error("Submit report error:", err);
      setMessage(err.response?.data?.message || "❌ Failed to submit stock report.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDifference = () => {
    if (!selectedItemName || !expectedQty || !reason) return;

    const selectedItem = itemStock.find(
      (item) => item.itemname === selectedItemName
    );
    const actual = `${selectedItem.total_remaining} ${selectedItem.metric}`;
    const expected = expectedQty;
    const expectedNumber = parseFloat(expectedQty);
    const actualNumber = parseFloat(selectedItem.total_remaining);
    const difference = `${expectedNumber - actualNumber} ${selectedItem.metric}`;

    const newEntry = {
      itemname: selectedItemName,
      actual,
      expected,
      difference,
      reason,
    };

    setDifferenceEntries([...differenceEntries, newEntry]);

    // Reset fields
    setSelectedItemName("");
    setExpectedQty("");
    setReason("");
  };

  return (
    <div className="manager-report-container">
      <h2>Manager Report Stock</h2>

      {/* Error and Message Alerts */}
      {error && (
        <Stack sx={{ my: 2 }}>
          <Alert severity="error" variant="outlined">
            {error}
          </Alert>
        </Stack>
      )}
      {message && (
        <Stack sx={{ my: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <div className="top-stock">
        <label>Select Shop:</label>
        <select
          value={selectedShopId}
          onChange={(e) => setSelectedShopId(e.target.value)}
        >
          <option value="">-- Choose Shop --</option>
          {shops.map((shop) => (
            <option key={shop.shop_id} value={shop.shop_id}>
              {shop.shopname}
            </option>
          ))}
        </select>
      </div>

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

      {!loading && selectedShopId && (
        <>
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

          {/* Report Difference Button */}
          <div style={{ marginTop: "20px" }}>
            <button onClick={() => setShowDifferencePopup(true)} className="button">
              Report Differences
            </button>
          </div>

          {/* Differences Table (if any) */}
          {differenceEntries.length > 0 && (
            <div className="difference-table">
              <h4>Reported Differences</h4>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Expected</th>
                    <th>Actual</th>
                    <th>Difference</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {differenceEntries.map((entry, i) => (
                    <tr key={i}>
                      <td>{entry.itemname}</td>
                      <td>{entry.expected}</td>
                      <td>{entry.actual}</td>
                      <td>{entry.difference}</td>
                      <td>{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: "20px" }}>
            <button onClick={handleSubmitReport} disabled={submitting} className="button">
              {submitting ? "Submitting..." : "Submit Stock Report"}
            </button>
          </div>
        </>
      )}

      {/* Difference Report Popup */}
      {showDifferencePopup && (
        <div className="report-overlay">
          <div className="differences-report-form">
            <h3>Report Stock Differences</h3>

            <label>Select Item:</label>
            <select
              value={selectedItemName}
              onChange={(e) => setSelectedItemName(e.target.value)}
            >
              <option value="">-- Choose Item --</option>
              {itemStock.map((item) => (
                <option key={item.itemname} value={item.itemname}>
                  {item.itemname}
                </option>
              ))}
            </select>

            {selectedItemName && (
              <>
                <p>
                  <strong>Actual Stock:</strong>{" "}
                  {
                    itemStock.find((i) => i.itemname === selectedItemName)
                      .total_remaining
                  }{" "}
                  {
                    itemStock.find((i) => i.itemname === selectedItemName)
                      .metric
                  }
                </p>
              </>
            )}

            <label>Expected Quantity:</label>
            <input
              type="number"
              value={expectedQty}
              onChange={(e) => setExpectedQty(e.target.value)}
              placeholder="Enter expected quantity"
            />

            <label>Reason:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the discrepancy"
            />

            <div className="form-buttons">
              <button onClick={handleAddDifference}>Add Difference</button>
              <button onClick={() => setShowDifferencePopup(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReportStock;