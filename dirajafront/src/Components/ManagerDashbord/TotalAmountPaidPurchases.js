import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker';

const TotalAmountPaidPurchases = () => {
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [customDateRange, setCustomDateRange] = useState({ startDate: null, endDate: null }); // Custom date range state

  const fetchTotalAmountPaid = async (selectedPeriod, dateRange) => {
    setLoading(true);
    try {
      let url = `https://kulima.co.ke/api/diraja/totalpurchases`;
      
      // Prepare the parameters for the API request
      const params =
        selectedPeriod === 'custom' && dateRange.startDate && dateRange.endDate
          ? {
              startDate: new Date(dateRange.startDate).toISOString().split('T')[0], // Format startDate
              endDate: new Date(dateRange.endDate).toISOString().split('T')[0], // Format endDate
            }
          : { period: selectedPeriod };

      const response = await axios.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      // Simulate a 3-second delay
      setTimeout(() => {
        setTotalAmountPaid(response.data.total_amount_paid);
        setLoading(false);
      }, 3000);
      setError('');
    } catch (error) {
      console.error('Error fetching total amount paid:', error);
      setError('Error fetching total amount paid');
      setTotalAmountPaid(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalAmountPaid(period, customDateRange);
  }, [period, customDateRange]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    // Clear custom date range when switching between periods
    if (e.target.value !== 'custom') {
      setCustomDateRange({ startDate: null, endDate: null });
    }
  };

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <div className="controls">
          <select id="period" value={period} onChange={handlePeriodChange}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="alltime">All Time</option>
            <option value="custom">Custom Date</option> {/* New option for custom date range */}
          </select>

          {period === 'custom' && (
            <DateRangePicker dateRange={customDateRange} setDateRange={setCustomDateRange} /> // Custom date range picker
          )}

        </div>
        
      </div>
      <p>Purchases (Distributed) </p>

      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalAmountPaid !== null ? ` ${totalAmountPaid}` : 'No data available'}</h1>
      )}
      <Link to="/purchases">View Purchases</Link>
    </div>
  );
};

export default TotalAmountPaidPurchases;
