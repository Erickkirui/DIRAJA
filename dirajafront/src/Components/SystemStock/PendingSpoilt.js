import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import GeneralTableLayout from "../GeneralTableLayout";

const PendingSpoiltStock = () => {
  const [pendingSpoilt, setPendingSpoilt] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [stockItems, setStockItems] = useState([]);

  // List of items that should always use "kg" as metric
  const kgItems = [
    "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
    "liver", "gizzard", "neck", "feet", "wings", "broiler"
  ];

  // Helper: format quantity without trailing .00
  const formatNumber = (num, decimals = 3) => {
    return Number(num) % 1 === 0 ? Number(num).toString() : Number(num).toFixed(decimals);
  };

  // Process quantity display like ShopStockList
  const processQuantityDisplay = useCallback((itemname, quantity, unit, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    // Always use kg for specific items regardless of incoming unit
    const shouldUseKg = kgItems.some(kgItem => 
      itemname.toLowerCase().includes(kgItem.toLowerCase())
    );

    if (shouldUseKg) {
      return `${formatNumber(quantity)} kg`;
    }

    if (!itemInfo) {
      return `${formatNumber(quantity)} ${unit || "pcs"}`;
    }

    // Kgs stay as kgs
    if (unit && unit.toLowerCase() === "kgs") {
      return `${formatNumber(quantity)} kgs`;
    }

    // Eggs → trays + pieces
    const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return trays > 0
        ? `${formatNumber(trays, 0)} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces, 0)} pcs` : ""
          }`
        : `${formatNumber(pieces, 0)} pcs`;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return packets > 0
        ? `${formatNumber(packets, 0)} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces, 0)} pcs` : ""
          }`
        : `${formatNumber(pieces, 0)} pcs`;
    }

    // Fallback
    return `${formatNumber(quantity)} ${unit || "pcs"}`;
  }, []);

  // Format disposal method for better display
  const formatDisposalMethod = (method) => {
    if (method === "depot") return "Sent to Depot";
    if (method === "waste disposer") return "Collected by Waste Disposer";
    return method;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort records by created_at date (newest first)
  const sortRecordsByNewest = (records) => {
    return records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // Fetch stock items for proper metric conversion
  const fetchStockItems = async () => {
    try {
      const response = await axios.get("/api/diraja/stockitems", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      return response.data.stock_items || [];
    } catch (err) {
      console.error("Error fetching stock items:", err);
      return [];
    }
  };

  // Fetch pending spoilt stock records
  const fetchPendingSpoiltStock = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setError("No access token found, please log in.");
        setLoading(false);
        return;
      }

      // Fetch both stock items and pending spoilt stock in parallel
      const [items, spoiltResponse] = await Promise.all([
        fetchStockItems(),
        axios.get("/api/diraja/spoilt/pending", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      ]);

      setStockItems(items);

      if (spoiltResponse.data.pending_records) {
        // Process each record for display and sort by newest first
        const processedRecords = spoiltResponse.data.pending_records.map(record => ({
          ...record,
          displayQuantity: processQuantityDisplay(record.item, record.quantity, record.unit, items),
          formattedDisposal: formatDisposalMethod(record.disposal_method),
          formattedDate: formatDate(record.created_at),
          clerk_name: record.clerk_id, // You might want to fetch clerk name separately
          // Keep original date for sorting
          originalDate: record.created_at
        }));
        
        // Sort records by newest first
        const sortedRecords = sortRecordsByNewest(processedRecords);
        setPendingSpoilt(sortedRecords);
      } else {
        setPendingSpoilt([]);
      }
    } catch (err) {
      console.error("Error fetching pending spoilt stock:", err);
      setError("Error fetching pending spoilt stock records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSpoiltStock();
  }, []);

  // Handle "Approve Spoilt Stock"
  const handleApprove = async (recordId, item, quantity) => {
    if (!window.confirm(`Are you sure you want to approve ${quantity} ${item} as spoilt? This action cannot be undone.`)) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      
      await axios.post(
        `/api/diraja/spoilt/${recordId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
        }
      );

      // Refresh list after approving
      fetchPendingSpoiltStock();
      alert(`${quantity} ${item} approved as spoilt stock successfully!`);
    } catch (err) {
      alert("Error approving spoilt stock. Please try again.");
      console.error("Approve spoilt stock error:", err);
    }
  };

  // Handle "Reject Spoilt Stock"
  const handleReject = async (recordId, item, quantity) => {
    const reason = window.prompt(`Reason for rejecting ${quantity} ${item} spoilt stock:`, "");

    if (reason === null) {
      return; // User cancelled
    }

    if (!reason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");
      
      await axios.post(
        `/api/diraja/spoilt/${recordId}/reject`,
        {
          reason: reason.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
        }
      );

      // Refresh list after rejecting
      fetchPendingSpoiltStock();
      alert(`${quantity} ${item} spoilt stock rejected successfully! Stock has been restored to inventory.`);
    } catch (err) {
      alert("Error rejecting spoilt stock. Please try again.");
      console.error("Reject spoilt stock error:", err);
    }
  };

  // Define table columns - add sort functionality to date column
  const columns = [
    { 
      header: "Clerk", 
      key: "clerk_username"  // You might want to fetch shop name
    },
    { 
      header: "Shop", 
      key: "shop_name"  // You might want to fetch shop name
    },
    { 
      header: "Item", 
      key: "item" 
    },
    { 
      header: "Quantity", 
      key: "displayQuantity" 
    },
    { 
      header: "Disposal Method", 
      key: "formattedDisposal" 
    },
    // { 
    //   header: "Collector", 
    //   key: "collector_name" 
    // },
    { 
      header: "Comment", 
      key: "comment" 
    },
    { 
      header: "Reported Date", 
      key: "formattedDate",
      // If your GeneralTableLayout supports sorting, you can add:
      // sortable: true,
      // sortKey: "originalDate"
    },
    {
      header: "Actions",
      key: "actions",
      render: (record) => (
        <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
          <button
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              width: "100%"
            }}
            onClick={() => handleApprove(record.id, record.item, record.quantity)}
          >
            Approve
          </button>

          <button
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              width: "100%"
            }}
            onClick={() => handleReject(record.id, record.item, record.quantity)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="spoilt-stock-container">
      <h2>Pending Spoilt Stock Approval</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        {/* These spoilt stock records have been deducted from inventory but require approval to be finalized. */}
        <br />
        <small>Showing newest records first</small>
      </p>
      
      {loading ? (
        <LoadingAnimation />
      ) : pendingSpoilt.length > 0 ? (
        <GeneralTableLayout
          data={pendingSpoilt}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p>No pending spoilt stock records awaiting approval.</p>
        </div>
      )}
    </div>
  );
};

export default PendingSpoiltStock;