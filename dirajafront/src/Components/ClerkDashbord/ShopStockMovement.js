import React, { useState, useEffect } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import { DatePicker, Alert, Select } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const ShopStockMovement = () => {
  const [movementData, setMovementData] = useState({
    transfers: [],
    spoilt_items: [],
    returns: [],
    shop_transfers: [],
  });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, "day"), // Yesterday as start date
    dayjs().subtract(1, "day"), // Yesterday as end date
  ]);
  const [daysBack, setDaysBack] = useState(1); // Set to 1 day back
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("transfers");
  const [stockItems, setStockItems] = useState([]); // Added for stock items metadata

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        if (!shopId) throw new Error("Shop ID not found in localStorage");

        // Fetch stock items metadata
        const itemsRes = await axios.get('api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const stockItemsData = itemsRes.data.stock_items || [];
        setStockItems(stockItemsData);

        const params = { shop_id: shopId };

        if (dateRange && dateRange.length === 2) {
          params.from_date = dateRange[0].format("YYYY-MM-DD");
          params.end_date = dateRange[1].format("YYYY-MM-DD");
        } else {
          params.days = daysBack;
        }

        const res = await axios.get("api/diraja/stock-movement", {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        // Apply display formatting to all movement data
        const formattedData = {
          transfers: formatMovementData(res.data.transfers || [], stockItemsData),
          spoilt_items: formatMovementData(res.data.spoilt_items || [], stockItemsData),
          returns: formatMovementData(res.data.returns || [], stockItemsData),
          shop_transfers: formatMovementData(res.data.shop_transfers || [], stockItemsData),
        };

        setMovementData(formattedData);
      } catch (err) {
        console.error("Failed to fetch stock movement data", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch stock movement data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, daysBack, shopId]);

  // Helper function to format quantity display
  const formatQuantityDisplay = (quantity, metric, itemInfo) => {
    // If metric is kgs, display directly
    if (metric && metric.toLowerCase() === "kgs") {
      return `${quantity} kgs`;
    }

    // Eggs logic → trays and pieces
    if (
      itemInfo.item_name.toLowerCase().includes("eggs") &&
      (itemInfo.pack_quantity > 0 || !itemInfo.pack_quantity)
    ) {
      const packQty =
        itemInfo.pack_quantity && itemInfo.pack_quantity > 0
          ? itemInfo.pack_quantity
          : 30; // default tray size
      const trays = Math.floor(quantity / packQty);
      const pieces = quantity % packQty;
      return trays > 0
        ? `${trays} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${pieces} pcs` : ""
          }`
        : `${pieces} pcs`;
    }

    // Other items with pack_quantity → pkts and pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return packets > 0
        ? `${packets} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${pieces} pcs` : ""
          }`
        : `${pieces} pcs`;
    }

    // Default
    return `${quantity} ${metric || "pcs"}`;
  };

  // Format movement data with display properties
  const formatMovementData = (data, stockItemsData) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item) => {
      const itemInfo = stockItemsData.find(
        (stockItem) => stockItem.item_name === item.item_name
      );

      if (!itemInfo) {
        return {
          ...item,
          display: `${item.quantity} ${item.metric || "pcs"}`,
        };
      }

      // Format display for quantity
      const display = formatQuantityDisplay(item.quantity, item.metric, itemInfo);

      return {
        ...item,
        display: display,
      };
    });
  };

  const renderTable = (data, columns) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available for the selected period</div>;
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

  // Column definitions with updated render functions
  const transferColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => record.display || `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "Date", dataIndex: "created_at", key: "created_at", 
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' 
    },
    { title: "Type", dataIndex: "transfer_type", key: "transfer_type", 
      render: (type) => type || 'From Store' 
    },
  ];

  const spoiltColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => record.display || `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "Disposal Method", dataIndex: "disposal_method", key: "disposal_method" },
    { title: "Collector", dataIndex: "collector_name", key: "collector_name" },
    { title: "Comment", dataIndex: "comment", key: "comment" },
    { title: "Location", dataIndex: "location", key: "location" },
    { title: "Date", dataIndex: "created_at", key: "created_at", 
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' 
    },
  ];

  const returnsColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => record.display || `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { title: "Source", dataIndex: "source", key: "source" },
    { title: "Date", dataIndex: "created_at", key: "created_at", 
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' 
    },
  ];

  const shopTransferColumns = [
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => record.display || `${quantity} ${record.metric || "pcs"}`,
    },
    { title: "From Shop", dataIndex: "source_shop_name", key: "source_shop_name" },
    { title: "To Shop", dataIndex: "destination_shop_name", key: "destination_shop_name" },
    {
      title: "Direction",
      dataIndex: "direction",
      key: "direction",
      render: (direction, record) => {
        const currentShopId = parseInt(localStorage.getItem('shop_id'));
        const isIncoming = record.destination_shop_id === currentShopId;
        const isOutgoing = record.source_shop_id === currentShopId;
        
        let displayDirection = direction;
        let className = 'direction-unknown';
        
        if (isIncoming) {
          displayDirection = 'INCOMING';
          className = 'direction-incoming';
        } else if (isOutgoing) {
          displayDirection = 'OUTGOING';
          className = 'direction-outgoing';
        }
        
        return (
          <span className={className}>
            {displayDirection}
          </span>
        );
      },
    },
    { title: "Date", dataIndex: "created_at", key: "created_at", 
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' 
    },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  // Map tabs to dropdown options
  const tabOptions = {
    transfers: {
      label: `Store Transfers (${movementData.transfers.length})`,
      columns: transferColumns,
      data: movementData.transfers,
    },
    spoilt_items: {
      label: `Spoilt Items (${movementData.spoilt_items.length})`,
      columns: spoiltColumns,
      data: movementData.spoilt_items,
    },
    returns: {
      label: `Returns (${movementData.returns.length})`,
      columns: returnsColumns,
      data: movementData.returns,
    },
    shop_transfers: {
      label: `Shop Transfers (${movementData.shop_transfers.length})`,
      columns: shopTransferColumns,
      data: movementData.shop_transfers,
    },
  };

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

      {loading && <LoadingAnimation />}

      {!loading && !error && (
        <>
          {/* ✅ Dropdown instead of tabs */}
          <Select
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            style={{ width: 250, marginBottom: 16 }}
          >
            {Object.entries(tabOptions).map(([key, option]) => (
              <Option key={key} value={key}>
                {option.label}
              </Option>
            ))}
          </Select>

          {/* ✅ Render selected table */}
          {renderTable(tabOptions[activeTab].data, tabOptions[activeTab].columns)}
        </>
      )}
    </div>
  );
};

export default ShopStockMovement;