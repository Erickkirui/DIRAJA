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
    unit_type: 'pieces', // New field for pack/piece selection
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [accounts, setAccounts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('https://kulima.co.ke/api/diraja/all-acounts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'X-User-Role': 'manager',
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
        const response = await axios.get('https://kulima.co.ke/api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'X-User-Role': 'manager',
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

  // Update selectedStockItem when itemname changes
  useEffect(() => {
    if (formData.itemname) {
      const item = stockItems.find(stockItem => stockItem.item_name === formData.itemname);
      setSelectedStockItem(item || null);
      
      // Reset unit_type to pieces when changing items
      setFormData(prev => ({
        ...prev,
        unit_type: 'pieces'
      }));
    }
  }, [formData.itemname, stockItems]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };

    if (name === 'amountPaid' || name === 'quantity' || name === 'unit_type') {
      const quantity = parseFloat(updatedFormData.quantity) || 0;
      const amountPaid = parseFloat(updatedFormData.amountPaid) || 0;

      if (quantity > 0) {
        // If using pack unit type and pack quantity is available
        if (updatedFormData.unit_type === 'pack' && selectedStockItem?.pack_quantity) {
          const packQuantity = parseFloat(selectedStockItem.pack_quantity);
          updatedFormData.unitCost = (amountPaid / (quantity * packQuantity)).toFixed(2);
        } else {
          updatedFormData.unitCost = (amountPaid / quantity).toFixed(2);
        }
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

    let finalQuantity = parseFloat(formData.quantity) || 0;
    
    // Convert to pieces if using pack unit type
    if (formData.unit_type === 'pack' && selectedStockItem?.pack_quantity) {
      const packQuantity = parseFloat(selectedStockItem.pack_quantity);
      finalQuantity = finalQuantity * packQuantity;
    }

    const amountPaid = parseFloat(formData.amountPaid) || 0;
    const finalUnitCost = finalQuantity > 0 ? (amountPaid / finalQuantity) : 0;

    const numericFormData = {
      ...formData,
      quantity: finalQuantity, // Send the converted quantity
      unitCost: finalUnitCost,
      amountPaid: amountPaid,
      unitPrice: parseFloat(formData.unitPrice) || 0,
    };

    try {
      const response = await axios.post('https://kulima.co.ke/api/diraja/v2/newinventory', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'X-User-Role': 'manager',
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
        unit_type: 'pieces',
      });
      
      setSelectedStockItem(null);
    } catch (error) {
      setMessage('Error adding inventory: ' + (error.response?.data?.message || error.message));
      setMessageType('error');
    }
  };

  // Determine if the selected item is eggs
  const isEggs = () => {
    return selectedStockItem?.item_name?.toLowerCase().includes('eggs');
  };

  // Determine placeholder text for quantity input
  const getQuantityPlaceholder = () => {
    if (formData.itemname.toLowerCase() === 'broiler') {
      return 'Quantity in kgs';
    }
    return `Quantity in ${formData.unit_type === 'pack' ? (isEggs() ? 'trays' : 'packs') : 'pieces'}`;
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

        {/* Unit type selector - only show if item has pack quantity */}
        {selectedStockItem && selectedStockItem.pack_quantity && (
          <div className="form-group">
            <label>Select Unit Type:</label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={handleChange}
              className="input"
            >
              <option value="pieces">Pieces</option>
              <option value="pack">{isEggs() ? 'Trays' : 'Packs'}</option>
            </select>
            {formData.unit_type === 'pack' && (
              <small className="text-muted">
                1 {isEggs() ? 'tray' : 'pack'} = {selectedStockItem.pack_quantity} pieces
              </small>
            )}
          </div>
        )}

        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder={getQuantityPlaceholder()}
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

        {/* <div className="form-group">
          <input
            type="number"
            name="unitCost"
            value={formData.unitCost || ''}
            className="input"
            readOnly
            placeholder="Unit Cost (per piece)"
          />
          <small className="text-muted">
            Calculated as: Total Amount Paid / Total Pieces
          </small>
        </div> */}

        <input
          type="text"
          name="paymentRef"
          value={formData.paymentRef}
          onChange={handleChange}
          placeholder="Payment Ref (Transaction code)"
          className="input"
          required
        />

        {/* <input
          type="number"
          name="unitPrice"
          value={formData.unitPrice}
          onChange={handleChange}
          placeholder="Unit price (per piece)"
          className="input"
          min="0"
          step="0.01"
          required
        /> */}

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