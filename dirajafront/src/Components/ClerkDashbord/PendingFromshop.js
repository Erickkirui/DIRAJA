import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LoadingAnimation from "../LoadingAnimation";
import GeneralTableLayout from "../GeneralTableLayout";

const PendingFromShop = () => {
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


  // Process transfers to combine quantities for the same item from the same shop
  const processTransfers = useCallback((transfers, items) => {
    const combinedItems = {};
    
    transfers.forEach(transfer => {
      // Create a unique key by combining item name and shop ID
      const key = `${transfer.itemname}_${transfer.from_shop_id}`;
      
      if (!combinedItems[key]) {
        combinedItems[key] = {
          ...transfer,
          quantity: transfer.quantity,
          metric: transfer.metric,
          from_shop_name: transfer.from_shop_name,
          transfer_ids: [transfer.transfer_id], // Store all transfer IDs for this item/shop combo
          display: processQuantityDisplay(
            transfer.itemname, 
            transfer.quantity, 
            transfer.metric,
            items
          )
        };
      } else {
        // Combine quantities for the same item from the same shop
        combinedItems[key].quantity += transfer.quantity;
        combinedItems[key].display = processQuantityDisplay(
          transfer.itemname, 
          combinedItems[key].quantity, 
          transfer.metric,
          items
        );
        // Add this transfer ID to the list
        combinedItems[key].transfer_ids.push(transfer.transfer_id);
      }
    });
    
    return Object.values(combinedItems);
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
          `api/diraja/pending-transfers?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      ]);

      setStockItems(items);

      // Process transfers to combine quantities for the same item from the same shop
      const processedTransfers = processTransfers(transfersResponse.data || [], items);
      setPendingTransfers(processedTransfers);
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

  // Handle "Accept Transfer" for all batches of the same item from the same shop
  const handleAccept = async (transferIds, itemname, fromShopName) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      
      // Accept all transfers for this item from this specific shop
      for (const transferId of transferIds) {
        await axios.post(
          `api/diraja/confirm-transfer/${transferId}`,
          {
            action: "accept"
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
          }
        );
      }

      // Refresh list after accepting
      fetchPendingTransfers();
      alert(`All ${itemname} transfers from ${fromShopName} accepted successfully!`);
    } catch (err) {
      alert("Error accepting transfer. Please try again.");
      console.error("Accept transfer error:", err);
    }
  };
  // Handle "Decline Transfer" for all batches of the same item from the same shop
  const handleDecline = async (transferIds, itemname, fromShopName) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const note = window.prompt(`Reason for declining ${itemname} from ${fromShopName}:`, "");

      for (const transferId of transferIds) {
        await axios.patch(
          `api/diraja/decline-transfer/${transferId}`,
          {
            action: "decline",
            note: note || "No reason provided"
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
      fetchPendingTransfers();
      alert(`All ${itemname} transfers from ${fromShopName} declined successfully!`);
    } catch (err) {
      alert("Error declining transfer. Please try again.");
      console.error("Decline transfer error:", err);
    }
  };


  // Define table columns
  const columns = [
  { header: "Item", key: "itemname" },
  { header: "Quantity", key: "display" },
  { header: "From Shop", key: "from_shop_name" },
  {
    header: "Action",
    key: "action",
    render: (transfer) => (
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "3px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => handleAccept(transfer.transfer_ids, transfer.itemname, transfer.from_shop_name)}
        >
          Accept Transfer
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
          onClick={() => handleDecline(transfer.transfer_ids, transfer.itemname, transfer.from_shop_name)}
        >
          Decline Transfer
        </button>
      </div>
    ),
  },
];


  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="transfers-container">
  

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
        <p>No pending transfers from other shops.</p>
      )}
    </div>
  );
};

export default PendingFromShop;