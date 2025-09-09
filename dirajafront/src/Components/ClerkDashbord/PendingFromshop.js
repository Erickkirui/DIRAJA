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

  // Process quantity display like ShopStockList
const processQuantityDisplay = useCallback((itemname, quantity, metric, items) => {
  const itemInfo = items.find((item) => item.item_name === itemname);

  // Always use kg for specific items regardless of incoming metric
  const shouldUseKg = kgItems.some(kgItem => 
    itemname.toLowerCase().includes(kgItem.toLowerCase())
  );

  if (shouldUseKg) {
    return `${Number(quantity).toFixed(3)} kg`;
  }

  if (!itemInfo) {
    return `${Number(quantity).toFixed(3)} ${metric || "pcs"}`;
  }

  // Kgs stay as kgs
  if (metric && metric.toLowerCase() === "kgs") {
    return `${Number(quantity).toFixed(3)} kgs`;
  }

  // Eggs → trays + pieces
  const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
  if (isEggs && itemInfo.pack_quantity > 0) {
    const trays = Math.floor(quantity / itemInfo.pack_quantity);
    const pieces = quantity % itemInfo.pack_quantity;
    return trays > 0
      ? `${Number(trays).toFixed(3)} tray${trays !== 1 ? "s" : ""}${
          pieces > 0 ? `, ${Number(pieces).toFixed(3)} pcs` : ""
        }`
      : `${Number(pieces).toFixed(3)} pcs`;
  }

  // Other items with pack quantity → pkts + pcs
  if (itemInfo.pack_quantity > 0) {
    const packets = Math.floor(quantity / itemInfo.pack_quantity);
    const pieces = quantity % itemInfo.pack_quantity;
    return packets > 0
      ? `${Number(packets).toFixed(3)} pkt${packets !== 1 ? "s" : ""}${
          pieces > 0 ? `, ${Number(pieces).toFixed(3)} pcs` : ""
        }`
      : `${Number(pieces).toFixed(3)} pcs`;
  }

  // Fallback
  return `${Number(quantity).toFixed(3)} ${metric || "pcs"}`;
}, []);


  // Process transfers to combine quantities for the same item
  const processTransfers = useCallback((transfers, items) => {
    const combinedItems = {};
    
    transfers.forEach(transfer => {
      const key = transfer.itemname;
      
      if (!combinedItems[key]) {
        combinedItems[key] = {
          ...transfer,
          quantity: transfer.quantity,
          metric: transfer.metric,
          from_shop_name: transfer.from_shop_name,
          transfer_id: transfer.transfer_id, // Keep the first transfer ID for action
          display: processQuantityDisplay(
            transfer.itemname, 
            transfer.quantity, 
            transfer.metric,
            items
          )
        };
      } else {
        // Combine quantities for the same item
        combinedItems[key].quantity += transfer.quantity;
        combinedItems[key].display = processQuantityDisplay(
          transfer.itemname, 
          combinedItems[key].quantity, 
          transfer.metric,
          items
        );
      }
    });
    
    return Object.values(combinedItems);
  }, [processQuantityDisplay]);

  // Fetch stock items for proper metric conversion
  const fetchStockItems = async () => {
    try {
      const response = await axios.get("https://kulima.co.ke/api/diraja/stockitems", {
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
          `https://kulima.co.ke/api/diraja/pending-transfers?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      ]);

      setStockItems(items);

      // Process transfers to combine quantities for the same item with proper metric conversion
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

  // Handle "Accept Transfer" for all batches of the same item
  const handleAccept = async (transferId, itemname) => {
    try {
      const accessToken = localStorage.getItem("access_token");
      
      // First, get all transfers for this item to accept them all
      const response = await axios.get(
        `https://kulima.co.ke/api/diraja/pending-transfers?shop_id=${localStorage.getItem("shop_id")}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      // Find all transfer IDs for this item
      const itemTransfers = (response.data || []).filter(
        transfer => transfer.itemname === itemname
      );
      
      // Accept all transfers for this item
      for (const transfer of itemTransfers) {
        await axios.post(
          `https://kulima.co.ke/api/diraja/confirm-transfer/${transfer.transfer_id}`,
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
      alert(`All ${itemname} transfers accepted successfully!`);
    } catch (err) {
      alert("Error accepting transfer. Please try again.");
      console.error("Accept transfer error:", err);
    }
  };

  // Define table columns
  const columns = [
    { header: "Item", key: "itemname" },
    {
      header: "Quantity",
      key: "display",
    },
    { header: "From Shop", key: "from_shop_name" },
    {
      header: "Action",
      key: "action",
      render: (transfer) => (
        <button
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "6px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => handleAccept(transfer.transfer_id, transfer.itemname)}
        >
          Accept Transfer
        </button>
      ),
    },
  ];

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="transfers-container">
      <h2>Pending Transfers From Other Shops</h2>

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