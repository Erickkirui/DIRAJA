// src/components/AddShop.js
import React, { useState } from 'react';
import axios from 'axios';
import "../Styles/newshop.css";

const AddShop = () => {
  const [shopname, setShopname] = useState('');
  const [employee, setEmployee] = useState('');
  const [shopstatus, setShopstatus] = useState('active'); // Default to 'active'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the access token from local storage
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      setMessage('You are not authenticated');
      return;
    }

    try {
      const response = await axios.post(
        '/diraja/newshop',
        {
          shopname,
          employee,
          shopstatus,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}` // Include the token in the request header
          },
        }
      );

      if (response.status === 201) {
        setMessage('Shop added successfully');
        // Clear the form
        setShopname('');
        setEmployee('');
        setShopstatus('active');
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
      <h2>Add Shop</h2>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor="shopname">Shop Name:</label>
          <input
            type="text"
            id="shopname"
            value={shopname}
            onChange={(e) => setShopname(e.target.value)}
            required
          />
        </div>
        <div className='form-group'>
          <label htmlFor="employee">Employee:</label>
          <input
            type="text"
            id="employee"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            required
          />
        </div>
        <div className='form-group'>
          <label htmlFor="shopstatus">Shop Status:</label>
          <select
            id="shopstatus"
            value={shopstatus}
            onChange={(e) => setShopstatus(e.target.value)}
            required
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <button type="submit">Add Shop</button>
      </form>
      {message && <p className='message'>{message}</p>}
    </div>
  );
};

export default AddShop;
