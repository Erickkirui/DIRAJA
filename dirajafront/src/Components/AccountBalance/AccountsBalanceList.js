import React, { useEffect, useState } from 'react';

import AccountCard from './AccountCard';

import TotalAccountBalance from './TotalAccountBalance';

function AccountsBalanceList() {
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch('/api/diraja/all-acounts', {
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
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div>
    

      <TotalAccountBalance />
      {error && <p>{error}</p>}
      <div className="accounts-container">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <AccountCard
              key={account.id}
              accountName={account.Account_name}
              accountBalance={account.Account_Balance}
            />
          ))
        ) : (
          <p>No accounts available</p>
        )}
      </div>
    </div>
  );
}

export default AccountsBalanceList;
