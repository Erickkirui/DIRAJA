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
        let params = {};

        if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
          params = {
            start_date: formatDateToISOString(customDateRange.startDate),
            end_date: formatDateToISOString(customDateRange.endDate),
          };
        } else if (period === 'today') {
          params = { start_date: formatDateToISOString(new Date()), end_date: formatDateToISOString(new Date()) };
        } else if (period === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          params = { start_date: formatDateToISOString(yesterday), end_date: formatDateToISOString(yesterday) };
        } else if (period === 'week') {
          const today = new Date();
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          params = { start_date: formatDateToISOString(weekAgo), end_date: formatDateToISOString(today) };
        } else if (period === 'month') {
          const today = new Date();
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          params = { start_date: formatDateToISOString(monthAgo), end_date: formatDateToISOString(today) };
        }

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

  const formatDateToISOString = (date) => {
    const utcDate = new Date(date);
    utcDate.setMinutes(utcDate.getMinutes() - utcDate.getTimezoneOffset());
    return utcDate.toISOString().split('T')[0];
  };

  const getProfitOrLossMessage = () => {
    const { profit_or_loss } = data;
    const formatted = Math.abs(profit_or_loss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (profit_or_loss > 0) {
      return `Profit: ${formatted}`;
    } else if (profit_or_loss < 0) {
      return `Loss: ${formatted}`;
    } else {
      return 'No Profit or Loss';
    }
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
          <p>Total Sales: {data.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p>Total Purchases: {data.total_purchases.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p style={{ color: data.profit_or_loss >= 0 ? 'green' : 'red' }}>
            {getProfitOrLossMessage()}
          </p>
        </div>
      )}
    </div>
  );
};

export default MabandaProfitLoss;
