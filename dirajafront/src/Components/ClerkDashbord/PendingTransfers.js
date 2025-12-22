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
  const [receivingItem, setReceivingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form data state
  const [formData, setFormData] = useState({
    pack_quantity: '',
    piece_quantity: '',
    metric: '',
    remainingStock: 0
  });

  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [displayQuantity, setDisplayQuantity] = useState('');

  // List of items that should always use "kg" as metric
  const kgItems = [
    "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
    "liver", "gizzard", "neck", "feet", "wings", "broiler"
  ];
  
  // Format numbers: no decimals if whole, else show up to 3 decimals
  const formatNumber = (value) => {
    return Number(value) % 1 === 0 ? Number(value).toString() : Number(value).toFixed(3);
  };

  // Get unit label (pack or tray)
  const getUnitLabel = () => {
    if (!selectedStockItem) return 'pack';
    if (selectedStockItem.item_name.toLowerCase().includes("eggs")) {
      return 'tray';
    }
    return 'pack';
  };

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

  // Start receiving process - show input modal
  const startReceiveProcess = (transfer) => {
    // Find stock item details
    const item = stockItems.find(stockItem => stockItem.item_name === transfer.itemname);
    setSelectedStockItem(item || null);
    
    // Set initial form data
    const initialFormData = {
      pack_quantity: '',
      piece_quantity: '',
      metric: transfer.metric || '',
      remainingStock: transfer.quantity || 0
    };

    // If item has pack quantity, auto-calculate packs/trays and pieces
    if (item && item.pack_quantity > 0) {
      const fullUnits = Math.floor(transfer.quantity / item.pack_quantity);
      const remainingPieces = transfer.quantity % item.pack_quantity;
      
      if (item.item_name.toLowerCase().includes("eggs")) {
        initialFormData.pack_quantity = fullUnits > 0 ? fullUnits.toString() : '';
      } else {
        initialFormData.pack_quantity = fullUnits > 0 ? fullUnits.toString() : '';
      }
      initialFormData.piece_quantity = remainingPieces > 0 ? remainingPieces.toString() : '';
    } else {
      // For items without pack quantity, show quantity in piece_quantity
      initialFormData.piece_quantity = transfer.quantity.toString();
    }

    setFormData(initialFormData);
    setReceivingItem(transfer);
    setMessage({ type: '', text: '' });
  };

  // Cancel receiving process
  const cancelReceive = () => {
    setReceivingItem(null);
    setFormData({
      pack_quantity: '',
      piece_quantity: '',
      metric: '',
      remainingStock: 0
    });
    setSelectedStockItem(null);
    setDisplayQuantity('');
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only numbers and decimal points for quantity fields
    if ((name === 'pack_quantity' || name === 'piece_quantity') && value !== '') {
      if (!/^\d*\.?\d*$/.test(value)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate display quantity
  useEffect(() => {
    if (receivingItem && selectedStockItem) {
      const remaining = receivingItem.quantity;

      if (selectedStockItem.item_name.toLowerCase().includes("eggs")) {
        const packQty = selectedStockItem.pack_quantity > 0 
          ? selectedStockItem.pack_quantity 
          : 30;
        const trays = Math.floor(remaining / packQty);
        const pieces = remaining % packQty;

        setDisplayQuantity(
          trays > 0
            ? `${trays} tray${trays !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`
        );
      } else if (selectedStockItem.pack_quantity > 0) {
        const packets = Math.floor(remaining / selectedStockItem.pack_quantity);
        const pieces = remaining % selectedStockItem.pack_quantity;

        setDisplayQuantity(
          packets > 0
            ? `${packets} pkt${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`
        );
      } else {
        setDisplayQuantity(`${remaining} ${receivingItem.metric || "pcs"}`);
      }
    }
  }, [receivingItem, selectedStockItem]);

  // Handle "Receive Stock" with quantity input
  const handleReceive = async (e) => {
    e.preventDefault();
    
    if (!receivingItem) return;

    // Calculate final quantity
    let finalQuantity;
    if (selectedStockItem && selectedStockItem.pack_quantity > 0) {
      let packs = parseFloat(formData.pack_quantity || 0);
      let pieces = parseFloat(formData.piece_quantity || 0);
      finalQuantity = (packs * selectedStockItem.pack_quantity) + pieces;
    } else {
      finalQuantity = parseFloat(formData.piece_quantity || 0);
    }

    // Validate input
    if (isNaN(finalQuantity) || finalQuantity <= 0) {
      setMessage({ type: 'error', text: 'Quantity must be greater than 0' });
      return;
    }

    if (finalQuantity > parseFloat(receivingItem.quantity)) {
      setMessage({ type: 'error', text: 'Quantity exceeds transferred amount' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const accessToken = localStorage.getItem("access_token");
      
      await axios.patch(
        `api/diraja/transfers/${receivingItem.transferv2_id}/receive`,
        { received_quantity: finalQuantity },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Refresh list after receiving
      fetchPendingTransfers();
      
      // Reset state
      cancelReceive();
      
      setMessage({ type: 'success', text: `${receivingItem.itemname} stock received successfully!` });
    } catch (err) {
      console.error("Receive stock error:", err);
      
      // Show more specific error messages
      if (err.response) {
        if (err.response.status === 400 && err.response.data.message) {
          setMessage({ type: 'error', text: `Error: ${err.response.data.message}` });
        } else {
          setMessage({ type: 'error', text: "Error receiving stock. Please try again." });
        }
      } else {
        setMessage({ type: 'error', text: "Network error. Please check your connection." });
      }
    } finally {
      setIsSubmitting(false);
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
      setMessage({ type: 'success', text: `${itemname} stock declined successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: "Error declining stock. Please try again." });
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
            onClick={() => startReceiveProcess(transfer)}
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

      {/* Receiving Modal */}
      {receivingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3>Receive {receivingItem.itemname}</h3>

            {message.text && (
              <div className={`message ${message.type}`} style={{
                marginBottom: '20px',
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
                color: message.type === 'error' ? '#721c24' : '#155724',
                border: `1px solid ${message.type === 'error' ? '#f5c6cb' : '#c3e6cb'}`
              }}>
                {message.text}
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Expected Quantity:</strong> {receivingItem.display}</p>
              <p><strong>Batch Number:</strong> {receivingItem.BatchNumber}</p>
              <p><strong>Transfer Date:</strong> {receivingItem.formattedDate}</p>
            </div>

            <form onSubmit={handleReceive}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Quantity Received
                </label>
                
                {/* Show pack quantity input only for items with pack quantity */}
                {selectedStockItem && selectedStockItem.pack_quantity > 0 ? (
                  <>
                    <div style={{ display: "flex", gap: "10px", marginBottom: '10px' }}>
                      <input
                        name="pack_quantity"
                        type="text"
                        value={formData.pack_quantity}
                        onChange={handleChange}
                        placeholder={`No. of ${getUnitLabel()}s`}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '5px',
                          border: '1px solid #ccc',
                          fontSize: '16px'
                        }}
                      />
                      <input
                        name="piece_quantity"
                        type="text"
                        value={formData.piece_quantity}
                        onChange={handleChange}
                        placeholder="No. of pieces"
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '5px',
                          border: '1px solid #ccc',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    <small style={{ color: '#666', display: 'block' }}>
                      1 {getUnitLabel()} = {selectedStockItem.pack_quantity} pieces
                    </small>
                  </>
                ) : (
                  // Show only piece quantity input for items without pack quantity
                  <input
                    name="piece_quantity"
                    type="text"
                    value={formData.piece_quantity}
                    onChange={handleChange}
                    placeholder="Quantity"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      fontSize: '16px',
                      marginBottom: '10px'
                    }}
                  />
                )}
              </div>

              {receivingItem && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Transfer Details
                  </label>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ marginBottom: '5px' }}>
                      <strong>Transferred Quantity:</strong> {displayQuantity}
                    </li>
                    {receivingItem.metric && (
                      <li style={{ marginBottom: '5px' }}>
                        <strong>Metric:</strong> {receivingItem.metric}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={cancelReceive}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Receive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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