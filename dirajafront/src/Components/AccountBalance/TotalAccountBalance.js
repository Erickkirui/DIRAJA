import React, { useState, useEffect } from 'react';

function TotalAccountBalance() {
  const [totalBalance, setTotalBalance] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTotalBalance = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch('https://kulima.co.ke/api/diraja/total-balance', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTotalBalance(data.total_balance);
      } else {
        setError(data.message || 'Failed to fetch total balance');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalBalance();
  }, []);

  return (
    <div className="totals-card">
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <p>Total Balance : <strong>Ksh  {totalBalance.toLocaleString()}</strong></p>
      )}
    </div>
  );
}

export default TotalAccountBalance;
