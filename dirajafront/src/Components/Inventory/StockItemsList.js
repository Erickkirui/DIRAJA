// src/components/StockItemsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/GeneralTableLayout.css';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

const StockItemsList = () => {
  const [stockItems, setStockItems] = useState([]);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    item_code: '',
    unit_price: 0,
    pack_price: 0,
    pack_quantity: 0
  });

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setError('User is not authenticated');
      return;
    }

    try {
      const response = await axios.get('https://kulima.co.ke/api/diraja/stockitems', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        setStockItems(response.data.stock_items || []);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message);
      } else {
        setError('An error occurred while fetching stock items');
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      item_code: item.item_code,
      unit_price: item.unit_price,
      pack_price: item.pack_price,
      pack_quantity: item.pack_quantity
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('price') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSaveChanges = async () => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    setError('User is not authenticated');
    return;
  }

  try {
    // Prepare data with proper numeric types
    const requestData = {
      item_name: formData.item_name,
      item_code: formData.item_code,
      unit_price: Number(formData.unit_price),
      pack_price: Number(formData.pack_price),
      pack_quantity: Number(formData.pack_quantity)
    };

    // Match the backend endpoint exactly
    const response = await axios.put(
      `api/diraja/stockitems/${editingItem.id}`,  // Changed to match backend
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Full response:', response);

    if (response.status === 200) {
      setStockItems(prevItems =>
        prevItems.map(item =>
          item.id === editingItem.id ? { ...item, ...requestData } : item
        )
      );
      handleCloseEditDialog();
    }
  } catch (error) {
    console.error('Update error:', error);
    if (error.response) {
      setError(error.response.data.message || error.response.data.error || 'Failed to update item');
    } else {
      setError('Network error - could not connect to server');
    }
  }
};

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Item Name', key: 'item_name' },
    { header: 'Item Code', key: 'item_code' },
    { header: 'Unit Price', key: 'unit_price', format: (value) => `$${value?.toFixed(2) || '0.00'}` },
    { header: 'Pack Price', key: 'pack_price', format: (value) => `$${value?.toFixed(2) || '0.00'}` },
    { header: 'Pack Quantity', key: 'pack_quantity' },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => (
        <Button
          variant="contained"
          color="primary"
          size="small"
          style={{ minWidth: 'auto', padding: '2px 8px' }}
          onClick={() => handleEditClick(item)}
        >
          Edit
        </Button>
      ),
    }
  ];

  return (
    <div className="stock-items-list">
      {error && <p className="error-message">{error}</p>}
      {!error && (
        <>
          <GeneralTableLayout 
            data={stockItems} 
            columns={columns} 
            tableTitle="Stock Items"
            emptyMessage="No stock items available"
          />
          
          {/* Edit Dialog */}
          <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
            <DialogTitle>Edit Stock Item</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Item Name"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Item Code"
                name="item_code"
                value={formData.item_code}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Unit Price"
                name="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Pack Price"
                name="pack_price"
                type="number"
                value={formData.pack_price}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="Pack Quantity"
                name="pack_quantity"
                type="number"
                value={formData.pack_quantity}
                onChange={handleInputChange}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog}>Cancel</Button>
              <Button onClick={handleSaveChanges} color="primary">Save</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default StockItemsList;