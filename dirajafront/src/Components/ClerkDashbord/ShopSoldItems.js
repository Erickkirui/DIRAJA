import React, { useEffect, useState } from "react";
import axios from "axios";
import { DatePicker, Alert } from "antd";
import dayjs from "dayjs";
import LoadingAnimation from "../LoadingAnimation";

const { RangePicker } = DatePicker;

const ShopSoldItems = () => {
  const [soldItems, setSoldItems] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, "day"),
    dayjs().subtract(1, "day"),
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const shopId = localStorage.getItem("shop_id"); // 🔑 Get shop_id from localStorage

  useEffect(() => {
    const fetchSoldItems = async () => {
      setLoading(true);
      setError("");

      try {
        if (!shopId) throw new Error("Shop ID not found in localStorage");

        const params = new URLSearchParams();
        if (dateRange.length === 2) {
          params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
          params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
        }

        const url = `/api/diraja/sold-items-summary/${shopId}?${params}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setSoldItems(res.data.items || []);
      } catch (err) {
        console.error("Error fetching sold items:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchSoldItems();
  }, [dateRange, shopId]);

  return (
    <div>
      <div className="top-stock">
        <p>My Shop's Sold Items Summary</p>

        <RangePicker
          style={{ width: 280 }}
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          format="YYYY-MM-DD"
        />
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 12 }}
        />
      )}

      {loading && <LoadingAnimation />}
      {!loading && !error && (
        <div className="tab-content">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Total Sold</th>
              </tr>
            </thead>
            <tbody>
              {soldItems.length > 0 ? (
                soldItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.item_name}</td>
                    <td>
                      {item.total_sold} {item.metric}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No sold item data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShopSoldItems;
