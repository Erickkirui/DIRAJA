import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const TotalPaidSales = ({ shopIds }) => {
  const [shopSales, setShopSales] = useState([]);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');

  const fetchShopSales = async (selectedPeriod) => {
    try {
      const salesData = await Promise.all(
        shopIds.map(async (shopId) => {
          const response = await axios.get(`/api/diraja/totalsalespershop`, {
            params: { shop_id: shopId, period: selectedPeriod },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          return { shopId, totalSales: response.data.total_sales_amount_paid };
        })
      );
      setShopSales(salesData);
      setError('');
    } catch (error) {
      console.error('Error fetching shop sales:', error);
      setError('Error fetching shop sales');
      setShopSales([]);
    }
  };

  useEffect(() => {
    fetchShopSales(period);
  }, [period, shopIds]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faChartSimple} size="1x" />
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
        <div className="shop-sales-cards">
          {shopSales.map((shop) => (
            <div key={shop.shopId} className="sales-card">
              <h6>Shop {shop.shopId}</h6>
              <h1>{`Ksh ${shop.totalSales}`}</h1>
              <Link to={`/sales/shop/${shop.shopId}`}>View Sales</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TotalPaidSales;
