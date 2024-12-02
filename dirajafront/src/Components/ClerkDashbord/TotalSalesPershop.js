import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';

const TotalShopSales = () => {
  const [period, setPeriod] = useState('today');
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

        const response = await axios.get(' /api/diraja/totalsales', {
          params: { period, shop_id: shopId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setTotalAmountPaid(response.data.total_sales_amount_paid);
      } catch (error) {
        console.error('Error fetching total amount paid:', error);
        setError('Could not fetch total amount paid');
      }
    };

    fetchTotalAmountPaid();
  }, [period]);

  return (
    <div className='metrix-container'>
      <div className='metric-top'>
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
      
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      
      <h5>Total Sales</h5>
  
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {totalAmountPaid !== null ? (
        <h1> Ksh {totalAmountPaid.toFixed(2)}</h1>
      ) : (
        <p>Loading...</p>
      )}
      <Link to='/allsales'>View Sales</Link>
    </div>
  );
};

export default TotalShopSales;
