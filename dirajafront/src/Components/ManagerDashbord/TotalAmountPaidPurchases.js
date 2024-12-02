import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const TotalAmountPaidPurchases = () => {
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');

  const fetchTotalAmountPaid = async (selectedPeriod) => {
    try {
      const response = await axios.get(` /api/diraja/totalpurchases?period=${selectedPeriod}`, {
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
    <div className='metrix-container'>
       <div className='metric-top'>
        <FontAwesomeIcon  className="metric-icon" icon={faChartSimple} size="1x"  />

        <select id="period" value={period} onChange={handlePeriodChange}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <h5>Total Purchases</h5>
  
      {error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalAmountPaid !== null ? `Ksh ${totalAmountPaid}` : 'Loading...'}</h1>
      )}
      <Link to="/purchases">View Purchases</Link>
    </div>
  );
};

export default TotalAmountPaidPurchases;
