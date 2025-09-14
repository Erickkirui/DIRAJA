import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import { Spin, Alert } from 'antd';

const PromoSalesRank = () => {
  const [rankedData, setRankedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRankedSales = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.get('api/diraja/promo-sales-rank', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRankedData(response.data.ranked_users || []);
    } catch (err) {
      console.error('Failed to fetch ranked users:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankedSales();
  }, []);

  const columns = [
    { key: 'rank', header: 'Rank' },
    { key: 'username', header: 'Username' },
    { key: 'total_sales', header: 'Total Sales (Ksh)' },
  ];

  if (loading) return <Spin tip="Loading ranking data..." />;
  if (error) return <Alert type="error" message="Error" description={error} showIcon />;

  return (
    <div className="promosalesrank-container">
      <h2>Top Performing Users by Promo Sales</h2>
      <GeneralTableLayout data={rankedData} columns={columns} />
    </div>
  );
};

export default PromoSalesRank;
