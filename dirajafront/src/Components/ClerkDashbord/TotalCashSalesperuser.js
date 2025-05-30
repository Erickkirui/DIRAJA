import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister } from '@fortawesome/free-solid-svg-icons'; // example different icon
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker';

const TotalCashSalesPerUser = () => {
  const [cashSales, setCashSales] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const userName = localStorage.getItem('username');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !userName || !shopId) {
          setError('No access token or required IDs found, please log in.');
          setIsLoading(false);
          return;
        }

        let url = `/api/diraja/cashsaleperuser/${userName}/${shopId}?period=${period}`;

        if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          // Use raw date strings to avoid timezone shift
          const formattedStart = customDateRange.startDate;
          const formattedEnd = customDateRange.endDate;
          url = `/api/diraja/cashsaleperuser/${userName}/${shopId}?startDate=${formattedStart}&endDate=${formattedEnd}`;
        }

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        setCashSales(res.data.total_cash_sales);
        setError('');
      } catch (err) {
        setError('Error fetching total cash sales');
        setCashSales(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if not custom or custom dates are selected
    if (period !== 'custom' || (customDateRange.startDate && customDateRange.endDate)) {
      setIsLoading(true);
      fetchSales();
    }
  }, [period, customDateRange]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    if (e.target.value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faCashRegister} size="1x" />
        <div className="controls">
          <select value={period} onChange={handlePeriodChange}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="alltime">All Time</option>
            <option value="custom">Custom Range</option>
          </select>

          {period === 'custom' && (
            <DateRangePicker
              dateRange={customDateRange}
              setDateRange={setCustomDateRange}
            />
          )}
        </div>
      </div>

      <p>My Cash Sales</p>

      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{cashSales !== null ? cashSales : 'Ksh 0.00'}</h1>
      )}

      <Link to="/shopsales">View Sales</Link>
    </div>
  );
};

export default TotalCashSalesPerUser;
