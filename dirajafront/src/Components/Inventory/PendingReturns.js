import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import GeneralTableLayout from "../GeneralTableLayout";

const PendingReturns = () => {
  const [pendingReturns, setPendingReturns] = useState([]);
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
    return `${formatNumber(quantity)} ${metric || "pcs"}`;
  }, []);

  // Process returns to combine quantities for the same item from the same shop
  const processReturns = useCallback((returns, items) => {
    const combinedItems = {};
    
    returns.forEach(returnItem => {
      // Create a unique key by combining item name and shop ID
      const key = `${returnItem.itemname}_${returnItem.shop_id}`;
      
      if (!combinedItems[key]) {
        combinedItems[key] = {
          ...returnItem,
          quantity: returnItem.quantity,
          metric: returnItem.metric,
          shop_name: returnItem.shop_name,
          return_ids: [returnItem.return_id], // Store all return IDs for this item/shop combo
          display: processQuantityDisplay(
            returnItem.itemname, 
            returnItem.quantity, 
            returnItem.metric,
            items
          )
        };
      } else {
        // Combine quantities for the same item from the same shop
        combinedItems[key].quantity += returnItem.quantity;
        combinedItems[key].display = processQuantityDisplay(
          returnItem.itemname, 
          combinedItems[key].quantity, 
          returnItem.metric,
          items
        );
        // Add this return ID to the list
        combinedItems[key].return_ids.push(returnItem.return_id);
      }
    });
    
    return Object.values(combinedItems);
  }, [processQuantityDisplay]);

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

  // Fetch pending returns
  const fetchPendingReturns = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setError("No access token found, please log in.");
        setLoading(false);
        return;
      }

      // Fetch both stock items and pending returns in parallel
      const [items, returnsResponse] = await Promise.all([
        fetchStockItems(),
        axios.get(
          `/api/diraja/returns/pending`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      ]);

      setStockItems(items);

      // Process returns to combine quantities for the same item from the same shop
      if (returnsResponse.data.pending_returns) {
        const processedReturns = processReturns(returnsResponse.data.pending_returns, items);
        setPendingReturns(processedReturns);
      } else {
        setPendingReturns([]);
      }
    } catch (err) {
      console.error("Error fetching pending returns:", err);
      setError("Error fetching pending returns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReturns();
  }, []);

  // Handle "Approve Return" for all batches of the same item from the same shop
  const handleApprove = async (returnIds, itemname, shopName) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      
      // Approve all returns for this item from this specific shop
      for (const returnId of returnIds) {
        await axios.patch(
          `/api/diraja/returns/${returnId}/approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
          }
        );
      }

      // Refresh list after approving
      fetchPendingReturns();
      alert(`All ${itemname} returns from ${shopName} approved successfully!`);
    } catch (err) {
      alert("Error approving return. Please try again.");
      console.error("Approve return error:", err);
    }
  };

  // Handle "Decline Return" for all batches of the same item from the same shop
  const handleDecline = async (returnIds, itemname, shopName) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const reason = window.prompt(`Reason for declining ${itemname} return from ${shopName}:`, "");

      if (reason === null) {
        return; // User cancelled
      }

      for (const returnId of returnIds) {
        await axios.patch(
          `/api/diraja/returns/${returnId}/decline`,
          {
            reason: reason || "No reason provided"
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
          }
        );
      }

      // Refresh list after declining
      fetchPendingReturns();
      alert(`All ${itemname} returns from ${shopName} declined successfully!`);
    } catch (err) {
      alert("Error declining return. Please try again.");
      console.error("Decline return error:", err);
    }
  };

  // Define table columns
  const columns = [
    { header: "Item", key: "itemname" },
    { header: "Quantity", key: "display" },
    { header: "Shop", key: "shopname" },
    { header: "Returned by", key: "returned_by_username" },
    { header: "Return Date", key: "return_date" },
    {
      header: "Action",
      key: "action",
      render: (returnItem) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px"
            }}
            onClick={() => handleApprove(returnItem.return_ids, returnItem.itemname, returnItem.shop_name)}
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
              fontSize: "14px"
            }}
            onClick={() => handleDecline(returnItem.return_ids, returnItem.itemname, returnItem.shop_name)}
          >
            Decline
          </button>
        </div>
      ),
    },
  ];

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="returns-container">
      <h2>Pending Returns</h2>
      
      {loading ? (
        <LoadingAnimation />
      ) : pendingReturns.length > 0 ? (
        <GeneralTableLayout
          data={pendingReturns}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No pending returns awaiting approval.</p>
      )}
    </div>
  );
};

export default PendingReturns;