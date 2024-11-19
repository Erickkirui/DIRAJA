import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UpdateInventory = ({ inventoryId, onUpdateSuccess }) => {
  const [inventoryData, setInventoryData] = useState({
    itemname: '',
    quantity: 0,
    metric: '',
    unitCost: 0,
    amountPaid: 0,
    unitPrice: 0,
    Suppliername: '',
    Supplier_location: '',
    note: '',
    created_at: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get(`/api/diraja/inventory/${inventoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setInventoryData(response.data);
      } catch (err) {
        setError('Error fetching inventory data.');
      }
    };

    fetchInventory();
  }, [inventoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInventoryData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem('access_token');
      await axios.put(`/api/diraja/inventory/${inventoryId}`, inventoryData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSuccess('Inventory updated successfully.');
      onUpdateSuccess();
    } catch (err) {
      setError('Error updating inventory.');
    }
  };

  return (
    <div>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Item Name:</label>
          <input
            type="text"
            name="itemname"
            value={inventoryData.itemname}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Quantity:</label>
          <input
            type="number"
            name="quantity"
            value={inventoryData.quantity}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Metric:</label>
          <input
            type="text"
            name="metric"
            value={inventoryData.metric}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Unit Cost (Ksh):</label>
          <input
            type="number"
            name="unitCost"
            value={inventoryData.unitCost}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Amount Paid (Ksh):</label>
          <input
            type="number"
            name="amountPaid"
            value={inventoryData.amountPaid}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Unit Price (Ksh):</label>
          <input
            type="number"
            name="unitPrice"
            value={inventoryData.unitPrice}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Supplier Name:</label>
          <input
            type="text"
            name="Suppliername"
            value={inventoryData.Suppliername}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Supplier Location:</label>
          <input
            type="text"
            name="Supplier_location"
            value={inventoryData.Supplier_location}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Note:</label>
          <textarea
            name="note"
            value={inventoryData.note}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="date"
            name="created_at"
            value={inventoryData.created_at}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Update Inventory</button>
      </form>
    </div>
  );
};

export default UpdateInventory;
