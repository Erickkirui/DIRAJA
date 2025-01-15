import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DownloadPDF from './Download/DownloadPDF'; // Import the DownloadPDF component
import LoadingAnimation from './LoadingAnimation';
import EditSaleForm from './EditSaleForm'; // Import the new EditSaleForm component
import '../Styles/sales.css';

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopname, setShopname] = useState(''); // State for shop name
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [successMessage, setSuccessMessage] = useState(''); // State for success message

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const response = await fetch(`/api/diraja/sale/${sale_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch sale data');

        const data = await response.json();
        setSale(data.sale);

        // Fetch shop name with authorization header
        if (data.sale.shop_id) {
          const shopResponse = await fetch(`/api/diraja/shop/${data.sale.shop_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('access_token')}`, // Include auth header here
            },
          });

          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShopname(shopData.name);
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

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedSale) => {
    try {
      const response = await fetch(`/api/diraja/sale/${sale_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(updatedSale),
      });

      if (!response.ok) throw new Error('Failed to save changes');

      const updatedSaleData = await response.json();
      setSale(updatedSaleData);
      setSuccessMessage('Sale successfully updated!'); // Show success message
      setIsEditing(false); // Exit edit mode

      // Reload the page to reflect the updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Reload after 2 seconds to show success message
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setIsEditing(false); // Cancel edit mode
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="single-sale-container">
      <div className="action-single">
        <DownloadPDF tableId="sale-details" fileName={`Sale-${sale.sale_id}`} />
        <button onClick={handleEditClick} className="button">Edit</button>
      </div>

      <div className="sale-details" id="sale-details">
        <div className="sale-top-part">
          <h1>{shopname}</h1>
          <p><strong>Invoice Number:</strong> {sale.sale_id}</p>
          <p><strong>Clerk:</strong> {sale.username}</p>
          <p><strong>Invoice Status:</strong> {sale.status}</p>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>} {/* Display success message */}

        {isEditing ? (
          <EditSaleForm
            sale={sale}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <div className="view-sale">
            {/* Display Sale Details */}
            <table className="sale-details-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{sale.item_name}</td>
                  <td>{sale.quantity} {sale.metric}</td>
                  <td>{sale.unit_price} ksh</td>
                  <td>{sale.total_price} ksh</td>
                </tr>
              </tbody>
            </table>
           
            <p><strong>Payment Method:</strong> {sale.payment_method}</p>
            <div className="payment-methods">
              {sale.payment_methods && sale.payment_methods.map((payment, index) => (
                <div key={index}>
                  <p><strong>{payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}:</strong> {payment.amount_paid} ksh</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleSale;
