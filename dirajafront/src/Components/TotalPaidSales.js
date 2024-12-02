import React, { useEffect, useState } from 'react';
import axios from 'axios';


const TotalPaidSales = () => {
  const [shopSales, setShopSales] = useState([]);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');

  const fetchShopSales = async (selectedPeriod) => {
    try {
      const response = await axios.get(' /api/diraja/totalsalespershop', {
        params: { period: selectedPeriod },
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
    fetchShopSales(period);
  }, [period]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  return (
    <div>
      <div className="metric-top">
        
        <select id="period" value={period} onChange={handlePeriodChange}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <h5>Total Sales per Shop</h5>
  
      {error ? (
        <p>{error}</p>
      ) : (
        <div className="shop-cards-container">
          {shopSales.length > 0 ? (
            shopSales.map((shop) => (
              <div key={shop.shop_id} className="shop-sales-cards">
                <h4>{shop.shop_name || `Shop ${shop.shop_id}`}</h4>
                <h1>{`Ksh ${shop.total_sales_amount_paid}`}</h1>
               
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
