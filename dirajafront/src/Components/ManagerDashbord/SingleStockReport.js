import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // assumes route param :id
import axios from 'axios';
import '../../Styles/expenses.css';

const SingleStockReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        const response = await axios.get(`/api/diraja/stock-reports/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setReport(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to fetch stock report.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) return <div className="expenses-container">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!report) return null;

  return (
    <div className="expenses-container">
      <h2 className="text-2xl font-semibold mb-4">Stock Report Details</h2>

      <div className="mb-4">
        <p><strong>Shop:</strong> {report.shop_name}</p>
        <p><strong>Reported By:</strong> {report.user_name}</p>
        <p><strong>Date:</strong> {new Date(report.reported_at).toLocaleString('en-KE')}</p>
        {report.comment && <p><strong>Comment:</strong> {report.comment}</p>}
      </div>

      <table className="expenses-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(report.report).map(([item, quantity]) => (
            <tr key={item}>
              <td>{item}</td>
              <td>{quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SingleStockReport;
