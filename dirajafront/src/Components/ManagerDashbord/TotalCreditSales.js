import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker'; // Import DateRangePicker component

const TotalCreditSales = () => {
  // Set default period to 'yesterday'
  const [period, setPeriod] = useState('yesterday');
  const [customDateRange, setCustomDateRange] = useState({ startDate: null, endDate: null }); // State for custom date range
  const [totalAmountPaid, setTotalAmountPaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalAmountPaid = async () => {
      setLoading(true);
      try {
        let params = {};

        // Prepare parameters based on the selected period
        if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          // Format start and end dates to 'YYYY-MM-DD' format
          const formattedStartDate = new Date(customDateRange.startDate).toISOString().split('T')[0];
          const formattedEndDate = new Date(customDateRange.endDate).toISOString().split('T')[0];
          params = { startDate: formattedStartDate, endDate: formattedEndDate };
        } else {
          params = { period }; // Use selected period for other options
        }

        const response = await axios.get('/api/diraja/allunpaidtotal', {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        setTimeout(() => {
          setTotalAmountPaid(response.data.total_unpaid_amount);
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

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <div className="controls">
          <select value={period} onChange={handlePeriodChange}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date</option> {/* Option for custom date range */}
          </select>

          {period === 'custom' && (
            <DateRangePicker
              dateRange={customDateRange}
              setDateRange={setCustomDateRange} // Pass down the setDateRange function
            />
          )}
        </div>
      </div>

      <h5>Total Credit Sales</h5>

      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <h1>{totalAmountPaid ? totalAmountPaid : 'Ksh 0.00'}</h1>
      )}

      <Link to="/credit-sale">View Sales</Link>
    </div>
  );
};

export default TotalCreditSales;
