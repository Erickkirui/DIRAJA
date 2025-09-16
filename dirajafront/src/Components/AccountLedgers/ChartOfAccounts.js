import React, { useEffect, useState } from 'react';
import AddChartOfAccount from './AddChartOfAccoun';
import GeneralTableLayout from '../GeneralTableLayout';

function ChartOfAccounts() {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const fetchChartOfAccounts = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setMessageType('error');
      setMessage('Access token is missing. Please login.');
      return;
    }

    try {
      const response = await fetch('api/diraja/chart-of-accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setData(result.chart_of_accounts || []);
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to fetch chart of accounts');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred while fetching chart of accounts.');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchChartOfAccounts();
  }, []);

  const handleAccountAdded = (newAccount) => {
    // Option 1: append directly
    setData((prev) => [...prev, newAccount]);

    // Option 2: re-fetch everything to stay consistent with backend
    // fetchChartOfAccounts();
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Account Name' },
    { key: 'type', header: 'Type' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'flex-start' }}>
      {/* Left: Add Form */}
      <div style={{ flex: '1', maxWidth: '400px' }}>
        <AddChartOfAccount onAccountAdded={handleAccountAdded} />

        {message && (
          <div style={{ margin: '10px 0', color: messageType === 'error' ? 'red' : 'green' }}>
            {messageType === 'success' ? '✅ Success: ' : '❌ Error: '}
            {message}
          </div>
        )}
      </div>

      {/* Right: Table */}
      <div style={{ flex: '2' }}>
        
        <GeneralTableLayout columns={columns} data={data} />
      </div>
    </div>
  );
}

export default ChartOfAccounts;
