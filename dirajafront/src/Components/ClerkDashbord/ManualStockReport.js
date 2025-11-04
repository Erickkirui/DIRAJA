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
  DialogActions,
  Grid
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
  const [editPackets, setEditPackets] = useState("0");
  const [editPieces, setEditPieces] = useState("0");
  const [editQuantity, setEditQuantity] = useState("0");
  const [reportData, setReportData] = useState({});
  const navigate = useNavigate();

  // List of items that should use kg as metric and allow decimals
  const kgItems = [
    "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
    "liver", "gizzard", "neck", "feet", "wings", "broiler"
  ];

  // Check if item should use kg metric
  const shouldUseKg = (itemName) => {
    if (!itemName) return false;
    return kgItems.some(kgItem => 
      itemName.toLowerCase().includes(kgItem.toLowerCase())
    );
  };

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
            acc[stock.itemname] = { 
              ...stock,
              metric: stock.metric || "pcs",
              pack_quantity: stock.pack_quantity || 0
            };
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

  const parseQuantityToPacketsAndPieces = (itemName, quantity) => {
    const packQuantity = getItemPackQuantity(itemName);
    const qty = parseFloat(quantity) || 0;
    
    if (packQuantity > 0 && !shouldUseKg(itemName)) {
      const packets = Math.floor(qty / packQuantity);
      const pieces = qty % packQuantity;
      return { packets: packets.toString(), pieces: pieces.toString() };
    }
    
    return { packets: "0", pieces: qty.toString() };
  };

  const handleItemClick = (stock) => {
    const itemInfo = stockItems.find(item => item.item_name === stock.itemname);
    const editingItemData = {
      ...stock,
      metric: stock.metric || itemInfo?.metric || "pcs",
      pack_quantity: stock.pack_quantity || itemInfo?.pack_quantity || 0
    };
    
    setEditingItem(editingItemData);
    
    // Parse existing quantity to appropriate format
    const currentQuantity = reportData[stock.itemname] || "0";
    
    if (shouldUseKg(stock.itemname)) {
      // For kg items, use single input with decimal support
      setEditQuantity(currentQuantity);
      setEditPackets("0");
      setEditPieces("0");
    } else if (editingItemData.pack_quantity > 0) {
      // For items with pack quantity, use packets/pieces
      const { packets, pieces } = parseQuantityToPacketsAndPieces(stock.itemname, currentQuantity);
      setEditPackets(packets);
      setEditPieces(pieces);
      setEditQuantity("0");
    } else {
      // For other items, use single input
      setEditQuantity(currentQuantity);
      setEditPackets("0");
      setEditPieces("0");
    }
    
    setEditDialogOpen(true);
  };

  const calculateTotalQuantity = (packets, pieces, packQuantity) => {
    const pkts = parseInt(packets) || 0;
    const pcs = parseInt(pieces) || 0;
    return (pkts * packQuantity) + pcs;
  };

  const getTotalPiecesFromInput = () => {
    if (!editingItem) return 0;
    
    if (shouldUseKg(editingItem.itemname)) {
      return parseFloat(editQuantity) || 0;
    } else if (editingItem.pack_quantity > 0) {
      return calculateTotalQuantity(editPackets, editPieces, editingItem.pack_quantity);
    } else {
      return parseFloat(editQuantity) || 0;
    }
  };

  const handleSaveQuantity = () => {
    if (editingItem) {
      let totalQuantity;
      
      if (shouldUseKg(editingItem.itemname)) {
        // For kg items, validate decimal input
        const quantity = parseFloat(editQuantity);
        if (isNaN(quantity) || quantity < 0) {
          setMessage("Please enter a valid positive quantity");
          setMessageType("error");
          return;
        }
        totalQuantity = quantity;
      } else if (editingItem.pack_quantity > 0) {
        // For items with pack quantity, validate packets and pieces
        const packets = parseInt(editPackets) || 0;
        const pieces = parseInt(editPieces) || 0;
        
        if (packets < 0 || pieces < 0) {
          setMessage("Please enter valid positive quantities");
          setMessageType("error");
          return;
        }

        if (pieces >= editingItem.pack_quantity) {
          setMessage(`Pieces cannot be ${editingItem.pack_quantity} or more. Convert extra pieces to packets.`);
          setMessageType("error");
          return;
        }

        totalQuantity = calculateTotalQuantity(editPackets, editPieces, editingItem.pack_quantity);
      } else {
        // For other items
        const quantity = parseFloat(editQuantity);
        if (isNaN(quantity) || quantity < 0) {
          setMessage("Please enter a valid positive quantity");
          setMessageType("error");
          return;
        }
        totalQuantity = quantity;
      }

      setReportData(prev => ({
        ...prev,
        [editingItem.itemname]: totalQuantity.toString()
      }));
      setEditDialogOpen(false);
      setEditingItem(null);
      setEditPackets("0");
      setEditPieces("0");
      setEditQuantity("0");
    }
  };

  const getItemMetric = (itemName) => {
    if (!itemName) return "pcs";
    if (shouldUseKg(itemName)) {
      return "kgs";
    }
    
    const stockItem = shopStock.find(stock => stock.itemname === itemName);
    const itemInfo = stockItems.find(item => item.item_name === itemName);
    
    return stockItem?.metric || itemInfo?.metric || "pcs";
  };

  const getItemPackQuantity = (itemName) => {
    if (!itemName) return 0;
    if (shouldUseKg(itemName)) {
      return 0; // kg items don't use pack quantities
    }
    
    const stockItem = shopStock.find(stock => stock.itemname === itemName);
    const itemInfo = stockItems.find(item => item.item_name === itemName);
    
    return stockItem?.pack_quantity || itemInfo?.pack_quantity || 0;
  };

  const formatQuantityForBackend = (itemName, quantity) => {
    if (!quantity || isNaN(quantity) || parseFloat(quantity) === 0) {
      return null;
    }

    const qty = parseFloat(quantity);
    const metric = getItemMetric(itemName);

    return `${qty} ${metric}`;
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
    if (!quantity || isNaN(quantity) || parseFloat(quantity) === 0) {
      const metric = getItemMetric(itemName);
      const packQuantity = getItemPackQuantity(itemName);
      
      if (packQuantity > 0 && !shouldUseKg(itemName)) {
        return `0 ${itemName && itemName.toLowerCase().includes("egg") ? "trays" : "pkts"}, 0 pcs`;
      }
      return `0 ${metric}`;
    }
    
    const qty = parseFloat(quantity);
    const metric = getItemMetric(itemName);
    const packQuantity = getItemPackQuantity(itemName);

    // For kgs metric - display as entered with decimals
    if (metric.toLowerCase() === "kgs" || metric.toLowerCase() === "kg") {
      return `${qty} ${metric}`;
    }

    // For items with pack quantity → pkts + pcs
    if (packQuantity > 0) {
      const packets = Math.floor(qty / packQuantity);
      const pieces = qty % packQuantity;
      
      if (itemName && itemName.toLowerCase().includes("egg")) {
        return packets > 0
          ? `${packets} tray${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} eggs` : ""}`
          : `${pieces} eggs`;
      }
      
      return packets > 0
        ? `${packets} pkt${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
        : `${pieces} pcs`;
    }

    // For items without pack quantity, use the metric directly
    return `${qty} ${metric}`;
  };

  const getInputType = () => {
    if (!editingItem) return 'single';
    
    if (shouldUseKg(editingItem.itemname)) {
      return 'kg';
    } else if (editingItem.pack_quantity > 0) {
      return 'packets';
    } else {
      return 'single';
    }
  };

  // Safe function to check if item is eggs
  const isEggItem = (item) => {
    return item?.itemname?.toLowerCase().includes("egg") || false;
  };

  // Safe function to get metric
  const getEditingItemMetric = () => {
    return editingItem?.metric || "pcs";
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 20px 0" }}>Stock Report</h2>

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
              shopStock.map((stock, index) => {
                const packQuantity = getItemPackQuantity(stock.itemname);
                return (
                  <tr 
                    key={index} 
                    onClick={() => handleItemClick(stock)}
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: parseFloat(reportData[stock.itemname] || 0) > 0 ? '#f0f8f0' : 'transparent' 
                    }}
                  >
                    <td>{stock.itemname}</td>
                    
                    <td>
                      {formatDisplayValue(stock.itemname, reportData[stock.itemname] || "0")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="2">No items in stock.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {/* Edit Quantity Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Set Quantity for {editingItem?.itemname || "Item"}
        </DialogTitle>
        <DialogContent>
          {getInputType() === 'packets' ? (
            <>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    label={isEggItem(editingItem) ? "Trays" : "Packets"}
                    type="number"
                    value={editPackets}
                    onChange={(e) => setEditPackets(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                    fullWidth
                    helperText={`1 ${isEggItem(editingItem) ? "tray" : "pkt"} = ${editingItem?.pack_quantity || 0} pcs`}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Pieces"
                    type="number"
                    value={editPieces}
                    onChange={(e) => setEditPieces(e.target.value)}
                    inputProps={{ 
                      min: 0, 
                      max: (editingItem?.pack_quantity || 1) - 1,
                      step: 1 
                    }}
                    fullWidth
                    helperText={`Max ${(editingItem?.pack_quantity || 1) - 1} pieces`}
                  />
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Total Quantity:</strong> {getTotalPiecesFromInput()} pieces
                <br />
                <strong>Display:</strong> {formatDisplayValue(editingItem?.itemname, getTotalPiecesFromInput().toString())}
                <br />
                <strong>Backend:</strong> {formatQuantityForBackend(editingItem?.itemname, getTotalPiecesFromInput().toString()) || "0 (will be skipped)"}
              </Alert>
            </>
          ) : (
            <>
              <TextField
                autoFocus
                label="Quantity"
                type="number"
                value={getInputType() === 'kg' ? editQuantity : editPieces}
                onChange={(e) => {
                  if (getInputType() === 'kg') {
                    setEditQuantity(e.target.value);
                  } else {
                    setEditPieces(e.target.value);
                  }
                }}
                inputProps={{ 
                  min: 0, 
                  step: getInputType() === 'kg' ? "0.1" : "1" 
                }}
                fullWidth
                sx={{ mt: 2 }}
                helperText={`Enter quantity in ${getEditingItemMetric()}${getInputType() === 'kg' ? ' (decimals allowed)' : ''}`}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Will display as:</strong> {formatDisplayValue(editingItem?.itemname, getInputType() === 'kg' ? editQuantity : editPieces)}
                <br />
                <strong>Will send to backend as:</strong> {formatQuantityForBackend(editingItem?.itemname, getInputType() === 'kg' ? editQuantity : editPieces) || "0 (will be skipped)"}
              </Alert>
            </>
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