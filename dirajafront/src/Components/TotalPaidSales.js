import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TotalPaidSales = () => {
  const [shopSales, setShopSales] = useState([]);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [customDate, setCustomDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [shopCount, setShopCount] = useState(0);

  const fetchShopSales = async () => {
    try {
      const params = period === 'custom' ? { date: customDate } : { period };

      const response = await axios.get('/api/diraja/totalsalespershop', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      setShopSales(response.data.total_sales_per_shop || []);
      setError('');
      
      // Calculate totals
      if (response.data.total_sales_per_shop) {
        const total = response.data.total_sales_per_shop.reduce((sum, shop) => {
          // Extract numeric value from the formatted string (e.g., "Ksh 96,394.00")
          const amount = parseFloat(shop.total_sales_amount_paid.replace(/[^\d.-]/g, ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        setTotalSales(total);
        setShopCount(response.data.total_sales_per_shop.length);
      } else {
        setTotalSales(0);
        setShopCount(0);
      }
    } catch (error) {
      console.error('Error fetching shop sales:', error);
      setError('Error fetching shop sales');
      setShopSales([]);
      setTotalSales(0);
      setShopCount(0);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || customDate) {
      fetchShopSales();
    }
  }, [period, customDate]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div>
      <div className="metric-top">
        <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Date</option>
        </select>

        {period === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="custom-date-picker"
          />
        )}
      </div>
      
      <h5>Total Sales per Shop</h5>

      {error ? (
        <p>{error}</p>
      ) : (
        <div>
          {/* Summary Card */}
          <div className="summary-card-anlaytics">
            <h4>Summary</h4>
            <div className='summer-details'>
              
              <div>
                <p>Total Sales</p>
                <h2>{formatCurrency(totalSales)}</h2>
              </div>
              <div>
                <p>Average per Shop</p>
                <h2>{shopCount > 0 ? formatCurrency(totalSales / shopCount) : formatCurrency(0)}</h2>
              </div>
            </div>
          </div>

          {/* Shop Cards */}
          <div className="shop-cards-container">
            {shopSales.length > 0 ? (
              shopSales.map((shop) => (
                <div key={shop.shop_id} className="shop-sales-cards">
                  <h4>{shop.shop_name || `Shop ${shop.shop_id}`}</h4>
                  <h2>{shop.total_sales_amount_paid}</h2>
                  <p><a href={`/salesbyshop/${shop.shop_id}`}>View Sales</a></p>
                </div>
              ))
            ) : (
              <p>No sales data available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalPaidSales;