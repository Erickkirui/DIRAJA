import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

function Deposits() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axios.get('/api/diraja/all-acounts', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setAccounts(res.data.accounts);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setMessage('Failed to fetch accounts.');
        setMessageType('error');
      }
    };

    fetchAccounts();
  }, [accessToken]);

  const handleDeposit = async (e) => {
    e.preventDefault();

    if (!selectedAccount || !amount || !fromAccount) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    try {
      const res = await axios.put(
        `/api/diraja/bankaccount/${selectedAccount}/deposit`,
        {
          amount: parseFloat(amount),
          from_account: fromAccount,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setMessage(res.data.message);
      setMessageType('success');
      setAmount('');
      setFromAccount('');
      setSelectedAccount('');
    } catch (err) {
      console.error('Deposit failed:', err);
      setMessage('Deposit failed. Please try again.');
      setMessageType('error');
    }
  };

  return (
    <div className="add-shop-container">
      <h2 className="deposit-title">Deposit Cash</h2>

      {message && (
        <Stack sx={{ mb: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <form onSubmit={handleDeposit}>
        <div>
          <label>Select Account:</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">-- Choose an account --</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.Account_name} (Balance: {account.Account_Balance})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Deposit Amount:</label>
          <input
            type="number"
            placeholder="Enter deposit amount"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label>From </label>
          <input
            type="text"
            placeholder="e.g. Safaricom Till"
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
          />
        </div>

        <button type="submit">Deposit</button>
      </form>
    </div>
  );
}

export default Deposits;
