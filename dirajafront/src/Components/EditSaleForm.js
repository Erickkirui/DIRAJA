import React, { useState, useEffect } from 'react';

const EditSaleForm = ({ sale, onSave, onCancel }) => {
  const [editedSale, setEditedSale] = useState({ ...sale });

  const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay']; // Valid payment methods

  useEffect(() => {
    setEditedSale({ ...sale }); // Reset form to current sale data when the sale prop changes
  }, [sale]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedSale({
      ...editedSale,
      [name]: value,
    });
  };

  // Dynamically calculate total price
  const totalPrice = editedSale.quantity * editedSale.unit_price || 0;

  const handlePaymentMethodChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPaymentMethods = [...editedSale.payment_methods];
    updatedPaymentMethods[index] = {
      ...updatedPaymentMethods[index],
      [name]: value,
    };
    setEditedSale({
      ...editedSale,
      payment_methods: updatedPaymentMethods,
    });
  };

  const handleAddPaymentMethod = () => {
    setEditedSale({
      ...editedSale,
      payment_methods: [
        ...editedSale.payment_methods,
        { payment_method: '', amount_paid: '' }, // Added empty payment method object
      ],
    });
  };

  const handleRemovePaymentMethod = (index) => {
    const updatedPaymentMethods = editedSale.payment_methods.filter((_, i) => i !== index);
    setEditedSale({
      ...editedSale,
      payment_methods: updatedPaymentMethods,
    });
  };

  const handleSaveClick = () => {
    onSave({ ...editedSale, total_price: totalPrice }); // Pass updated total price to onSave
  };

  return (
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
        Unit Price (Ksh):
        <input
          type="number"
          name="unit_price"
          value={editedSale.unit_price || ''}
          onChange={handleChange}
        />
      </label>

      <label>
        Total Price (Ksh):
        <p className="total-price-display">{totalPrice} Ksh</p>
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

      <div className="payment-methods">
        <h3>Payment Methods</h3>
        {editedSale.payment_methods.map((payment, index) => (
          <div key={index} className="payment-method">
            <label>Payment Method:</label>
            <select
              name="payment_method"
              value={payment.payment_method || ''}
              onChange={(e) => handlePaymentMethodChange(index, e)}
            >
              {validPaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </option>
              ))}
            </select>

            <label>Amount Paid (Ksh):</label>
            <input
              type="number"
              name="amount_paid"
              value={payment.amount_paid || ''}
              onChange={(e) => handlePaymentMethodChange(index, e)}
            />

            <button
              type="button"
              className="button remove"
              onClick={() => handleRemovePaymentMethod(index)}
            >
              Remove Payment Method
            </button>
          </div>
        ))}
        <button type="button" className="payment-button" onClick={handleAddPaymentMethod}>
          Add Payment Method
        </button>
      </div>

      <div className="bottom-class">
        <button onClick={handleSaveClick} className="button">Save Changes</button>
        <button onClick={onCancel} className="payment-button">Cancel</button>
      </div>
    </div>
  );
};

export default EditSaleForm;
