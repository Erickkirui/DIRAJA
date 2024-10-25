import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TotalAmountPaidExpenses = () => {
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');

  const fetchTotalAmountPaid = async (selectedPeriod) => {
    try {
      const response = await axios.get(`/diraja/totalexpenses?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setTotalAmountPaid(response.data.total_amount_paid);
      setError('');
    } catch (error) {
      console.error('Error fetching total amount paid:', error);
      setError('Error fetching total amount paid');
      setTotalAmountPaid(null);
    }
  };

  useEffect(() => {
    fetchTotalAmountPaid(period);
  }, [period]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  return (
    <div>
      <h2>Total Amount Paid in Expenses</h2>
      <div>
        <label htmlFor="period">Select Period:</label>
        <select id="period" value={period} onChange={handlePeriodChange}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      {error ? (
        <p>{error}</p>
      ) : (
        <p>{totalAmountPaid !== null ? `Total amount paid: $${totalAmountPaid}` : 'Loading...'}</p>
      )}
    </div>
  );
};

export default TotalAmountPaidExpenses;
