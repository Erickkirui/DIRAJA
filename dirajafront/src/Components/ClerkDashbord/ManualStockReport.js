import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Alert,
  Stack,
  TextField,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const ManualStockReport = () => {
  const shopId = localStorage.getItem("shop_id");
  const [stockItems, setStockItems] = useState([]);
  const [shopStock, setShopStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [reportData, setReportData] = useState({});
  const navigate = useNavigate();

  // Fetch stock items and shop stock
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stock items
        const itemsResponse = await axios.get("api/diraja/stockitems", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const items = itemsResponse.data.stock_items || [];
        setStockItems(items);

        // Fetch shop stock to get items with quantity > 0
        const stockResponse = await axios.get(
          `api/diraja/item-stock-level?shop_id=${shopId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        const rawStock = stockResponse.data.item_stocks || [];
        
        // Group by itemname and sum total_remaining
        const grouped = rawStock.reduce((acc, stock) => {
          if (!acc[stock.itemname]) {
            acc[stock.itemname] = { ...stock };
          } else {
            acc[stock.itemname].total_remaining += stock.total_remaining;
          }
          return acc;
        }, {});

        const combinedStock = Object.values(grouped);
        
        // Filter only items with quantity > 0 and sort alphabetically
        const inStockItems = combinedStock
          .filter(stock => stock.total_remaining > 0)
          .sort((a, b) => a.itemname.localeCompare(b.itemname));

        setShopStock(inStockItems);

        // Initialize report data with zeros
        const initialReportData = {};
        inStockItems.forEach(stock => {
          initialReportData[stock.itemname] = "0";
        });
        setReportData(initialReportData);

      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage("Failed to load stock data.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const handleItemClick = (stock) => {
    const itemInfo = stockItems.find(item => item.item_name === stock.itemname);
    setEditingItem({
      ...stock,
      metric: itemInfo?.metric || "pcs",
      pack_quantity: itemInfo?.pack_quantity || 0
    });
    setEditQuantity(reportData[stock.itemname] || "0");
    setEditDialogOpen(true);
  };

  const handleSaveQuantity = () => {
    if (editingItem && editQuantity !== "") {
      const quantity = parseFloat(editQuantity);
      if (!isNaN(quantity) && quantity >= 0) {
        setReportData(prev => ({
          ...prev,
          [editingItem.itemname]: editQuantity
        }));
        setEditDialogOpen(false);
        setEditingItem(null);
        setEditQuantity("");
      } else {
        setMessage("Please enter a valid quantity");
        setMessageType("error");
      }
    }
  };

  const formatQuantityForBackend = (itemName, quantity) => {
    if (!quantity || isNaN(quantity) || parseFloat(quantity) === 0) {
      return null;
    }

    const qty = parseFloat(quantity);
    const itemInfo = stockItems.find(item => item.item_name === itemName);

    if (!itemInfo) {
      return `${qty} pcs`;
    }

    // For items with "kgs" metric, use "kg" in the report
    if (itemInfo.metric && itemInfo.metric.toLowerCase() === "kgs") {
      return `${qty} kg`;
    }

    // For eggs and other items with pack quantities, send the total quantity in pieces
    // The backend will handle the conversion
    return `${qty} ${itemInfo.metric || "pcs"}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Check if at least one item has quantity > 0
    const hasValidItems = Object.values(reportData).some(qty => parseFloat(qty) > 0);
    
    if (!hasValidItems) {
      setMessage("Please set quantities for at least one item");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    // Create report object with proper formatting for backend
    const finalReportData = {};
    Object.keys(reportData).forEach(itemName => {
      const formattedValue = formatQuantityForBackend(itemName, reportData[itemName]);
      if (formattedValue) {
        finalReportData[itemName] = formattedValue;
      }
    });

    // Debug: Log the payload before sending
    console.log("Submitting payload:", {
      shop_id: shopId,
      report: finalReportData
    });

    const payload = {
      shop_id: shopId,
      report: finalReportData
    };

    try {
      const response = await axios.post("api/diraja/report-stock", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          'Content-Type': 'application/json'
        },
      });

      setMessage(response.data.message || "✅ Stock report submitted successfully!");
      setMessageType("success");

      // Optional: Redirect after success
      setTimeout(() => {
        localStorage.setItem("report_status", "true");
        navigate("/depositcash");
      }, 2000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Failed to submit stock report.";
      setMessage(errorMsg);
      setMessageType("error");
      console.error("Submission error:", err.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayValue = (itemName, quantity) => {
    if (!quantity || isNaN(quantity)) return "0 pcs";
    
    const qty = parseFloat(quantity);
    const itemInfo = stockItems.find(item => item.item_name === itemName);

    if (!itemInfo) return `${qty} pcs`;

    // Kgs stay as kgs
    if (itemInfo.metric && itemInfo.metric.toLowerCase() === "kgs") {
      return `${qty} kgs`;
    }

    // Eggs → trays + pieces
    const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(qty / itemInfo.pack_quantity);
      const pieces = qty % itemInfo.pack_quantity;
      return trays > 0
        ? `${trays} tray${trays !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
        : `${pieces} pcs`;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(qty / itemInfo.pack_quantity);
      const pieces = qty % itemInfo.pack_quantity;
      return packets > 0
        ? `${packets} pkt${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
        : `${pieces} pcs`;
    }

    // Fallback
    return `${qty} ${itemInfo.metric || "pcs"}`;
  };

  return (
    <div>
        <h2 style={{ margin: "0 0 20px 0" }}>Stock Report </h2>
   

      <Alert severity="info" sx={{ mb: 3 }}>
        Click on any item in the table to set its quantity. Items start at 0 by default.
      </Alert>

      {message && (
        <Stack sx={{ mb: 3 }}>
          <Alert severity={messageType}>
            {message}
          </Alert>
        </Stack>
      )}

      {/* Stock Table */}
      <Box sx={{ mb: 3 }}>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Reported Quantity</th>
            </tr>
          </thead>
          <tbody className="batchnumber-size">
            {shopStock.length > 0 ? (
              shopStock.map((stock, index) => (
                <tr 
                  key={index} 
                  onClick={() => handleItemClick(stock)}
                  style={{ cursor: 'pointer', backgroundColor: parseFloat(reportData[stock.itemname] || 0) > 0 ? '#f0f8f0' : 'transparent' }}
                >
                  <td>{stock.itemname}</td>
                  <td>
                    {formatDisplayValue(stock.itemname, reportData[stock.itemname] || "0")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No items in stock.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {/* Edit Quantity Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Set Quantity for {editingItem?.itemname}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Quantity"
            type="number"
            value={editQuantity}
            onChange={(e) => setEditQuantity(e.target.value)}
            inputProps={{ min: 0, step: "any" }}
            fullWidth
            sx={{ mt: 2 }}
            helperText={`Enter quantity in ${editingItem?.metric || "pcs"}`}
          />
          {editQuantity && !isNaN(editQuantity) && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Will display as:</strong> {formatDisplayValue(editingItem?.itemname, editQuantity)}
              <br />
              <strong>Will send to backend as:</strong> {formatQuantityForBackend(editingItem?.itemname, editQuantity) || "0 (will be skipped)"}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveQuantity} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit and Back Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{ mt: 2 }}
        >
          {submitting ? "Submitting Report..." : "Submit Stock Report"}
        </Button>
      </Box>
    </div>
  );
};

export default ManualStockReport;