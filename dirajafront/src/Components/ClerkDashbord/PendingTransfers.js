import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import GeneralTableLayout from "../GeneralTableLayout";

const PendingTransfers = () => {
  const [pendingTransfers, setPendingTransfers] = useState([]);
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
  
  // Format numbers: no decimals if whole, else show up to 3 decimals
  const formatNumber = (value) => {
    return Number(value) % 1 === 0 ? Number(value).toString() : Number(value).toFixed(3);
  };

  // Process quantity display like ShopStockList
  const processQuantityDisplay = useCallback((itemname, quantity, metric, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    // Always use kg for specific items regardless of incoming metric
    const shouldUseKg = kgItems.some(kgItem => 
      itemname.toLowerCase().includes(kgItem.toLowerCase())
    );

    if (shouldUseKg) {
      return `${formatNumber(quantity)} kg`;
    }

    if (!itemInfo) {
      return `${formatNumber(quantity)} ${metric || "pcs"}`;
    }

    // Kgs stay as kgs
    if (metric && metric.toLowerCase() === "kgs") {
      return `${formatNumber(quantity)} kgs`;
    }

    // Eggs → trays + pieces
    const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return trays > 0
        ? `${formatNumber(trays)} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
          }`
        : `${formatNumber(pieces)} pcs`;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return packets > 0
        ? `${formatNumber(packets)} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
          }`
        : `${formatNumber(pieces)} pcs`;
    }

    // Fallback
    return `${formatNumber(quantity)} ${metric || "pcs"}`;
  }, []);

  // Process transfers to show each instance separately with formatted display
  const processTransfers = useCallback((transfers, items) => {
    return transfers.map(transfer => ({
      ...transfer,
      display: processQuantityDisplay(
        transfer.itemname, 
        transfer.quantity, 
        transfer.metric,
        items
      ),
      formattedDate: new Date(transfer.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [processQuantityDisplay]);

  // Fetch stock items for proper metric conversion
  const fetchStockItems = async () => {
    try {
      const response = await axios.get("api/diraja/stockitems", {
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

  // Fetch pending transfers
  const fetchPendingTransfers = async () => {
    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      const accessToken = localStorage.getItem("access_token");
      const shopId = localStorage.getItem("shop_id");

      if (!accessToken) {
        setError("No access token found, please log in.");
        setLoading(false);
        return;
      }

      if (!shopId) {
        setError("No shop ID found in local storage.");
        setLoading(false);
        return;
      }

      // Fetch both stock items and pending transfers in parallel
      const [items, transfersResponse] = await Promise.all([
        fetchStockItems(),
        axios.get(
          `api/diraja/transfers/pending?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      ]);

      setStockItems(items);

      // Check if the response has data - the backend returns {"pending_transfers": []}
      if (transfersResponse.data && transfersResponse.data.pending_transfers) {
        // Process transfers to show each instance separately with proper metric conversion
        const processedTransfers = processTransfers(transfersResponse.data.pending_transfers, items);
        setPendingTransfers(processedTransfers);
      } else {
        setPendingTransfers([]);
      }
    } catch (err) {
      console.error("Error fetching pending transfers:", err);
      setError("Error fetching pending transfers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  // Handle "Receive Stock" for a specific transfer
  const handleReceive = async (transferv2_id, itemname) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      
      await axios.patch(
        `api/diraja/transfers/${transferv2_id}/receive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Refresh list after receiving
      fetchPendingTransfers();
      alert(`${itemname} stock received successfully!`);
    } catch (err) {
      alert("Error receiving stock. Please try again.");
      console.error("Receive stock error:", err);
    }
  };

  // Handle "Decline Stock" for a specific transfer
  const handleDecline = async (transferv2_id, itemname) => {
    if (!window.confirm(`Are you sure you want to decline ${itemname} stock?`)) {
      return;
    }

    try {
      const accessToken = localStorage.getItem("access_token");

      await axios.patch(
        `api/diraja/transfers/${transferv2_id}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Refresh list after declining
      fetchPendingTransfers();
      alert(`${itemname} stock declined successfully!`);
    } catch (err) {
      alert("Error declining stock. Please try again.");
      console.error("Decline stock error:", err);
    }
  };

  // Define table columns
  const columns = [
    { header: "Item", key: "itemname" },
    { header: "Quantity", key: "display" },
    { header: "Transfer Date", key: "formattedDate" },
    {
      header: "Action",
      key: "action",
      render: (transfer) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onClick={() => handleReceive(transfer.transferv2_id, transfer.itemname)}
          >
            Receive
          </button>
          <button
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onClick={() => handleDecline(transfer.transferv2_id, transfer.itemname)}
          >
            Decline
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="transfers-container">
      <h2>Pending Transfers from store</h2>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <LoadingAnimation />
      ) : pendingTransfers.length > 0 ? (
        <GeneralTableLayout
          data={pendingTransfers}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No pending transfers found.</p>
      )}
    </div>
  );
};

export default PendingTransfers;