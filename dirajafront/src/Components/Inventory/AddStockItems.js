// src/components/AddStockItems.js
import React, { useState } from 'react';
import axios from 'axios';
import "../../Styles/shops.css"; // Reuse same styling
import StockItemsList from './StockItemsList';

const AddStockItems = () => {
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      setMessage('You are not authenticated');
      return;
    }

    try {
      const response = await axios.post(
        '/api/diraja/add-stock-items', // Make sure this matches your Flask route
        {
          item_name: itemName, // Required
          item_code: itemCode, // Optional
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 201) {
        setMessage('Stock item added successfully');
        setItemName('');
        setItemCode('');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('An error occurred');
      }
    }
  };

  return (
    <div className='add-shop-container'>
      <h1>Stock Items</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder='Enter item name (required)'
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder='Enter item code (optional)'
          value={itemCode}
          onChange={(e) => setItemCode(e.target.value)}
        />
        <button type="submit">Add Stock Item</button>
      </form>
      {message && <p className='message'>{message}</p>}
      <StockItemsList />
    </div>
  );
};

export default AddStockItems;
