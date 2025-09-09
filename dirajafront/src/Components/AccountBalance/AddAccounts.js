import React, { useState } from 'react';
import { Alert, Stack } from '@mui/material';

function AddAccounts() {
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // can be: success, error, warning, info

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setMessage('You are not authenticated');
      setMessageType('error');
      return;
    }

    if (!accountName || accountBalance === '') {
      setMessage('Please provide both Account Name and Account Balance');
      setMessageType('warning');
      return;
    }

    try {
      const response = await fetch('api/diraja/bankaccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          Account_name: accountName,
          Account_Balance: parseFloat(accountBalance),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Bank account created successfully');
        setMessageType('success');
        setAccountName('');
        setAccountBalance('');
      } else {
        setMessage(data.message || 'Failed to create bank account');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Something went wrong');
      setMessageType('error');
    }
  };

  return (
    <div className='add-shop-container'>
      <h2>Add Bank Account</h2>
      {message && (
        <Stack sx={{ mb: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            placeholder='Account name eg( Sasapay)'
          />
        </div>
        <div>
          <input
            type="number"
            step="0.01"
            value={accountBalance}
            onChange={(e) => setAccountBalance(e.target.value)}
            required
            placeholder='Account Balance'
          />
        </div>
        <button type="submit">Add Account</button>
      </form>
    </div>
  );
}

export default AddAccounts;
