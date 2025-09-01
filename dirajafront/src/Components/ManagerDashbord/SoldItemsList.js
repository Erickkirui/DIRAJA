import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { DatePicker, Select, Alert } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const yesterday = dayjs().subtract(1, "day");

const SoldItemsList = () => {
  const [soldItems, setSoldItems] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [dateRange, setDateRange] = useState([yesterday, yesterday]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch shops and stock items
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const shopsRes = await axios.get("https://kulima.co.ke/api/diraja/allshops", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const sortedShops = shopsRes.data.sort((a, b) =>
          a.shopname.localeCompare(b.shopname)
        );
        setShops(sortedShops);

        const itemsRes = await axios.get("https://kulima.co.ke/api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setStockItems(itemsRes.data.stock_items || []);
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError("Failed to load initial data");
      }
    };
    fetchInitialData();
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
          ? `https://kulima.co.ke/api/diraja/sold-items-summary/${selectedShopId}?${params}`
          : `https://kulima.co.ke/api/diraja/sold-items-summary?${params}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const rawItems = res.data.items || [];

        // ✅ Group by item_name and sum total_sold
        const grouped = rawItems.reduce((acc, item) => {
          if (!acc[item.item_name]) {
            acc[item.item_name] = { ...item };
          } else {
            acc[item.item_name].total_sold += item.total_sold;
          }
          return acc;
        }, {});

        const combinedItems = Object.values(grouped).map((item) => {
          const itemInfo = stockItems.find(
            (stockItem) => stockItem.item_name === item.item_name
          );

          // If no stockInfo, fallback
          if (!itemInfo) {
            return { ...item, display: `${item.total_sold} ${item.metric || "pcs"}` };
          }

          // KGs → show in kgs only
          if (item.metric && item.metric.toLowerCase() === "kgs") {
            return { ...item, display: `${item.total_sold} kgs` };
          }

          // Eggs → trays + pcs
          if (itemInfo.item_name.toLowerCase().includes("egg") && itemInfo.pack_quantity > 0) {
            const trays = Math.floor(item.total_sold / itemInfo.pack_quantity);
            const pieces = item.total_sold % itemInfo.pack_quantity;
            return {
              ...item,
              display:
                trays > 0
                  ? `${trays} tray${trays !== 1 ? "s" : ""}${
                      pieces > 0 ? `, ${pieces} pcs` : ""
                    }`
                  : `${pieces} pcs`,
            };
          }

          // Other items with pack_quantity → pkts + pcs
          if (itemInfo.pack_quantity > 0) {
            const packets = Math.floor(item.total_sold / itemInfo.pack_quantity);
            const pieces = item.total_sold % itemInfo.pack_quantity;
            return {
              ...item,
              display:
                packets > 0
                  ? `${packets} pkt${packets !== 1 ? "s" : ""}${
                      pieces > 0 ? `, ${pieces} pcs` : ""
                    }`
                  : `${pieces} pcs`,
            };
          }

          // Fallback
          return { ...item, display: `${item.total_sold} ${item.metric || "pcs"}` };
        });

        setSoldItems(combinedItems);
      } catch (err) {
        console.error("Failed to fetch sold items", err);
        setError("Failed to fetch sold item data");
      } finally {
        setLoading(false);
      }
    };

    if (stockItems.length > 0) {
      fetchSoldItems();
    }
  }, [selectedShopId, dateRange, stockItems]);

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
                    <td>{item.display}</td>
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
