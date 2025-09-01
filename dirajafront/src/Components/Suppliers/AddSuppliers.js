import React, { useState } from 'react';
import axios from 'axios';
import "../../Styles/shops.css";
import { Alert, Stack } from '@mui/material'; // Import Material UI components

const AddSuppliers = () => {
  const [supplierName, setSupplierName] = useState('');
  const [supplierLocation, setSupplierLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // success | error | warning | info

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      setMessage('You are not authenticated');
      setMessageType('error');
      return;
    }

    try {
      const response = await axios.post(
        'https://kulima.co.ke/api/diraja/creat-supplier', // Endpoint must match backend route
        {
          supplier_name: supplierName,
          supplier_location: supplierLocation,
          email: email || null,
          phone_number: phoneNumber || null,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 201) {
        setMessage('Supplier added successfully');
        setMessageType('success');
        setSupplierName('');
        setSupplierLocation('');
        setEmail('');
        setPhoneNumber('');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'An error occurred';
      setMessage(errorMsg);
      setMessageType('error');
    }
  };

  return (
    <div>
      <h1>Add Supplier</h1>
      <form className="form" onSubmit={handleSubmit}>

      {message && (
        <Stack sx={{ mt: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}
        <input
          type="text"
          placeholder="Supplier name (required)"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="Supplier location (required)"
          value={supplierLocation}
          onChange={(e) => setSupplierLocation(e.target.value)}
          required
          className="input"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Phone number (optional)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="input"
        />
        <button type="submit" className='button'>Add Supplier</button>
      </form>


    </div>
  );
};

export default AddSuppliers;
