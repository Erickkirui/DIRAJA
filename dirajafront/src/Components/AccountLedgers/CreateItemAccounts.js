import React, { useEffect, useState } from 'react';
import Select from 'react-select';

function CreateItemAccount() {
  const [item, setItem] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const fetchChartOfAccounts = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessageType('error');
        setMessage('Access token is missing.');
        return;
      }

      try {
        const response = await fetch('/api/diraja/chart-of-accounts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (response.ok) {
          const formatted = result.chart_of_accounts.map((acc) => ({
            value: acc.id,
            label: acc.account,
          }));
          setAccounts(formatted);
        } else {
          setMessageType('error');
          setMessage(result.message || 'Failed to fetch chart of accounts.');
        }
      } catch (error) {
        setMessageType('error');
        setMessage('Error fetching accounts.');
      }
    };

    fetchChartOfAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setMessageType('error');
      setMessage('Access token is missing.');
      return;
    }

    try {
      const response = await fetch('/api/diraja/itemaccounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item,
          chart_account_ids: selectedAccounts.map((acc) => acc.value), // Corrected field name here
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessageType('success');
        setMessage(result.message);
        setItem('');
        setSelectedAccounts([]);
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to create item account.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred.');
    }
  };

  return (
    <div>
      <h3>Create Item Account</h3>
      {message && (
        <div>
          {messageType === 'success' ? 'Success: ' : 'Error: '}
          {message}
        </div>
      )}

      <div className='add-shop-container'>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="Input item name"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '0px' }}>
            <Select
              isMulti
              options={accounts}
              value={selectedAccounts}
              onChange={setSelectedAccounts}
              placeholder="Search and select chart accounts..."
            />
          </div>

          <button style={{ marginTop: '0px' }} type="submit">Create</button>
        </form>
      </div>
    </div>
  );
}

export default CreateItemAccount;
