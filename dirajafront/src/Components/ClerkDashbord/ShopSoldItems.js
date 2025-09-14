import React, { useEffect, useState } from "react";
import axios from "axios";
import { DatePicker, Alert } from "antd";
import dayjs from "dayjs";
import LoadingAnimation from "../LoadingAnimation";

const { RangePicker } = DatePicker;

const ShopSoldItems = () => {
  const [soldItems, setSoldItems] = useState([]);
  const [stockItems, setStockItems] = useState([]); // Add state for stock items
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, "day"),
    dayjs().subtract(1, "day"),
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const shopId = localStorage.getItem("shop_id");

  // Fetch stock items
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const itemsResponse = await axios.get("api/diraja/stockitems", {
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

  // Process sold items to display in appropriate units
  const processSoldItems = (soldItemsData, stockItemsData) => {
    return soldItemsData.map(item => {
      const itemInfo = stockItemsData.find(stockItem => stockItem.item_name === item.item_name);
      
      if (!itemInfo) return { ...item, display: `${item.total_sold} ${item.metric || 'pcs'}` };
      
      // If metric is kgs, don't convert to packets/pieces
      if (item.metric && item.metric.toLowerCase() === 'kgs') {
        return {
          ...item,
          display: `${item.total_sold} kgs`
        };
      }
      
      // For eggs and kienyeji eggs, display as trays and pieces
      const isEggs = itemInfo.item_name.toLowerCase().includes("eggs");
      if (isEggs && itemInfo.pack_quantity > 0) {
        const trays = Math.floor(item.total_sold / itemInfo.pack_quantity);
        const pieces = item.total_sold % itemInfo.pack_quantity;
        return {
          ...item,
          display: trays > 0 
            ? `${trays} tray${trays !== 1 ? 's' : ''}${pieces > 0 ? `, ${pieces} pcs` : ''}`
            : `${pieces} pcs`
        };
      }
      // For other items with pack quantity, display as packets and pieces
      else if (itemInfo.pack_quantity > 0) {
        const packets = Math.floor(item.total_sold / itemInfo.pack_quantity);
        const pieces = item.total_sold % itemInfo.pack_quantity;
        return {
          ...item,
          display: packets > 0
            ? `${packets} pkt${packets !== 1 ? 's' : ''}${pieces > 0 ? `, ${pieces} pcs` : ''}`
            : `${pieces} pcs`
        };
      }
      // For items without pack quantity, just display with their metric
      else {
        return {
          ...item,
          display: `${item.total_sold} ${item.metric || 'pcs'}`
        };
      }
    });
  };

  // Fetch sold items
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

        const url = `api/diraja/sold-items-summary/${shopId}?${params}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        // Process the sold items with proper display format
        const processedItems = processSoldItems(res.data.items || [], stockItems);
        setSoldItems(processedItems);
      } catch (err) {
        console.error("Error fetching sold items:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchSoldItems();
  }, [dateRange, shopId, stockItems]); // Added stockItems as dependency

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
                    <td>{item.display}</td> {/* Use the formatted display */}
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