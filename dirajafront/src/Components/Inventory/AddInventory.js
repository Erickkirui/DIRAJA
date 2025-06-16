import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

const AddInventory = () => {
  const [formData, setFormData] = useState({
    itemname: '',
    quantity: '',
    metric: 'kg',
    unitCost: '',
    amountPaid: '',
    unitPrice: '',
    Suppliername: '',
    Supplier_location: '',
    note: '',
    created_at: '',
    paymentRef: '',
    source: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [accounts, setAccounts] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('/api/diraja/all-acounts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (Array.isArray(response.data.accounts)) {
          setAccounts(response.data.accounts);
        } else {
          console.error('Accounts response is not an array');
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setMessage('Failed to fetch accounts.');
        setMessageType('error');
      }
    };

    const fetchStockItems = async () => {
      try {
        const response = await axios.get('/api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (Array.isArray(response.data.stock_items)) {
          setStockItems(response.data.stock_items);
        } else {
          console.error('Stock items response is not an array');
        }
      } catch (error) {
        console.error('Error fetching stock items:', error);
        setMessage('Failed to fetch stock items.');
        setMessageType('error');
      }
    };

    fetchAccounts();
    fetchStockItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };

    // Auto-calculate unitCost when amountPaid or quantity changes
    if (name === 'amountPaid' || name === 'quantity') {
      const quantity = parseFloat(updatedFormData.quantity) || 0;
      const amountPaid = parseFloat(updatedFormData.amountPaid) || 0;
      
      if (quantity > 0) {
        updatedFormData.unitCost = (amountPaid / quantity).toFixed(2);
      } else {
        updatedFormData.unitCost = '';
      }
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.paymentRef.trim()) {
      setMessage('Payment reference must be provided.');
      setMessageType('error');
      return;
    }

    // Ensure unitCost is calculated with current values before submission
    const quantity = parseFloat(formData.quantity) || 0;
    const amountPaid = parseFloat(formData.amountPaid) || 0;
    const finalUnitCost = quantity > 0 ? (amountPaid / quantity) : 0;

    const numericFormData = {
      ...formData,
      quantity: quantity,
      unitCost: finalUnitCost,
      amountPaid: amountPaid,
      unitPrice: parseFloat(formData.unitPrice) || 0,
    };

    try {
      const response = await axios.post('/api/diraja/newinventory', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      setMessage(response.data.message);
      setMessageType('success');

      setFormData({
        itemname: '',
        quantity: '',
        metric: 'kg',
        unitCost: '',
        amountPaid: '',
        unitPrice: '',
        Suppliername: '',
        Supplier_location: '',
        note: '',
        created_at: '',
        paymentRef: '',
        source: '',
      });
    } catch (error) {
      setMessage('Error adding inventory: ' + (error.response?.data?.message || error.message));
      setMessageType('error');
    }
  };

  return (
    <div>
      <h2>Add New Inventory</h2>

      {message && (
        <Stack sx={{ mb: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <form onSubmit={handleSubmit} className="form">
        <select
          name="itemname"
          value={formData.itemname}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Select Item</option>
          {stockItems.map((item) => (
            <option key={item.id} value={item.item_name}>
              {item.item_name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          className="input"
          min="0"
          step="0.01"
          required
        />

        <select
          name="metric"
          value={formData.metric}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="kg">Kilograms</option>
          <option value="litres">Litres</option>
          <option value="item">Items</option>
        </select>

        <select name="source" value={formData.source} onChange={handleChange} className="input">
          <option value="">Select Source</option>
          <option value="External funding">External funding</option>
          {accounts.map((account) => (
            <option key={account.account_id} value={account.Account_name}>
              {account.Account_name}
            </option>
          ))}
        </select>

        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Comments (Optional)"
          className="input"
        />


        <input
          type="number"
          name="amountPaid"
          value={formData.amountPaid}
          onChange={handleChange}
          placeholder="Total Amount Paid"
          className="input"
          min="0"
          step="0.01"
          required
        />

        <div className="form-group">
          <input
            type="number"
            name="unitCost"
            value={formData.unitCost || ''}
            className="input"
            readOnly
            placeholder="Unit Cost (Used to determine ideal sale per item)"
          />
          <small className="text-muted">
            Calculated as: Total Amount Paid / Quantity
          </small>
        </div>

        <input
          type="text"
          name="paymentRef"
          value={formData.paymentRef}
          onChange={handleChange}
          placeholder="Payment Ref (Transaction code)"
          className="input"
          required
        />

        <input
          type="number"
          name="unitPrice"
          value={formData.unitPrice}
          onChange={handleChange}
          placeholder="Unit price (Used to determine ideal sale price per item)"
          className="input"
          min="0"
          step="0.01"
          required
        />

        <input
          type="text"
          name="Suppliername"
          value={formData.Suppliername}
          onChange={handleChange}
          placeholder="Supplier Name"
          className="input"
          required
        />

        <input
          type="text"
          name="Supplier_location"
          value={formData.Supplier_location}
          onChange={handleChange}
          placeholder="Supplier Location"
          className="input"
          required
        />

        <input
          type="date"
          name="created_at"
          value={formData.created_at}
          onChange={handleChange}
          className="input"
          required
        />

        <button type="submit" className="button">
          Add Inventory
        </button>
      </form>
    </div>
  );
};

export default AddInventory;