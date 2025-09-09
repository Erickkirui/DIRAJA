import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';

const TotalMabandaSales = () => {
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken) {
          setError('Missing authentication token.');
          return;
        }

        if (shopId !== "12") {
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(true);

        const params = { period };
        if (period === 'date' && selectedDate) {
          params.date = selectedDate; // Add date if "date" period is selected
        }

        const response = await axios.get('https://kulima.co.ke/api/diraja/totalsalesmabanda', {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setTotalAmountPaid(response.data.total_sales_amount_paid);
      } catch (error) {
        console.error('Error fetching total amount paid:', error);
        setError('Could not fetch total amount paid');
      }
    };

    fetchTotalAmountPaid();
  }, [period, selectedDate]);

  if (!isAuthorized) {
    return null; // Hide if user is not from shop 12
  }

  return (
    <div className='metrix-container'>
      <div className='metric-top'>
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
      
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
      
      <h5>Total Sales (Mabanda Shop)</h5>
  
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {totalAmountPaid !== null ? (
        <h1> Ksh {totalAmountPaid}</h1>
      ) : (
        <p>Loading...</p>
      )}
      <Link to='/mabandasales'>View Sales</Link>
    </div>
  );
};

export default TotalMabandaSales;
