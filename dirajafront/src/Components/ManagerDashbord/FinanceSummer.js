import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import LoadingAnimation from '../LoadingAnimation';
import DateRangePicker from '../DateRangePicker';

const FinancialSummaryCard = () => {
  const [summary, setSummary] = useState({});
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [isLoading, setIsLoading] = useState(true);
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      let url = `/api/diraja/summery?period=${period}`;

      if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        const startDate = new Date(customDateRange.startDate).toISOString().split('T')[0];
        const endDate = new Date(customDateRange.endDate).toISOString().split('T')[0];
        url = `/api/diraja/summery?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setTimeout(() => {
        setSummary(response.data);
        setIsLoading(false);
        setError('');
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setError('Error fetching financial summary');
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customDateRange.startDate && customDateRange.endDate)) {
      fetchSummary();
    }
  }, [period, customDateRange]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    if (e.target.value !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  return (
    <div className='financial-card'>
      
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
        <div className="controls">
          <select value={period} onChange={handlePeriodChange}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
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

      <h5>Financial Summary</h5>

      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="financial-values">
          <p>Total Sales: <strong>{summary.total_sales_amount_paid || 'Ksh 0.00'}</strong></p>
          <p>Total Expenses: <strong>{summary.total_expenses_amount_paid || 'Ksh 0.00'}</strong></p>
          <p>Inventory Purchases: <strong>{summary.total_inventory_purchases_amount_paid || 'Ksh 0.00'}</strong></p>
          <p>Remaining Stock Value: <strong>{summary.remaining_stock_value || 'Ksh 0.00'}</strong></p>
          <p>Value of Sold Goods: <strong>{summary.value_of_sold_goods || 'Ksh 0.00'}</strong></p>
        </div>

      )}
    
    </div>
  );
};

export default FinancialSummaryCard;
