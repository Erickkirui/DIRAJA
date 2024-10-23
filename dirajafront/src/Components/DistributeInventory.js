import React, { useState } from 'react';
import axios from 'axios';

const DistributeInventory = () => {
  const [formData, setFormData] = useState({
    shop_id: '',
    inventory_id: '',
    quantity: '',
    itemname: '',
    unitCost: '',
    amountPaid: '',
    BatchNumber: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert string inputs to numbers where necessary
    const numericFormData = {
      ...formData,
      quantity: Number(formData.quantity),
      unitCost: Number(formData.unitCost),
      amountPaid: Number(formData.amountPaid)
    };

    try {
      const response = await axios.post('/diraja/transfer', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error distributing inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2>Distribute Inventory</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Shop ID</label>
          <input
            type="text"
            name="shop_id"
            value={formData.shop_id}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Inventory ID</label>
          <input
            type="text"
            name="inventory_id"
            value={formData.inventory_id}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Item Name</label>
          <input
            type="text"
            name="itemname"
            value={formData.itemname}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Unit Cost</label>
          <input
            type="number"
            name="unitCost"
            value={formData.unitCost}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Amount Paid</label>
          <input
            type="number"
            name="amountPaid"
            value={formData.amountPaid}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Batch Number</label>
          <input
            type="text"
            name="BatchNumber"
            value={formData.BatchNumber}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Distribute Inventory</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default DistributeInventory;
