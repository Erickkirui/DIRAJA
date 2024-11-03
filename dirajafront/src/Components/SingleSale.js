import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null);
  const [shopname, setShopname] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch sale details
    const fetchSale = async () => {
      try {
        const response = await fetch(`/diraja/sale/${sale_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sale data');
        }

        const data = await response.json();
        setSale(data.sale);

        // Fetch shop name
        if (data.sale.shop_id) {
          const shopResponse = await fetch(`/diraja/shop/${data.sale.shop_id}`);
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShopname(shopData.name); // Assuming the shop data has a `name` field
          }
        }

        // Fetch user name
        if (data.sale.user_id) {
          const userResponse = await fetch(`/diraja/user/${data.sale.user_id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUsername(userData.username); // Assuming user data has a `username` field
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
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
          <h2>Sale Details</h2>
          <p><strong>Sale ID:</strong> {sale.sale_id}</p>
          <p><strong>Employee:</strong> {sale.username }</p>
          <p><strong>Shop Name:</strong> {sale.shop_name}</p>
          <p><strong>Customer Name:</strong> {sale.customer_name}</p>
          <p><strong>Customer Number:</strong> {sale.customer_number}</p>
          <p><strong>Item:</strong> {sale.item_name}</p>
          <p><strong>Quantity:</strong> {sale.quantity} {sale.metric}</p>
          <p><strong>Batch:</strong> {sale.batchnumber}</p>
          <p><strong>Total Price:</strong> {sale.total_price}</p>
          <p><strong>Amount Paid:</strong> {sale.amount_paid}</p>
          <p><strong>Payment Method:</strong> {sale.payment_method}</p>
          <p><strong>Balance:</strong> {sale.balance}</p>
          <p><strong>Date:</strong> {new Date(sale.created_at).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No sale found.</p>
      )}
    </div>
  );
};

export default SingleSale;
