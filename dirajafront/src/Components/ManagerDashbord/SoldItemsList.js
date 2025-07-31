import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { DatePicker, Select, Alert } from "antd";
import dayjs from "dayjs"; // ✅ Import dayjs

const { RangePicker } = DatePicker;
const { Option } = Select;

// ✅ Set yesterday as default date
const yesterday = dayjs().subtract(1, "day");

const SoldItemsList = () => {
  const [soldItems, setSoldItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [dateRange, setDateRange] = useState([yesterday, yesterday]); // ✅ Default to yesterday
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axios.get("/api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const sortedShops = res.data.sort((a, b) =>
          a.shopname.localeCompare(b.shopname)
        );
        setShops(sortedShops);
      } catch (err) {
        console.error("Failed to load shops", err);
        setError("Failed to load shop list");
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    const fetchSoldItems = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (dateRange.length === 2) {
          params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
          params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
        }

        const url = selectedShopId
          ? `/api/diraja/sold-items-summary/${selectedShopId}?${params}`
          : `/api/diraja/sold-items-summary?${params}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setSoldItems(res.data.items || []);
      } catch (err) {
        console.error("Failed to fetch sold items", err);
        setError("Failed to fetch sold item data");
      } finally {
        setLoading(false);
      }
    };

    fetchSoldItems();
  }, [selectedShopId, dateRange]);

  return (
    <div className="stock-level-container">
      <div className="top-stock">
        <p>Sold Items Summary</p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Select
            value={selectedShopId}
            onChange={setSelectedShopId}
            style={{ width: 200 }}
            placeholder="Select shop"
            allowClear
          >
            <Option value="">All Shops</Option>
            {shops.map((shop) => (
              <Option key={shop.shop_id} value={shop.shop_id}>
                {shop.shopname}
              </Option>
            ))}
          </Select>

          <RangePicker
            style={{ width: 280 }}
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            format="YYYY-MM-DD"
          />
        </div>
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

export default SoldItemsList;
