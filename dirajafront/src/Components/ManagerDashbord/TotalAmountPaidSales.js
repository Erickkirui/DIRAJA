import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import LoadingAnimation from '../LoadingAnimation';

const TotalAmountPaidSales = () => {
  const [period, setPeriod] = useState('today');
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      setLoading(true); // Start loading
      try {
        const response = await axios.get('/api/diraja/allshopstotal', {
          params: { period },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        console.log('API Response:', response.data);

        // Simulate a 3-second delay
        setTimeout(() => {
          setTotalAmountPaid(response.data.total_sales_amount_paid || 0);
          setLoading(false); // Stop loading
        }, 3000);

        setError(null);
      } catch (error) {
        console.error('Error fetching total amount paid:', error);
        setError('Could not fetch total amount paid');
        setTotalAmountPaid(0); // Set totalAmountPaid to 0 in case of an error
        setLoading(false); // Stop loading even on error
      }
    };

    fetchTotalAmountPaid();
  }, [period]);

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <h5>Total Sales</h5>

      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <h1>Ksh {totalAmountPaid ? totalAmountPaid.toFixed(2) : "0.00"}</h1>
      )}
      <Link to="/analytics">View Sales</Link>
    </div>
  );
};

export default TotalAmountPaidSales;
