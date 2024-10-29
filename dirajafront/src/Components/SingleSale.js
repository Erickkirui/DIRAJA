// SingleSale.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you're using React Router for navigation
// import '../Styles/singleemployee.css';


const SingleSale = () => {
  const { sale_id } = useParams(); // Get the employee ID from the URL
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch employee details
    const fetchSale = async () => {
      try {
        const response = await fetch(`/diraja/sale/${sale_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}` // Assuming token is stored in localStorage
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sale data');
        }

        const data = await response.json();
        setSale(data); // Set sale data
      } catch (err) {
        setError(err.message); // Handle error
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchSale();
  }, [sale_id]);

  if (loading) {
    return <div>Loading sale details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {sale ? (
        <div>
          <h2>Sales Details</h2>
          <p><strong>Sale ID:</strong> {sale.sales_id}</p>
          <p><strong>Employee:</strong> {username}</p>
          <p><strong>Shop Name:</strong> {shopname}</p>
          <p><strong>Customer name:</strong> {sale.customer_name}</p>
          <p><strong>Customer number:</strong> {sale.customer_number}</p>
          <p><strong>Item:</strong> {sale.item_name}</p>
          <p><strong>Quantity:</strong> {sale.quantity} {sale.metric}</p>
          <p><strong>Batch:</strong> {sale.batchnumber}</p>
          <p><strong>Total price:</strong> {sale.total_price}</p>
          <p><strong>Amount paid:</strong> {sale.amount_paid}</p>
          <p><strong>Payment method:</strong> {sale.payment_method}</p>
          <p><strong>Balance:</strong> {sale.balance}</p>
          <p><strong>Date:</strong> {new Date(sale.created_at).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No sales details found.</p>
      )}
    </div>
  );
};

export default SingleSale;
