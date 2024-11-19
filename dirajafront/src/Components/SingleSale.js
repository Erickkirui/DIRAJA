import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import '../Styles/sales.css';

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [shopname, setShopname] = useState(''); // State for shop name
  const [username, setUsername] = useState(''); // State for username

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
        setFormData(data.sale); // Initialize form data

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

  const handleEditClick = () => setIsEditing(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/diraja/sale/${sale_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update sale');

      const data = await response.json();
      setSale({ ...sale, ...formData });
      setIsEditing(false);
      alert(data.message || 'Sale updated successfully');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const downloadReceipt = () => {
    const doc = new jsPDF();
    const saleDetails = document.querySelector('.sale-details');
    const content = saleDetails.innerHTML;

    doc.html(content, {
      callback: function (doc) {
        doc.save('receipt.pdf');
      },
      x: 10,
      y: 10,
      width: 180,
      autoPaging: true,
    });
  };

  if (loading) return <div>Loading sale details...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="single-sale-container">
      <div className="sale-details">
        <div className="sale-top-part">
          <h1>{shopname}</h1>
          <p><strong>Invoice Number:</strong> {sale.sale_id}</p>
          <p><strong>Clerk:</strong> {username}</p>
          <p><strong>Invoice Status:</strong> {sale.status}</p>
        </div>

        {/* Table for Sale Details */}
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

      <div className="edit-sale-button">
        <button onClick={handleEditClick}>Edit Sale</button>
      </div>

      {/* Download Receipt Button */}
      <div className="download-receipt-button">
        <button onClick={downloadReceipt}>Download Receipt</button>
      </div>

      {isEditing && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Sale</h3>
            <form onSubmit={handleFormSubmit}>
              <input
                name="customer_name"
                value={formData.customer_name || ''}
                onChange={handleInputChange}
                placeholder="Customer Name"
              />
              <input
                name="status"
                value={formData.status || ''}
                onChange={handleInputChange}
                placeholder="Status"
              />
              <input
                name="customer_number"
                value={formData.customer_number || ''}
                onChange={handleInputChange}
                placeholder="Customer Number"
              />
              <input
                name="item_name"
                value={formData.item_name || ''}
                onChange={handleInputChange}
                placeholder="Item Name"
              />
              <input
                name="quantity"
                value={formData.quantity || ''}
                onChange={handleInputChange}
                placeholder="Quantity"
              />
              <input
                name="unit_price"
                value={formData.unit_price || ''}
                onChange={handleInputChange}
                placeholder="Unit Price"
              />
              <input
                name="amount_paid"
                value={formData.amount_paid || ''}
                onChange={handleInputChange}
                placeholder="Amount Paid"
              />
              <input
                name="total_price"
                value={formData.total_price || ''}
                onChange={handleInputChange}
                placeholder="Total Price"
              />
              <div className="modal-actions">
                <button type="submit" className="save-button">Save</button>
                <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSale;
