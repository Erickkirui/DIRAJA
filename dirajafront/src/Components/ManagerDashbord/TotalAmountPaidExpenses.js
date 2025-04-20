import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker'; // Import the DateRangePicker component

const TotalAmountPaidExpenses = () => {
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [isLoading, setIsLoading] = useState(true);
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' }); // Custom date range state

  const fetchTotalAmountPaid = async () => {
    setIsLoading(true);
    try {
      let url = `/api/diraja/totalexpenses?period=${period}`;

      // Use custom dates only if both are provided
      if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        // Format the start and end dates in YYYY-MM-DD format
        const formattedStartDate = new Date(customDateRange.startDate).toISOString().split('T')[0];
        const formattedEndDate = new Date(customDateRange.endDate).toISOString().split('T')[0];

        url = `/api/diraja/totalexpenses?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
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
      setIsLoading(false);
      setError('Error fetching total amount paid');
    }
  };

  useEffect(() => {
    // Don't fetch data if custom range is not valid
    if (period !== 'custom' || (customDateRange.startDate && customDateRange.endDate)) {
      fetchTotalAmountPaid();
    }
  }, [period, customDateRange]); // Depend on period and custom date range

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    // Reset custom date range when switching to other periods
    if (e.target.value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
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
            <option value="alltime">All Time</option>
            <option value="custom">Custom Range</option> {/* Option for custom date range */}
          </select>

          {period === 'custom' && (
            <DateRangePicker
              dateRange={customDateRange}
              setDateRange={setCustomDateRange} // Pass down the setDateRange function
            />
          )}
        </div>
      </div>

      <p>Total Expenses</p>

      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        // Show previous total if custom date is selected, and no valid date is selected yet
        <h1>{totalAmountPaid !== null ? totalAmountPaid : 'Ksh 0.00'}</h1>
      )}

      <Link to="/allexpenses">View Expenses</Link>
    </div>
  );
};

export default TotalAmountPaidExpenses;
