import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Spin, Alert } from 'antd';

const MonthlyIncomeChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch monthly income data
  const fetchMonthlyIncome = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/diraja/monthly-analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      const formattedData = response.data.monthly_income.map((item) => ({
        month: monthNames[item.month - 1],
        total_income: item.total_income,
      }));

      setData(formattedData);
      setError('');
    } catch (err) {
      console.error('Error fetching monthly income:', err);
      setError('Failed to fetch monthly income data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyIncome();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div style={{ width: '100%', height: 200 }}> {/* Half height */}
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Monthly Income</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          {/* Removed CartesianGrid */}
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Line type="linear" dataKey="total_income" stroke="#1890ff" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyIncomeChart;
