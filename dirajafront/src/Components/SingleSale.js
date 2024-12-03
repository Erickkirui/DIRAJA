import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DownloadPDF from './Download/DownloadPDF'; // Import the DownloadPDF component
import LoadingAnimation from './LoadingAnimation';
import '../Styles/sales.css';

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopname, setShopname] = useState(''); // State for shop name
  const [username, setUsername] = useState(''); // State for username
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [editedSale, setEditedSale] = useState({}); // State for the edited sale data

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
        setEditedSale(data.sale); // Initialize the edited sale data

        // Fetch shop name
        if (data.sale.shop_id) {
          const shopResponse = await fetch(`/api/diraja/shop/${data.sale.shop_id}`);
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShopname(shopData.name);
          }
        }

        // Fetch username
        if (data.sale.user_id) {
          const userResponse = await fetch(`/api/diraja/user/${data.sale.user_id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUsername(userData.username);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedSale({
      ...editedSale,
      [name]: value,
    });
  };

  const handleSaveClick = async () => {
    try {
      const response = await fetch(`/api/diraja/sale/${sale_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(editedSale),
      });

      if (!response.ok) throw new Error('Failed to save changes');

      const updatedSale = await response.json();
      console.log('Updated Sale:', updatedSale); // Debug log

      // Update state to re-render with updated data and exit edit mode
      setSale(updatedSale);
      setEditedSale(updatedSale);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating sale:', err);
    }
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="single-sale-container">
      <div className='action-single'>
        <DownloadPDF tableId="sale-details" fileName={`Sale-${sale.sale_id}`} />
        <button onClick={handleEditClick} className='button'>Edit</button>
      </div>

      <div className="sale-details" id="sale-details">
        <div className="sale-top-part">
          <h1>{shopname}</h1>
          <p><strong>Invoice Number:</strong> {sale.sale_id}</p>
          <p><strong>Clerk:</strong> {sale.username}</p>
          <p><strong>Invoice Status:</strong> {sale.status}</p>
        </div>

        {isEditing ? (
          <div className="edit-form">
            <label>
              Item:
              <input
                type="text"
                name="item_name"
                value={editedSale.item_name || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Quantity:
              <input
                type="number"
                name="quantity"
                value={editedSale.quantity || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Unit Price:
              <input
                type="number"
                name="unit_price"
                value={editedSale.unit_price || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Total Price:
              <input
                type="number"
                name="total_price"
                value={editedSale.total_price || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Status:
              <select
                name="status"
                value={editedSale.status || 'unpaid'}
                onChange={handleChange}
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </label>
            <button onClick={handleSaveClick}>Save Changes</button>
          </div>
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
            <p>Amount paid: <strong>{sale.amount_paid} ksh</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleSale;
