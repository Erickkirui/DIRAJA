import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddExpense = () => {
  const [expenseData, setExpenseData] = useState({
    shops_id: '',  // This matches the backend expectation
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
        const response = await axios.get('/diraja/allshops', {
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

    // Convert shops_id to an integer
    const parsedValue = name === 'shops_id' ? parseInt(value, 10) : value;

    setExpenseData({
      ...expenseData,
      [name]: parsedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expenseData.shops_id) {
      setMessage({ type: 'error', text: 'Please select a shop' });
      return;
    }

    // Log the expense data being sent to the server
    console.log('Posting expense data:', JSON.stringify(expenseData, null, 2));

    try {
      const response = await axios.post('/diraja/newexpense', expenseData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Expense added successfully' });
        setExpenseData({
          shops_id: '',  // Reset after success
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
      {message.text && (
        <div
          className={`p-4 mb-4 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="shops_id">Shop</label>
          <select
            name="shops_id"  // This matches the backend field name
            value={expenseData.shops_id}
            onChange={handleChange}
            className={`border p-2 w-full ${expenseData.shops_id ? 'text-black' : 'text-red-500'}`}
          >
            <option value="">Select a shop</option>
            {shops.length > 0 ? (
              shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id}>  {/* Use shop_id */}
                  {shop.shopname}
                </option>
              ))
            ) : (
              <option disabled>No shops available</option>
            )}
          </select>
          {shopError && <p className="text-red-500 mt-1">No shops available</p>}
        </div>

        {/* Other form fields */}
        <div>
          <label htmlFor="item">Item</label>
          <input
            type="text"
            name="item"
            value={expenseData.item}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <input
            type="text"
            name="description"
            value={expenseData.description}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={expenseData.quantity}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="totalPrice">Total Price</label>
          <input
            type="number"
            name="totalPrice"
            value={expenseData.totalPrice}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="amountPaid">Amount Paid</label>
          <input
            type="number"
            name="amountPaid"
            value={expenseData.amountPaid}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="created_at">Created At</label>
          <input
            type="date"
            name="created_at"
            value={expenseData.created_at}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
