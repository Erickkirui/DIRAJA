// src/components/AddStockItems.js
import React, { useState } from 'react';
import axios from 'axios';
import "../../Styles/shops.css"; // Reuse same styling
import StockItemsList from './StockItemsList';

const AddStockItems = () => {
  const [formData, setFormData] = useState({
    item_name: '',
    item_code: '',
    unit_price: '',
    pack_price: '',
    pack_quantity: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      setMessage('You are not authenticated');
      return;
    }

    // Validate required fields
    if (!formData.item_name) {
      setMessage('Item name is required');
      return;
    }

    try {
      const response = await axios.post(
        '/api/diraja/add-stock-items',
        {
          item_name: formData.item_name,
          item_code: formData.item_code || null,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
          pack_price: formData.pack_price ? parseFloat(formData.pack_price) : null,
          pack_quantity: formData.pack_quantity ? parseInt(formData.pack_quantity) : null
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 201) {
        setMessage('Stock item added successfully');
        // Reset form
        setFormData({
          item_name: '',
          item_code: '',
          unit_price: '',
          pack_price: '',
          pack_quantity: ''
        });
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('An error occurred while adding the stock item');
      }
    }
  };

  return (
    <div className='add-shop-container'>
      <h1>Add Stock Items</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="item_name"
          placeholder='Enter item name (required)'
          value={formData.item_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="item_code"
          placeholder='Enter item code (optional)'
          value={formData.item_code}
          onChange={handleChange}
        />
        <input
          type="number"
          name="unit_price"
          placeholder='Enter unit price (optional)'
          value={formData.unit_price}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
        <input
          type="number"
          name="pack_price"
          placeholder='Enter pack price (optional)'
          value={formData.pack_price}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
        <input
          type="number"
          name="pack_quantity"
          placeholder='Enter pack quantity (optional)'
          value={formData.pack_quantity}
          onChange={handleChange}
          min="0"
        />
        <button type="submit">Add Stock Item</button>
      </form>
      {message && <p className='message'>{message}</p>}
      <StockItemsList />
    </div>
  );
};

export default AddStockItems;