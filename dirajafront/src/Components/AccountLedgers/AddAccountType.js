import React, { useState } from 'react';
import { Alert, Stack } from '@mui/material';

function AddAccountType() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setMessageType('error');
      setMessage('You are not authenticated');
      return;
    }

    if (!name || !type) {
      setMessageType('error');
      setMessage('Please fill in both fields');
      return;
    }

    try {
      const response = await fetch('/api/diraja/add-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, type }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage(data.message || 'Account type created successfully');
        setName('');
        setType('');
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to create account type');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Something went wrong');
      console.error(error);
    }
  };

  return (
    <div className='add-shop-container'>
      <h2>Add Account Type</h2>

      {message && (
        <Stack>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Account Type Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Account Type Code"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Account Type</button>
      </form>
    </div>
  );
}

export default AddAccountType;
