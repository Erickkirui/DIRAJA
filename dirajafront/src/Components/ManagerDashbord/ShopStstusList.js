import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";

const ShopStatusList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShopStatuses = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        // Filter only active shops
        const activeShops = response.data
          .filter((shop) => shop.shopstatus === "active")
          .sort((a, b) => a.shopname.localeCompare(b.shopname));

        setShops(activeShops);
      } catch (err) {
        setError("Failed to load shop statuses.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopStatuses();
  }, []);

  return (
    <div className="stock-level-container">
      <p>Active Shop Statuses</p>

      {loading && <LoadingAnimation />}
      {error && <p className="error">{error}</p>}

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
