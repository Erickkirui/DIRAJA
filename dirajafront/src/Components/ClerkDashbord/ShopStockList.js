import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";

const ShopStockList = () => {
  const shopId = localStorage.getItem("shop_id");
  const [itemStock, setItemStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inStock");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const fetchShopStock = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/diraja/item-stock-level?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        setItemStock(response.data.item_stocks || []);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data for this shop.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopStock();
  }, [shopId]);

  const filteredStock = itemStock.filter((stock) =>
    activeTab === "inStock"
      ? stock.total_remaining > 0
      : stock.total_remaining === 0
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

 const handleSubmitReport = async () => {
  setSubmitting(true);
  setSubmitMessage("");

  const reportData = {};
  itemStock.forEach((item) => {
    reportData[item.itemname] = `${item.total_remaining} ${item.metric}`;
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

    // ✅ Report submitted successfully
    setSubmitMessage("✅ Stock report submitted successfully.");

    // 🟢 Update localStorage status
    localStorage.setItem("report_status", "true");

  } catch (err) {
    console.error("Submit report error:", err);
    setSubmitMessage("❌ Failed to submit stock report.");
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div>
      <h2>My Shop Stock</h2>

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

          {/* Submit Report Button */}
          <div style={{ marginTop: "20px" }}>
            <button onClick={handleSubmitReport} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Stock Report"}
            </button>
            {submitMessage && (
              <p style={{ marginTop: "10px" }}>{submitMessage}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ShopStockList;
