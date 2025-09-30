import React, { useEffect, useState } from 'react';
import GeneralTableLayout from '../GeneralTableLayout';

const BankAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const itemsPerPage = 20;

  const fetchAccounts = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch('api/diraja/all-acounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAccounts(data.accounts || []);
      } else {
        setError(data.message || 'Failed to load accounts');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const columns = [
    { key: 'id', header: 'Account-ID' },
    { key: 'Account_name', header: 'Account Name' },
    {
      key: 'Account_Balance',
      header: 'Balance',
      render: (row) =>
        row.Account_Balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    },
    {
      key: 'chart_account_name',
      header: 'Chart of Account',
      render: (row) => row.chart_account_name || '—',
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <h3>Bank Accounts</h3>

      {error && (
        <div style={{ marginBottom: '12px', color: 'red' }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <p>Loading accounts...</p>
      ) : (
        <GeneralTableLayout columns={columns} data={accounts} itemsPerPage={itemsPerPage} />
      )}
    </div>
  );
};

export default BankAccountsTable;
