import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";

const ShopStatusList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const fetchShopStatuses = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/diraja/allshops", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const sorted = response.data.sort((a, b) =>
        a.shopname.localeCompare(b.shopname)
      );
      setShops(sorted);
    } catch (err) {
      setError("Failed to load shop statuses.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopStatuses();
  }, []);

  const handleReset = async () => {
    setResetLoading(true);
    setResetMessage("");
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.put(
        "/api/diraja/reset-report",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResetMessage(response.data.message);
      fetchShopStatuses(); // Refresh statuses after reset
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset report status");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="stock-level-container">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold">Shop Statuses</p>
        <button
          onClick={handleReset}
          disabled={resetLoading}
          className={`px-4 py-2 rounded text-white ${
            resetLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {resetLoading ? "Resetting..." : "Reset Reports"}
        </button>
      </div>

      {resetMessage && (
        <div className="p-2 mb-3 rounded bg-green-100 text-green-700">
          {resetMessage}
        </div>
      )}
      {error && <p className="error">{error}</p>}

      {loading && <LoadingAnimation />}

      {!loading && !error && (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.shop_id}>
                <td>{shop.shopname}</td>
                <td>
                  <span
                    className={
                      shop.report_status ? "status-open" : "status-closed"
                    }
                  >
                    {shop.report_status ? "Open" : "Closed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    
  );
};

export default ShopStatusList;
