import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker'; // Import DateRangePicker

const TotalAmountPaidSales = () => {
  const [period, setPeriod] = useState('yesterday');
  const [customDateRange, setCustomDateRange] = useState({ startDate: null, endDate: null }); // State for custom date range
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      setLoading(true);
      try {
        // When "Custom Date" is selected, send the date range parameter.
        const params = period === 'custom' && customDateRange.startDate && customDateRange.endDate
          ? {
              // Format the start and end dates to only include the date (YYYY-MM-DD)
              startDate: formatDate(customDateRange.startDate),
              endDate: formatDate(customDateRange.endDate),
            }
          : { period };

        const response = await axios.get('/api/diraja/allshopstotal', {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

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

    // Only fetch data when either a non-custom period is selected or a custom date range is provided.
    if (period !== 'custom' || (customDateRange.startDate && customDateRange.endDate)) {
      fetchTotalAmountPaid();
    }
  }, [period, customDateRange]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    // Reset custom date range when switching to other periods
    if (e.target.value !== 'custom') {
      setCustomDateRange({ startDate: null, endDate: null });
    }
  };

  // Helper function to format the date as YYYY-MM-DD
  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
  };

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <div className="controls">
          <select value={period} onChange={handlePeriodChange}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="custom">Custom Date</option>
          </select>

          {period === 'custom' && (
            <DateRangePicker
              dateRange={customDateRange}
              setDateRange={setCustomDateRange} // Pass down the setDateRange function
            />
          )}
        </div>
      </div>
      <h5>Total Sales</h5>

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

export default TotalAmountPaidSales;
