import React, { useEffect, useState } from 'react';
import axios from 'axios';


const TotalPaidSales = () => {
  const [shopSales, setShopSales] = useState([]);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('yesterday');
  const [customDate, setCustomDate] = useState('');

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
    } catch (error) {
      console.error('Error fetching shop sales:', error);
      setError('Error fetching shop sales');
      setShopSales([]);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || customDate) {
      fetchShopSales();
    }
  }, [period, customDate]);

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
        <div className="shop-cards-container">
          {shopSales.length > 0 ? (
            shopSales.map((shop) => (
              <div key={shop.shop_id} className="shop-sales-cards">
                {/* <h4>{shop.shop_name || `Shop ${shop.shop_id}`}</h4> */}
                <h4>
                <a href={`/salesbyshop/${shop.shop_id}`}>{shop.shop_name}</a>
                </h4>

                <h1>{`${shop.total_sales_amount_paid}`}</h1>
              </div>
            ))
          ) : (
            <p>No sales data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TotalPaidSales;
