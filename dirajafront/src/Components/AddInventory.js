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
    Suppliername: '',
    Supplier_location: '',
    note: '',
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
      const response = await axios.post('/diraja/newinventory', numericFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setMessage(response.data.message);

      // Clear the form data after successful submission
      setFormData({
        itemname: '',
        quantity: '',
        metric: '',
        unitCost: '',
        amountPaid: '',
        unitPrice: '',
        Suppliername: '',
        Supplier_location: '',
        note: '',
        created_at: ''
      });

    } catch (error) {
      setMessage('Error adding inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <h2>Add New Inventory</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} className="form">
        <div>
          <input
            type="text"
            name="itemname"
            value={formData.itemname}
            onChange={handleChange}
            placeholder="Item Name"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="metric"
            value={formData.metric}
            onChange={handleChange}
            placeholder="Metric"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="unitCost"
            value={formData.unitCost}
            onChange={handleChange}
            placeholder="Unit Cost"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="amountPaid"
            value={formData.amountPaid}
            onChange={handleChange}
            placeholder="Amount Paid"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            placeholder="Unit Price"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="Suppliername"
            value={formData.Suppliername}
            onChange={handleChange}
            placeholder="Supplier Name"
            className="input"
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="Supplier_location"
            value={formData.Supplier_location}
            onChange={handleChange}
            placeholder="Supplier Location"
            className="input"
            required
          />
        </div>
        <div>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Note"
            className="input"
          />
        </div>
        <div>
          <input
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <button type="submit" className="button">Add Inventory</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddInventory;
