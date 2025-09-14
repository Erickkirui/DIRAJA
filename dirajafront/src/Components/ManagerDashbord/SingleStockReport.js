import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

        const response = await axios.get(`api/diraja/stock-reports/${id}`, {
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

  // Extract differences if available
  const { differences, ...stockItems } = report.report || {};

  return (
    <div className="expenses-container">
      <h2 className="text-2xl font-semibold mb-4">Stock Report Details</h2>

      <div className="mb-4">
        <p><strong>Shop:</strong> {report.shop_name}</p>
        <p><strong>Reported By:</strong> {report.user_name}</p>
        <p><strong>Date:</strong> {new Date(report.reported_at).toLocaleString('en-KE')}</p>
        {report.comment && <p><strong>Comment:</strong> {report.comment}</p>}
      </div>

      {/* Report Table */}
      <h3 className="text-xl font-semibold mb-2">Reported Stock</h3>
      <table className="expenses-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stockItems).map(([item, quantity]) => (
            item !== 'differences' && (
              <tr key={item}>
                <td>{item}</td>
                <td>{quantity}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>

      {/* Differences Table */}
      {differences && Object.keys(differences).length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-8 mb-2">Discrepancies</h3>
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Difference</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(differences).map(([item, diff]) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>{diff.expected}</td>
                  <td>{diff.actual}</td>
                  <td style={{ color: 'red' }}>{diff.difference}</td> {/* 👈 red text */}
                  <td>{diff.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

    </div>
  );
};

export default SingleStockReport;
