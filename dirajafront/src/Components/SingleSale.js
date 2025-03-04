import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DownloadPDF from './Download/DownloadPDF';
import LoadingAnimation from './LoadingAnimation';
import PaymentMethods from './PaymentMethod';
import '../Styles/sales.css';

const SingleSale = () => {
  const { sale_id } = useParams();
  const [sale, setSale] = useState(null); // Initialize sale state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopname, setShopname] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentDate, setPaymentDate] = useState(''); // State for payment date

  const validPaymentMethods = ['cash', 'bank', 'mpesa', 'sasapay']; // List of valid payment methods

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
        setLoading(false); // Once the data is fetched, set loading to false
      }
    };

    fetchSale();
  }, [sale_id]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedSale, updatedPaymentMethods) => {
    try {
      const recalculatedTotalPrice = updatedSale.quantity * updatedSale.unit_price;
      const saleData = { ...updatedSale, total_price: recalculatedTotalPrice };
  
      // Save sale details
      const saleResponse = await fetch(`/api/diraja/sale/${sale_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(saleData),
      });
  
      if (!saleResponse.ok) throw new Error('Failed to update sale details');
  
      const updatedSaleData = await saleResponse.json();
  
      // Now update payment methods
      const paymentResponse = await fetch(`/api/diraja/sale/${sale_id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          payment_methods: updatedPaymentMethods,
          payment_date: paymentDate || new Date().toISOString().split('T')[0], // Send the payment date from the form
        }),
      });
  
      if (!paymentResponse.ok) throw new Error('Failed to update payment methods');
  
      const updatedPaymentData = await paymentResponse.json();
  
      setSale(updatedSaleData.sale); // Update sale data
      setSuccessMessage('Sale and payment methods updated successfully');
      setIsEditing(false);
  
      // Reload the page to show the updated data
      window.location.reload(); // This reloads the page and fetches the updated sale data
  
    } catch (err) {
      setError('Failed to save changes');
    }
  };
  

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Show loading animation when data is still being fetched
  if (loading) return <LoadingAnimation />;

  // Handle error if any
  if (error) return <div>Error: {error}</div>;

  // Ensure sale is defined before rendering details
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

        {successMessage && <div className="success-message">{successMessage}</div>} {/* Success message */}

        {isEditing ? (
          <div className="edit-sale">
            {/* Sale Details Form */}
            <div className="edit-sale-form">
              <label>Item Name</label>
              <input
                type="text"
                value={sale?.item_name || ''}
                onChange={(e) => setSale({ ...sale, item_name: e.target.value })}
              />
              <label>Quantity</label>
              <input
                type="number"
                value={sale?.quantity || ''}
                onChange={(e) => setSale({ ...sale, quantity: e.target.value })}
              />
              <label>Unit Price</label>
              <input
                type="number"
                value={sale?.unit_price || ''}
                onChange={(e) => setSale({ ...sale, unit_price: e.target.value })}
              />
            </div>

            {/* Payment Date Field */}
            <div className="payment-date-form">
              <label>Payment Date</label>
              <input
                type="date"
                value={paymentDate || new Date().toISOString().split('T')[0]} // Default to today's date
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Payment Methods Section */}
            <PaymentMethods
              paymentMethods={sale?.payment_methods || []}
              validPaymentMethods={validPaymentMethods}
              handlePaymentChange={(index, field, value) => {
                const updatedPayments = [...sale?.payment_methods];
                updatedPayments[index][field] = value;
                setSale({ ...sale, payment_methods: updatedPayments });
              }}
              addPaymentMethod={() => {
                const newPaymentMethod = { method: '', amount: '', transaction_code: '' };
                setSale({ ...sale, payment_methods: [...sale?.payment_methods, newPaymentMethod] });
              }}
              removePaymentMethod={(index) => {
                const updatedPayments = sale?.payment_methods.filter((_, i) => i !== index);
                setSale({ ...sale, payment_methods: updatedPayments });
              }}
            />

            <button onClick={() => handleSave(sale, sale?.payment_methods)} className="button">Save</button>
            <div>
            <button onClick={handleCancel} className="cancel-button">Cancel</button>
              </div>
            
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
                  <td>{sale?.item_name}</td>
                  <td>{sale?.quantity} {sale?.metric}</td>
                  <td>{sale?.unit_price} ksh</td>
                  <td>{sale?.total_price} ksh</td>
                </tr>
              </tbody>
            </table>

            <p><strong>Payment Method:</strong> {sale?.payment_method}</p>
            <div className="payment-methods">
              {sale?.payment_methods && sale.payment_methods.map((payment, index) => (
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
