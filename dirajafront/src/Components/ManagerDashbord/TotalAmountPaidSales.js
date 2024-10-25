import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TotalAmountPaidSales = () => {
  const [period, setPeriod] = useState('today');
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      try {
        const response = await axios.get('/diraja/totalsales', {
          params: { period },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setTotalAmountPaid(response.data.total_amount_paid);
      } catch (error) {
        console.error('Error fetching total amount paid:', error);
        setError('Could not fetch total amount paid');
      }
    };

    fetchTotalAmountPaid();
  }, [period]);

  return (
    <div>
      <h2>Total Amount Paid for Sales</h2>
      <div>
        <label>Select Period: </label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {totalAmountPaid !== null ? (
        <p>Total Amount Paid: ${totalAmountPaid.toFixed(2)}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default TotalAmountPaidSales;
