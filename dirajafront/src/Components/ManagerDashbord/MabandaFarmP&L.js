import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker';

const MabandaProfitLoss = () => {
  const [period, setPeriod] = useState('yesterday');
  const [customDateRange, setCustomDateRange] = useState({ startDate: null, endDate: null });
  const [data, setData] = useState({ total_sales: 0, total_purchases: 0, total_expenses: 0, profit_or_loss: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfitLoss = async () => {
      setLoading(true);
      try {
        const params = period === 'custom' && customDateRange.startDate && customDateRange.endDate
          ? {
              start_date: formatDate(customDateRange.startDate),
              end_date: formatDate(customDateRange.endDate),
            }
          : {};

        const response = await axios.get('/api/diraja/mabandap&l', {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        setTimeout(() => {
          setData(response.data);
          setLoading(false);
        }, 2000);

        setError(null);
      } catch (err) {
        console.error('Error fetching profit & loss:', err);
        setError('Could not fetch profit & loss data');
        setLoading(false);
      }
    };

    if (period !== 'custom' || (customDateRange.startDate && customDateRange.endDate)) {
      fetchProfitLoss();
    }
  }, [period, customDateRange]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    if (e.target.value !== 'custom') {
      setCustomDateRange({ startDate: null, endDate: null });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartLine} size="1x" />
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
              setDateRange={setCustomDateRange}
            />
          )}
        </div>
      </div>

      <p>Profit & Loss (Mabanda Farm)</p>

      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div>
          <h3>Total Sales: {data.total_sales.toFixed(2)}</h3>
          <h3>Total Purchases: {data.total_purchases.toFixed(2)}</h3>
          <h3>Total Expenses: {data.total_expenses.toFixed(2)}</h3>
          <h2 style={{ color: data.profit_or_loss >= 0 ? 'green' : 'red' }}>
            Profit / Loss: {data.profit_or_loss.toFixed(2)}
          </h2>
        </div>
      )}
    </div>
  );
};

export default MabandaProfitLoss;
