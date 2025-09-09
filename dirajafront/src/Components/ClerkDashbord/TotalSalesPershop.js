import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';

const TotalShopSales = () => {
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !shopId) {
          setError('Missing authentication or shop information.');
          return;
        }

        const params = { period, shop_id: shopId };
        if (period === 'date' && selectedDate) {
          params.date = selectedDate; // Include date if "date" is selected
        }

        const response = await axios.get('https://kulima.co.ke/api/diraja/totalsales', {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setTotalAmountPaid(response.data.total_paid);
      } catch (error) {
        // console.error('Error fetching total amount paid:', error);
        // setError('Could not fetch total amount paid');
      }
    };

    fetchTotalAmountPaid();
  }, [period, selectedDate]);

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
      
      <h5>Total Sales</h5>
  
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {totalAmountPaid !== null ? (
        <h1> Ksh {totalAmountPaid}</h1>
      ) : (
        <p>Loading...</p>
      )}
      <Link to='/shopsales'>View Sales</Link>
    </div>
  );
};

export default TotalShopSales;
