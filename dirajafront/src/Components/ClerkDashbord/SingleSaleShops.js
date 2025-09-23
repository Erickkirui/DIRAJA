import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import CapturePayment from "./CapturePayment";
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

const SingleSaleShop = () => {
  const { shopId, salesId } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stockItems, setStockItems] = useState([]);
  const [redirectTimer, setRedirectTimer] = useState(null);

  // Function to format quantity display
  const formatQuantityDisplay = (item) => {
    const stockItem = stockItems.find(si => si.item_name === item.item_name);
    
    if (!stockItem) return `${item.quantity} ${item.metric || "pcs"}`;

    // Kgs stay as kgs
    if (item.metric && item.metric.toLowerCase() === "kgs") {
      return `${item.quantity} kgs`;
    }

    // Eggs → trays + pieces
    const isEggs = item.item_name.toLowerCase().includes("egg");
    if (isEggs && stockItem.pack_quantity > 0) {
      const trays = Math.floor(item.quantity / stockItem.pack_quantity);
      const pieces = item.quantity % stockItem.pack_quantity;
      
      return trays > 0
        ? `${trays} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${pieces} pcs` : ""
          }`
        : `${pieces} pcs`;
    }

    // Other items with pack quantity → pkts + pcs
    if (stockItem.pack_quantity > 0) {
      const packets = Math.floor(item.quantity / stockItem.pack_quantity);
      const pieces = item.quantity % stockItem.pack_quantity;
      
      return packets > 0
        ? `${packets} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${pieces} pcs` : ""
          }`
        : `${pieces} pcs`;
    }

    // Fallback
    return `${item.quantity} ${item.metric || "pcs"}`;
  };

  // Handle payment success with redirect
  const handlePaymentSuccess = () => {
    setMessageType('success');
    setMessage('Payment successful! Redirecting to shop credit...');
    
    // Clear any existing timer
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    
    // Set a new timer to redirect after 2 seconds
    const timer = setTimeout(() => {
      navigate('/shopcredit');
    }, 2000);
    
    setRedirectTimer(timer);
    
    // Also refresh the sale details
    fetchSaleDetails();
  };

  const fetchSaleDetails = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("Missing authentication token.");
        setLoading(false);
        return;
      }

      if (!shopId || !salesId) {
        setError("Invalid shop ID or sale ID.");
        setLoading(false);
        return;
      }

      // Fetch stock items first
      const itemsResponse = await axios.get("/api/diraja/stockitems", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setStockItems(itemsResponse.data.stock_items || []);

      // Fetch sale details
      const response = await axios.get(
        `/api/diraja/sale/${shopId}/${salesId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && response.data.sale) {
        const formattedSale = {
          ...response.data.sale,
          created_at: new Date(response.data.sale.created_at).toLocaleDateString(), // Remove time
          payment_methods: response.data.sale.payment_methods.map((pm) => ({
            ...pm,
            created_at: new Date(pm.created_at).toLocaleDateString(), // Remove time
          })),
          sold_items: response.data.sale.sold_items || [],
        };

        setSale(formattedSale);
      } else {
        setError("Sale details not found.");
      }
    } catch (error) {
      console.error("Error fetching sale details:", error);
      setError("Could not fetch sale details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleDetails();
    
    // Clean up the timer when component unmounts
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [shopId, salesId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" style={{ marginLeft: '10px' }}>
          Loading sale details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" variant="outlined" style={{ margin: '20px' }}>
        {error}
      </Alert>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'unpaid':
        return 'error';
      case 'partially_paid':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="sale-details" style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Sale Details
      </Typography>
      
      {sale ? (
        <>
          <Paper elevation={2} style={{ padding: '20px', marginBottom: '20px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Chip 
                label={sale.status} 
                color={getStatusColor(sale.status)} 
                variant="outlined"
              />
              <Typography variant="body2">
                <strong>Sale Date:</strong> {sale.created_at}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body1">
                <strong>Total Amount Paid:</strong> Ksh {sale.total_amount_paid}
              </Typography>
              <Typography variant="body1">
                <strong>Amount due:</strong> Ksh {sale.balance}
              </Typography>
            </Box>
          </Paper>

          <Paper elevation={2} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider style={{ marginBottom: '15px' }} />
            <Box display="flex" flexDirection="column">
              <Typography variant="body1">
                <strong>Name:</strong> {sale.customer_name || "N/A"}
              </Typography>
              <Typography variant="body1">
                <strong>Number:</strong> {sale.customer_number || "N/A"}
              </Typography>
            </Box>
          </Paper>

          <Paper elevation={2} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Item Details
            </Typography>
            <Divider style={{ marginBottom: '15px' }} />
            {sale.sold_items.length > 0 ? (
              <List>
                {sale.sold_items.map((item, index) => (
                  <ListItem key={index} divider={index < sale.sold_items.length - 1}>
                    <ListItemText
                      primary={item.item_name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            Quantity: {formatQuantityDisplay(item)}
                          </Typography>
                          <br />
                          {/* <Typography component="span" variant="body2">
                            Unit Price: Ksh {item.unit_price}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            Total Price: Ksh {sale.total_price}
                          </Typography> */}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2">No sold items found for this sale.</Typography>
            )}
          </Paper>

          <Paper elevation={2} style={{ padding: '20px', marginBottom: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            <Divider style={{ marginBottom: '15px' }} />
            {sale.payment_methods.length > 0 ? (
              <List>
                {sale.payment_methods.map((payment, index) => (
                  <ListItem key={index} divider={index < sale.payment_methods.length - 1}>
                    <ListItemText
                      primary={`Payment Method: ${payment.payment_method}`}
                      secondary={
                        payment.payment_method !== "not payed" ? (
                          <>
                            <Typography component="span" variant="body2">
                              Amount: Ksh {payment.amount_paid}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Payment Date: {payment.created_at}
                            </Typography>
                          </>
                        ) : null
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2">No payment history available.</Typography>
            )}
          </Paper>

          {message && (
            <Stack style={{ marginBottom: '20px' }}>
              <Alert severity={messageType} variant="outlined">
                {message}
              </Alert>
            </Stack>
          )}

          {/* Integrating CapturePayment Component with success handler */}
          <CapturePayment saleId={salesId} onPaymentSuccess={handlePaymentSuccess} />
        </>
      ) : (
        <Alert severity="info" variant="outlined">
          No sale details available.
        </Alert>
      )}
    </div>
  );
};

export default SingleSaleShop;