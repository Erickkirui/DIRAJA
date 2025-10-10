import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

const AddInventory = () => {
  const [formData, setFormData] = useState({
    Suppliername: '',
    Supplier_location: '',
    email: '',
    phone_number: '',
    itemname: '',
    quantity: '',
    metric: 'kg',
    unitCost: '',     // auto-calculated
    amountPaid: '',
    unitPrice: '',
    note: '',
    created_at: '',
    paymentRef: '',
    source: '',
    unit_type: 'pieces', // pieces | pack
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [accounts, setAccounts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  // Fetch suppliers, accounts and stock items on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    const fetchSuppliers = async () => {
      try {
        const res = await axios.get('/api/diraja/all-suppliers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuppliers(res.data.suppliers || []);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };

    const fetchAccounts = async () => {
      try {
        const res = await axios.get('/api/diraja/all-acounts', {
          headers: { Authorization: `Bearer ${token}`, 'X-User-Role': 'manager' },
        });
        setAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };

    const fetchStockItems = async () => {
      try {
        const res = await axios.get('/api/diraja/stockitems', {
          headers: { Authorization: `Bearer ${token}`, 'X-User-Role': 'manager' },
        });
        setStockItems(Array.isArray(res.data.stock_items) ? res.data.stock_items : []);
      } catch (err) {
        console.error('Error fetching stock items:', err);
      }
    };

    fetchSuppliers();
    fetchAccounts();
    fetchStockItems();
  }, []);

  // Update selectedStockItem when itemname changes and reset unit_type + unitCost
  useEffect(() => {
    if (formData.itemname) {
      const found = stockItems.find(si => si.item_name === formData.itemname);
      setSelectedStockItem(found || null);

      // Reset unit_type when changing items
      setFormData(prev => ({
        ...prev,
        unit_type: 'pieces',
        unitCost: '' // recalc when amountPaid/quantity change
      }));
    } else {
      setSelectedStockItem(null);
    }
  }, [formData.itemname, stockItems]);

  // Utility to compute unitCost
  const computeUnitCost = (amountPaidVal, quantityVal, unitTypeVal) => {
    const amountPaidNum = parseFloat(amountPaidVal) || 0;
    const quantityNum = parseFloat(quantityVal) || 0;

    if (quantityNum <= 0) return '';

    if (unitTypeVal === 'pack' && selectedStockItem?.pack_quantity) {
      const packQty = parseFloat(selectedStockItem.pack_quantity) || 0;
      if (packQty <= 0) return ''; // avoid division by zero
      const totalPieces = quantityNum * packQty;
      return totalPieces > 0 ? (amountPaidNum / totalPieces).toFixed(2) : '';
    } else {
      return (amountPaidNum / quantityNum).toFixed(2);
    }
  };

  // Supplier input handler (autocomplete)
  const handleSupplierInput = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, Suppliername: value }));

    if (!value.trim()) {
      setFilteredSuppliers([]);
      setShowSupplierList(false);
      return;
    }

    const filtered = suppliers.filter(s =>
      s.supplier_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuppliers(filtered);
    setShowSupplierList(true);
  };

  const handleSelectSupplier = (supplier) => {
    setFormData(prev => ({
      ...prev,
      Suppliername: supplier.supplier_name,
      Supplier_location: supplier.supplier_location || '',
      email: supplier.email || '',
      phone_number: supplier.phone_number || ''
    }));
    setShowSupplierList(false);
  };

  // Generic field change handler with unitCost recalculation when needed
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // If any of these change, recalc unitCost
      if (['amountPaid', 'quantity', 'unit_type'].includes(name)) {
        updated.unitCost = computeUnitCost(updated.amountPaid, updated.quantity, updated.unit_type);
      }

      return updated;
    });
  };

  const isEggs = () => {
    return selectedStockItem?.item_name?.toLowerCase().includes('eggs');
  };

  const getQuantityPlaceholder = () => {
    const item = (formData.itemname || '').toLowerCase();
    if (item === 'broiler') return 'Quantity in kgs';
    return `Quantity in ${formData.unit_type === 'pack' ? (isEggs() ? 'trays' : 'packs') : 'pieces'}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.paymentRef || !formData.paymentRef.trim()) {
      setMessage('Payment reference must be provided.');
      setMessageType('error');
      return;
    }

    // compute final quantity (in pieces if pack selected)
    let finalQuantity = parseFloat(formData.quantity) || 0;
    if (formData.unit_type === 'pack' && selectedStockItem?.pack_quantity) {
      const packQty = parseFloat(selectedStockItem.pack_quantity) || 0;
      finalQuantity = finalQuantity * packQty;
    }

    // prevent division by zero
    const amountPaidNum = parseFloat(formData.amountPaid) || 0;
    const finalUnitCost = finalQuantity > 0 ? (amountPaidNum / finalQuantity) : 0;

    const numericFormData = {
      ...formData,
      quantity: finalQuantity,
      unitCost: finalUnitCost, // send as number
      amountPaid: amountPaidNum,
      unitPrice: parseFloat(formData.unitPrice) || 0,
    };

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('/api/diraja/v2/newinventory', numericFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Role': 'manager',
        }
      });

      setMessage(res.data.message || 'Inventory added successfully');
      setMessageType('success');

      // reset form
      setFormData({
        Suppliername: '',
        Supplier_location: '',
        email: '',
        phone_number: '',
        itemname: '',
        quantity: '',
        metric: 'kg',
        unitCost: '',
        amountPaid: '',
        unitPrice: '',
        note: '',
        created_at: '',
        paymentRef: '',
        source: '',
        unit_type: 'pieces',
      });
      setSelectedStockItem(null);
      setShowSupplierList(false);

    } catch (err) {
      console.error('Error adding inventory:', err);
      setMessage('Error adding inventory: ' + (err.response?.data?.message || err.message));
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
        {/* Supplier name with suggestions */}
        <div
          style={{
            position: "relative",
            marginBottom: "12px",
          }}
        >
          <input
            type="text"
            name="Suppliername"
            value={formData.Suppliername}
            onChange={handleSupplierInput}
            placeholder="Supplier Name"
            required
            autoComplete="off"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "15px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {showSupplierList && filteredSuppliers.length > 0 && (
            <ul
              style={{
                position: "absolute",
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                width: "100%",
                maxHeight: "160px",
                overflowY: "auto",
                zIndex: 10,
                listStyle: "none",
                padding: 0,
                marginTop: "4px",
              }}
            >
              {filteredSuppliers.map((s) => (
                <li
                  key={s.supplier_id}
                  onClick={() => handleSelectSupplier(s)}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: "white",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  {s.supplier_name} — {s.supplier_location}
                </li>
              ))}
            </ul>
          )}
        </div>


        {/* Supplier location, email, phone (autofilled if supplier selected) */}
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
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Supplier Email (optional)"
          className="input"
        />
        <input
          type="text"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Supplier Phone (optional)"
          className="input"
        />

        {/* Item selection */}
        <select
          name="itemname"
          value={formData.itemname}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Select Item</option>
          {stockItems.map(item => (
            <option key={item.id} value={item.item_name}>
              {item.item_name}
            </option>
          ))}
        </select>

        {/* Unit type selector (shows only if pack_quantity exists for the item) */}
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

        {/* Source (accounts) */}
        <select name="source" value={formData.source} onChange={handleChange} className="input">
          <option value="">Select Source</option>
          <option value="External funding">External funding</option>
          {accounts.map(account => (
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

        {/* Unit cost (read-only, auto-calculated) */}
        <div className="form-group">
          <input
            type="text"
            name="unitCost"
            value={formData.unitCost || ''}
            className="input"
            readOnly
            placeholder="Unit Cost (auto-calculated)"
          />
          <small className="text-muted">Calculated as: Total Amount Paid / Total Pieces</small>
        </div>

        <input
          type="number"
          name="unitPrice"
          value={formData.unitPrice}
          onChange={handleChange}
          placeholder="Unit price (per piece)"
          className="input"
          min="0"
          step="0.01"
          required
        />

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
