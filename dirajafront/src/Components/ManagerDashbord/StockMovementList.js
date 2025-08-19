import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { DatePicker, Select, Alert } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

// ✅ Set yesterday as default date
const yesterday = dayjs().subtract(1, "day");

const StockMovementList = () => {
  const [movements, setMovements] = useState({
    transfers: [],
    spoilt_items: [],
    returns: [],
    shop_transfers: [],
  });
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [dateRange, setDateRange] = useState([yesterday, yesterday]); // ✅ Default to yesterday
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch shops
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

  // ✅ Fetch stock movements
  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (dateRange.length === 2) {
          params.append("from_date", dateRange[0].format("YYYY-MM-DD"));
          params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
        }
        if (selectedShopId) {
          params.append("shop_id", selectedShopId);
        }

        const url = `/api/diraja/stock-movement?${params}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setMovements(res.data || {});
      } catch (err) {
        console.error("Failed to fetch stock movements", err);
        setError("Failed to fetch stock movement data");
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [selectedShopId, dateRange]);

  return (
    <div className="stock-level-container">
      <div className="top-stock">
        <p>Stock Movement</p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
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
          {/* Transfers */}
          <h4>Inventory Transfers</h4>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Metric</th>
                <th>Destination</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.transfers?.length > 0 ? (
                movements.transfers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.item_name}</td>
                    <td>{t.quantity}</td>
                    <td>{t.metric}</td>
                    <td>{t.destination}</td>
                    <td>{dayjs(t.date).format("YYYY-MM-DD HH:mm")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No transfers found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Spoilt Items */}
          <h4>Spoilt Items</h4>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Metric</th>
                <th>Disposal Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.spoilt_items?.length > 0 ? (
                movements.spoilt_items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.item_name}</td>
                    <td>{s.quantity}</td>
                    <td>{s.metric}</td>
                    <td>{s.disposal_method}</td>
                    <td>{dayjs(s.date).format("YYYY-MM-DD HH:mm")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No spoilt items found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Returns */}
          <h4>Returns</h4>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Source</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.returns?.length > 0 ? (
                movements.returns.map((r) => (
                  <tr key={r.id}>
                    <td>{r.item_name}</td>
                    <td>{r.quantity}</td>
                    <td>{r.reason}</td>
                    <td>{r.source}</td>
                    <td>{dayjs(r.date).format("YYYY-MM-DD HH:mm")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No returns found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Shop Transfers */}
          <h4>Shop Transfers</h4>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Metric</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Direction</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.shop_transfers?.length > 0 ? (
                movements.shop_transfers.map((st) => (
                  <tr key={st.id}>
                    <td>{st.item_name}</td>
                    <td>{st.quantity}</td>
                    <td>{st.metric}</td>
                    <td>{st.source}</td>
                    <td>{st.destination}</td>
                    <td>{st.direction}</td>
                    <td>{dayjs(st.date).format("YYYY-MM-DD HH:mm")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No shop transfers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockMovementList;
