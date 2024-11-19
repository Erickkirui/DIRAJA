import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TodaysSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError("No access token found, please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/diraja/allsales', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Log the response to verify the sales data
        console.log("API Response:", response.data);

        const salesData = response.data.sales || [];

        const today = new Date().toISOString().split('T')[0];

        // Filter sales by today's date, using only the date portion of `created_at`
        const todaySales = salesData.filter(sale => {
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate === today;
        });

        console.log("Today's Sales:", todaySales); // Log filtered sales for today
        setSales(todaySales);
      } catch (err) {
        setError(`Error fetching sales: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (loading) return <p className="loading-message">Loading sales...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="sales-today-container">
      <h5>Today's Sales</h5>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Shop Name</th>
            <th>Item Name</th>
            <th>Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? (
            sales.map(sale => (
              <tr key={sale.sale_id}>
                <td>{sale.shopname}</td>
                <td>{sale.item_name}</td>
                <td>{sale.amount_paid}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No sales recorded for today</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TodaysSales;
