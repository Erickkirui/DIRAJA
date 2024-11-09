import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/expenses.css'

const AddExpense = () => {
  const [expenseData, setExpenseData] = useState({
    shop_id: '',
    item: '',
    description: '',
    quantity: '',
    totalPrice: '',
    amountPaid: '',
    created_at: ''
  });

  const [shops, setShops] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [shopError, setShopError] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('http://16.171.22.129/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setShops(response.data);

        if (response.data.length === 0) {
          setShopError(true);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setShopError(true);
      }
    };

    fetchShops();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'shop_id' ? parseInt(value, 10) : value;

    if (name === 'shop_id' && isNaN(parsedValue)) {
      return;
    }

    setExpenseData({
      ...expenseData,
      [name]: parsedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expenseData.shop_id) {
      setMessage({ type: 'error', text: 'Please select a shop' });
      return;
    }

    try {
      const response = await axios.post('http://16.171.22.129/diraja/newexpense', expenseData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Expense added successfully' });
        setExpenseData({
          shop_id: '',
          item: '',
          description: '',
          quantity: '',
          totalPrice: '',
          amountPaid: '',
          created_at: ''
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add expense' });
      console.error('Error adding expense:', error);
    }
  };

  return (
    <div>
      <h1>Add Expenses</h1>
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div>
          <select
            name="shop_id"
            value={expenseData.shop_id}
            onChange={handleChange}
            className={`select ${expenseData.shop_id ? 'valid' : 'invalid'}`}
          >
            <option value="">Select a shop</option>
            {shops.length > 0 ? (
              shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id || ''}>
                  {shop.shopname}
                </option>
              ))
            ) : (
              <option disabled>No shops available</option>
            )}
          </select>
          {shopError && <p className="error-text">No shops available</p>}
        </div>

        {/* Other form fields */}
        <div>
          <input
            type="text"
            name="item"
            value={expenseData.item}
            onChange={handleChange}
            placeholder="Item"
            className="input"
          />
        </div>

        <div>
          <input
            type="text"
            name="description"
            value={expenseData.description}
            onChange={handleChange}
            placeholder="Description"
            className="input"
          />
        </div>

        <div>
          <input
            type="number"
            name="quantity"
            value={expenseData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="input"
          />
        </div>

        <div>
          <input
            type="number"
            name="totalPrice"
            value={expenseData.totalPrice}
            onChange={handleChange}
            placeholder="Total Price"
            className="input"
          />
        </div>

        <div>
          <input
            type="number"
            name="amountPaid"
            value={expenseData.amountPaid}
            onChange={handleChange}
            placeholder="Amount Paid"
            className="input"
          />
        </div>

        <div>
          <input
            type="date"
            name="created_at"
            value={expenseData.created_at}
            onChange={handleChange}
            placeholder="Created At"
            className="input"
          />
        </div>

        <button type="submit" className="button">
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
