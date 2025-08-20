import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { DatePicker, Alert, Tabs } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const ShopStockMovement = () => {
  const [movementData, setMovementData] = useState({
    transfers: [],
    spoilt_items: [],
    returns: [],
    shop_transfers: [],
  });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);
  const [daysBack, setDaysBack] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("transfers");

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    const fetchStockMovement = async () => {
      setLoading(true);
      setError("");

      try {
        if (!shopId) throw new Error("Shop ID not found in localStorage");

        const params = {
          shop_id: shopId,
        };

        if (dateRange && dateRange.length === 2) {
          params.from_date = dateRange[0].format("YYYY-MM-DD");
          params.end_date = dateRange[1].format("YYYY-MM-DD");
        } else {
          params.days = daysBack;
        }

        const res = await axios.get("/api/diraja/stock-movement", {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setMovementData(res.data);
      } catch (err) {
        console.error("Failed to fetch stock movement data", err);
        setError(
          err.response?.data?.message || err.message || "Failed to fetch stock movement data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStockMovement();
  }, [dateRange, daysBack, shopId]);

  const formatDate = (dateString) => {
    return dayjs(dateString).format("YYYY-MM-DD HH:mm");
  };

  const renderTable = (data, columns) => {
    if (!data || data.length === 0) {
      return (
        <div className="no-data">
          No data available for the selected period
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="inventory-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(item[col.dataIndex], item)
                      : item[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const transferColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "Batch Number", dataIndex: "batch_number", key: "batch_number" },
    {
      title: "Unit Cost",
      dataIndex: "unit_cost",
      key: "unit_cost",
      render: (cost) => (cost ? `ksh${cost.toFixed(2)}` : "-"),
    },
    {
      title: "Total Cost",
      dataIndex: "total_cost",
      key: "total_cost",
      render: (cost) => (cost ? `ksh${cost.toFixed(2)}` : "-"),
    },
    { title: "Date", dataIndex: "date", key: "date", render: formatDate },
    { title: "Destination", dataIndex: "destination", key: "destination" },
  ];

  const spoiltColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "Disposal Method", dataIndex: "disposal_method", key: "disposal_method" },
    { title: "Collector", dataIndex: "collector_name", key: "collector_name" },
    { title: "Comment", dataIndex: "comment", key: "comment" },
    { title: "Date", dataIndex: "date", key: "date", render: formatDate },
    { title: "Location", dataIndex: "location", key: "location" },
  ];

  const returnsColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { title: "Date", dataIndex: "date", key: "date", render: formatDate },
    { title: "Source", dataIndex: "source", key: "source" },
  ];

  const shopTransferColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "Date", dataIndex: "date", key: "date", render: formatDate },
    { title: "Source", dataIndex: "source", key: "source" },
    { title: "Destination", dataIndex: "destination", key: "destination" },
    {
      title: "Direction",
      dataIndex: "direction",
      key: "direction",
      render: (direction) => (
        <span className={`direction-${direction}`}>
          {direction.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="stock-movement-container">
      <div className="top-stock">
        <p>My Shop's Stock Movement</p>
        <RangePicker
          style={{ width: 280 }}
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates);
            if (dates && dates.length === 2) setDaysBack(null);
          }}
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

      {movementData.time_period && (
        <div style={{ margin: "12px 0", fontWeight: "bold" }}>
          Time Period: {movementData.time_period}
        </div>
      )}

      {loading && <LoadingAnimation />}

      {!loading && !error && (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={`Transfers (${movementData.transfers.length})`}
            key="transfers"
          >
            {renderTable(movementData.transfers, transferColumns)}
          </TabPane>
          <TabPane
            tab={`Spoilt Items (${movementData.spoilt_items.length})`}
            key="spoilt_items"
          >
            {renderTable(movementData.spoilt_items, spoiltColumns)}
          </TabPane>
          <TabPane
            tab={`Returns (${movementData.returns.length})`}
            key="returns"
          >
            {renderTable(movementData.returns, returnsColumns)}
          </TabPane>
          <TabPane
            tab={`Shop Transfers (${movementData.shop_transfers.length})`}
            key="shop_transfers"
          >
            {renderTable(movementData.shop_transfers, shopTransferColumns)}
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default ShopStockMovement;
