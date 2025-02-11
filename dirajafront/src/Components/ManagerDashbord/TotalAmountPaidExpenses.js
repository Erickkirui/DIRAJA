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
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  const fetchTotalAmountPaid = async (selectedPeriod) => {
    setIsLoading(true); // Start loading
    try {
      const response = await axios.get(`/api/diraja/totalexpenses?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      // Simulate a 3-second delay
      setTimeout(() => {
        setTotalAmountPaid(response.data.total_amount_paid);
        setIsLoading(false); // Stop loading
        setError('');
      }, 3000);
    } catch (error) {
      console.error('Error fetching total amount paid:', error);
      setError('Error fetching total amount paid');
      setTotalAmountPaid(null);
      setIsLoading(false); // Stop loading even on error
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
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />

        <select id="period" value={period} onChange={handlePeriodChange}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <h5>Total Expenses</h5>

      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{`${totalAmountPaid}`}</h1>
      )}
      <Link to="/allexpenses">View Expenses</Link>
    </div>
  );
};

export default TotalAmountPaidExpenses;
