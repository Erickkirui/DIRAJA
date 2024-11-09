import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShopTodaySales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');  // Retrieve shop_id from local storage

        if (!accessToken || !shopId) {
          setError("Access token or shop ID not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`http://16.171.22.129/diraja/sales/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const salesData = response.data.sales || [];
        
        const today = new Date().toISOString().split('T')[0];
        const todaySales = salesData.filter(sale => sale.created_at === today);

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
            
            <th>Item Name</th>
            <th>Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? (
            sales.map(sale => (
              <tr key={sale.sale_id}>
               
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

export default ShopTodaySales;
