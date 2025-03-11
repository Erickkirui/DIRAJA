import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DownloadPDF from './Download/DownloadPDF';
import LoadingAnimation from './LoadingAnimation';
import '../Styles/sales.css';

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopname, setShopname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

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

        if (data.sale.shop_id) {
          const shopResponse = await fetch(`/api/diraja/shop/${data.sale.shop_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
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

  const handleSave = async () => {
    try {
      const recalculatedTotalPrice = sale.quantity * sale.unit_price;
      const updatedSale = { ...sale, total_price: recalculatedTotalPrice, payment_date: paymentDate || new Date().toISOString().split('T')[0] };

      const response = await fetch(`/api/diraja/sale/${sale_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(updatedSale),
      });

      if (!response.ok) throw new Error('Failed to update sale details');

      setSuccessMessage('Sale updated successfully');
      setIsEditing(false);

      window.location.reload();
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <div>Error: {error}</div>;
  if (!sale) return <div>Sale not found</div>;

  return (
    <div className="single-sale-container">
      <div className="action-single">
        <DownloadPDF tableId="sale-details" fileName={`Sale-${sale?.sale_id}`} />
        <button onClick={handleEditClick} className="button">Edit</button>
      </div>

      <div className="sale-details" id="sale-details">
        <div className="sale-top-part">
          <h1>{shopname}</h1>
          <p><strong>Invoice Number:</strong> {sale?.sale_id}</p>
          <p><strong>Clerk:</strong> {sale?.username}</p>
          <p><strong>Invoice Status:</strong> {sale?.status}</p>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}

        {isEditing ? (
          <div className="edit-sale">
            <label>Item Name</label>
            <input type="text" value={sale?.item_name || ''} onChange={(e) => setSale({ ...sale, item_name: e.target.value })} />
            <label>Quantity</label>
            <input type="number" value={sale?.quantity || ''} onChange={(e) => setSale({ ...sale, quantity: e.target.value })} />
            <label>Unit Price</label>
            <input type="number" value={sale?.unit_price || ''} onChange={(e) => setSale({ ...sale, unit_price: e.target.value })} />
            <label>Payment Method</label>
            <input type="text" value={sale?.payment_method || ''} onChange={(e) => setSale({ ...sale, payment_method: e.target.value })} />
            <label>Payment Date</label>
            <input type="date" value={paymentDate || new Date().toISOString().split('T')[0]} onChange={(e) => setPaymentDate(e.target.value)} />

            <button onClick={handleSave} className="button">Save</button>
            <button onClick={handleCancel} className="cancel-button">Cancel</button>
          </div>
        ) : (
          <div className="view-sale">
            <table className="sale-details-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{sale?.item_name}</td>
                  <td>{sale?.quantity} {sale?.metric}</td>
                  <td>{sale?.unit_price} ksh</td>
                  <td>{sale?.total_price} ksh</td>
                  <td>{sale?.payment_method}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleSale;
