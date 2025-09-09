import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import {  Alert } from 'antd';
import LoadingAnimation from '../LoadingAnimation';

const PromotionSales = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.get('https://kulima.co.ke/api/diraja/allsalesdepartmentsales', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSalesData(response.data.sales || []);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const columns = [
    {
    key: 'created_at',
    header: 'Date',
    render: (item) => {
      const date = new Date(item.created_at);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
  },
  { key: 'shop_sale_name', header: 'Shop Name' },
  { key: 'customer_name', header: 'Customer' },
  { key: 'customer_number', header: 'Phone Number' },
  {
    key: 'item_name',
    header: 'Items',
    render: (row) =>
      row.item_name
        .map((item) => `${item.item} - ${item.quantity} x ${item.unit_price}`)
        .join(', '),
  },
  { key: 'total_price', header: 'Total (Ksh)' },
  
];

  if (loading) return <LoadingAnimation />;
  if (error) return <Alert type="error" message="Error" description={error} showIcon />;

  return (
    <div className="promotionsales-container">
      <h2>Department Sales</h2>
      <GeneralTableLayout data={salesData} columns={columns} />
    </div>
  );
};

export default PromotionSales;
