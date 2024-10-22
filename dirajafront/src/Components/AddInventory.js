import React, { useState } from 'react';
import axios from 'axios';

const AddInventory = () => {
  const [formData, setFormData] = useState({
    itemname: '',
    quantity: '',
    metric: '',
    unitCost: '',
    amountPaid: '',
    unitPrice: '',
    created_at: ''
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
      amountPaid: Number(formData.amountPaid),
      unitPrice: Number(formData.unitPrice)
    };

    try {
      const response = await axios.post('/diraja/newinvent', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error adding inventory: ' + error.response?.data?.message || error.message);
    }
  };

  return (
    <div>
      <h2>Add New Inventory</h2>
      <form onSubmit={handleSubmit}>
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
          <label>Metric</label>
          <input
            type="text"
            name="metric"
            value={formData.metric}
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
          <label>Unit Price</label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Created At</label>
          <input
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Add Inventory</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddInventory;
