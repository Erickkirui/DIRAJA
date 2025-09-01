import React, { useEffect, useState } from "react";
import { Modal, Button, Input, Alert } from "antd";
import axios from "axios";

const PendingTransferPopup = ({ shopId }) => {
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [currentTransfer, setCurrentTransfer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [visible, setVisible] = useState(true);
  const [stockItems, setStockItems] = useState([]); // Added for item information

  // Fetch stock items
  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Authentication required");

        const response = await axios.get("/https://kulima.co.ke/api/diraja/stockitems", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStockItems(response.data.stock_items || []);
      } catch (err) {
        console.error("Failed to fetch stock items:", err);
      }
    };

    fetchStockItems();
  }, []);

  // Format quantity display (using metric from transfer data)
const formatQuantityDisplay = (transfer) => {
  if (!transfer) return `${transfer.quantity} pcs`;

  // Use the metric from the transfer data if available
  const metric = transfer.metric || "pcs";
  
  // Kgs stay as kgs
  if (metric && metric.toLowerCase() === "kg") {
    return `${transfer.quantity} kg`;
  }

  // If we have stock items, check for eggs and pack quantities
  if (stockItems.length > 0) {
    const itemInfo = stockItems.find((item) => item.item_name === transfer.itemname);
    
    if (itemInfo) {
      // Eggs → trays + pieces
      const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
      if (isEggs && itemInfo.pack_quantity > 0) {
        const trays = Math.floor(transfer.quantity / itemInfo.pack_quantity);
        const pieces = transfer.quantity % itemInfo.pack_quantity;
        
        return trays > 0
          ? `${trays} tray${trays !== 1 ? "s" : ""}${
              pieces > 0 ? `, ${pieces} pcs` : ""
            }`
          : `${pieces} pcs`;
      }

      // Other items with pack quantity → pkts + pcs
      if (itemInfo.pack_quantity > 0) {
        const packets = Math.floor(transfer.quantity / itemInfo.pack_quantity);
        const pieces = transfer.quantity % itemInfo.pack_quantity;
        
        return packets > 0
          ? `${packets} pkt${packets !== 1 ? "s" : ""}${
              pieces > 0 ? `, ${pieces} pcs` : ""
            }`
          : `${pieces} pcs`;
      }
    }
  }

  // Fallback - use the metric from transfer data
  return `${transfer.quantity} ${metric}`;
};

  // Fetch pending transfers for this shop
  useEffect(() => {
    const fetchPendingTransfers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Authentication required");

        const response = await axios.get("/https://kulima.co.ke/api/diraja/shoptoshoptransfers", {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: "pending", to_shop_id: shopId },
        });

        const transfers = response.data || [];
        setPendingTransfers(transfers);
        if (transfers.length > 0) {
          setCurrentTransfer(transfers[0]);
          setVisible(true);
        }
      } catch (err) {
        console.error("Failed to fetch transfers:", err);
        setError("Failed to load pending transfers");
      }
    };

    if (shopId) fetchPendingTransfers();
  }, [shopId]);

  const handleAction = async (action) => {
    if (!currentTransfer) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Authentication required");

      await axios.post(
        `/https://kulima.co.ke/api/diraja/confirm-transfer/${currentTransfer.id}`,
        {
          action,
          note: action === "decline" ? note : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove processed transfer & move to next
      const remaining = pendingTransfers.slice(1);
      setPendingTransfers(remaining);
      setCurrentTransfer(remaining.length > 0 ? remaining[0] : null);
      setNote("");
      setShowRejectInput(false);

      if (remaining.length === 0) {
        setVisible(false);
      }
    } catch (err) {
      console.error("Failed to process transfer:", err);
      setError(err.response?.data?.message || "Failed to process transfer");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (pendingTransfers.length > 0) {
        setVisible(true);
      }
    }, 30000);
  };

  return (
    <>
      {currentTransfer && (
        <Modal
          open={visible}
          title="Pending Stock Transfer"
          footer={null}
          closable={true}
          maskClosable={false}
          onCancel={handleClose}
        >
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          <p>
            <strong>Item:</strong> {currentTransfer.itemname}
          </p>
          <p>
            <strong>Quantity:</strong> {formatQuantityDisplay(currentTransfer)}
          </p>
          <p>
            <strong>From Shop:</strong> {currentTransfer.from_shop_name}
          </p>

          {showRejectInput && (
            <Input.TextArea
              placeholder="Enter reason for rejection"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ marginTop: 10, marginBottom: 10 }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              type="primary"
              onClick={() => handleAction("accept")}
              loading={loading}
            >
              Accept
            </Button>
            {!showRejectInput ? (
              <Button danger onClick={() => setShowRejectInput(true)}>
                Reject
              </Button>
            ) : (
              <Button
                danger
                onClick={() => handleAction("decline")}
                loading={loading}
                disabled={!note.trim()}
              >
                Confirm Reject
              </Button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default PendingTransferPopup;