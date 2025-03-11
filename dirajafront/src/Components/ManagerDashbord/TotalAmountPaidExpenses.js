import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';

const TotalAmountPaidExpenses = () => {
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTotalAmountPaid = async () => {
    setIsLoading(true);
    try {
      let url = `/api/diraja/totalexpenses?period=${period}`;

      // Use custom dates only if both are provided
      if (period === 'custom' && startDate && endDate) {
        url = `/api/diraja/totalexpenses?start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setTimeout(() => {
        setTotalAmountPaid(response.data.total_amount_paid);
        setIsLoading(false);
        setError('');
      }, 1000);
    } catch (error) {
      console.error('Error fetching total amount paid:', error);
      setError('Error fetching total amount paid');
      setTotalAmountPaid(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalAmountPaid();
  }, [period, startDate, endDate]);

  return (
    <div className='metrix-container'>
      <div className='metric-top'>
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {period === 'custom' && (
        <div className="date-range">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      )}

      <h5>Total Expenses</h5>

      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalAmountPaid}</h1>
      )}
      
      <Link to="/allexpenses">View Expenses</Link>
    </div>
  );
};

export default TotalAmountPaidExpenses;
