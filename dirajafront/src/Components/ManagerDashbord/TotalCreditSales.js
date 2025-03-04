import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import LoadingAnimation from '../LoadingAnimation';


const TotalCreditSales = () => {
  // Set default period to 'yesterday'
  const [period, setPeriod] = useState('yesterday');
  const [customDate, setCustomDate] = useState('');
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      setLoading(true);
      try {
        // When "Custom Date" is selected, send the date parameter.
        // Otherwise, send the period parameter (including "yesterday").
        const params = period === 'custom' ? { date: customDate } : { period };

        const response = await axios.get('/api/diraja/allshopstotal', {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        // Simulate delay for the loading animation.
        setTimeout(() => {
          setTotalAmountPaid(response.data.total_sales_amount_paid);
          setLoading(false);
        }, 3000);

        setError(null);
      } catch (error) {
        console.error('Error fetching total amount paid:', error);
        setError('Could not fetch total amount paid');
        setTotalAmountPaid(null);
        setLoading(false);
      }
    };

    // Only fetch data when either a non-custom period is selected or a custom date is provided.
    if (period !== 'custom' || customDate) {
      fetchTotalAmountPaid();
    }
  }, [period, customDate]);

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <div className="controls">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date</option>
          </select>
          {period === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="custom-date-picker"
            />
          )}
        </div>
      </div>
      <h5>Credit Sales</h5>

      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <h1>{totalAmountPaid ? totalAmountPaid : '0.00'}</h1>
      )}
      <Link to="/analytics">View Sales</Link>
    </div>
  );
};

export default TotalCreditSales;
