import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you're using React Router for navigation
// import '../Styles/singleemployee.css';

const SingleSale = () => {
  const { sale_id } = useParams(); // Get the sale ID from the URL
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch sale details
    const fetchSale = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const response = await fetch(`/diraja/sale/${sale_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}` // Assuming token is stored in localStorage
          }
        });

        if (!response.ok) {
          const errorData = await response.json(); // Try to get error details from the response
          throw new Error(errorData.message || 'Failed to fetch sale data'); // Use message from the response if available
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

  // Destructure sale details
  const {
    sale_id: saleId,
    username,
    shopname,
    customer_name,
    customer_number,
    item_name,
    quantity,
    metric,
    batchnumber,
    total_price,
    amount_paid,
    payment_method,
    balance,
    created_at
  } = sale || {}; // Use optional chaining

  return (
    <div>
      {sale ? (
        <div>
          <h2>Sales Details</h2>
          <p><strong>Sale ID:</strong> {saleId}</p>
          <p><strong>Employee:</strong> {username}</p>
          <p><strong>Shop Name:</strong> {shopname}</p>
          <p><strong>Customer Name:</strong> {customer_name}</p>
          <p><strong>Customer Number:</strong> {customer_number}</p>
          <p><strong>Item:</strong> {item_name}</p>
          <p><strong>Quantity:</strong> {quantity} {metric}</p>
          <p><strong>Batch:</strong> {batchnumber}</p>
          <p><strong>Total Price:</strong> {total_price}</p>
          <p><strong>Amount Paid:</strong> {amount_paid}</p>
          <p><strong>Payment Method:</strong> {payment_method}</p>
          <p><strong>Balance:</strong> {balance}</p>
          <p><strong>Date:</strong> {new Date(created_at).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No sales details found.</p>
      )}
    </div>
  );
};

export default SingleSale;
