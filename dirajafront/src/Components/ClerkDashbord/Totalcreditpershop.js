import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

const TotalUnpaidAmountPerClerk = () => {
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalUnpaidAmount = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('Missing authentication token.');
          return;
        }

        const params = { period };
        if (period === 'date' && selectedDate) {
          params.date = selectedDate;
        }

        const response = await axios.get('api/diraja/unpaidsales/totalperclerk', {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setTotalUnpaidAmount(response.data.total_unpaid_amount);
      } catch (error) {
        // console.error('Error fetching total unpaid amount:', error);
        // setError('Could not fetch total unpaid amount.');
      }
    };

    fetchTotalUnpaidAmount();
  }, [period, selectedDate]);

  return (
    <div className='metrix-container'>
      <div className='metric-top'>
        <FontAwesomeIcon className="metric-icon" icon={faMoneyBillWave} size="1x" />

        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="date">Select Date</option>
        </select>

        {period === 'date' && (
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        )}
      </div>

      <h5>Total Credit Sales</h5>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {totalUnpaidAmount !== null ? (
        <h1>Ksh {totalUnpaidAmount}</h1>
      ) : (
        <p>Loading...</p>
      )}
      
      <Link to='/shopcredit'>View Credit Sales</Link>
    </div>
  );
};

export default TotalUnpaidAmountPerClerk;
