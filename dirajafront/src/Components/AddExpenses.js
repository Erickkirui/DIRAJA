import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/expenses.css';

const AddExpense = () => {
  const [expenseData, setExpenseData] = useState({
    shop_id: '',
    category: '',
    item: '',
    description: '',
    quantity: '',
    totalPrice: '',
    amountPaid: '',
    created_at: ''
  });

  const [shops, setShops] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchShopsAndCategories = async () => {
      try {
        const shopResponse = await axios.get(' /api/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setShops(shopResponse.data);

        const expenseResponse = await axios.get(' /api/diraja/allexpenses', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const categories = [
          ...new Set(expenseResponse.data.map((expense) => expense.category))
        ];
        setCategorySuggestions(categories);
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategorySuggestions([]);
      }
    };

    fetchShopsAndCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpenseData({
      ...expenseData,
      [name]: value
    });
  };

  const handleCategoryInput = (e) => {
    const value = e.target.value;
    setExpenseData({ ...expenseData, category: value });
    if (value) {
      setFilteredCategories(
        categorySuggestions.filter((suggestion) =>
          suggestion.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setFilteredCategories([]);
    }
  };

  const handleCategorySelect = (suggestion) => {
    setExpenseData({ ...expenseData, category: suggestion });
    setFilteredCategories([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expenseData.shop_id || !expenseData.category) {
      setMessage({ type: 'error', text: 'Please select both a shop and a category' });
      return;
    }

    if (isNaN(expenseData.quantity) || expenseData.quantity <= 0) {
      setMessage({ type: 'error', text: 'Quantity must be a valid number greater than 0' });
      return;
    }

    if (isNaN(expenseData.totalPrice) || expenseData.totalPrice <= 0) {
      setMessage({ type: 'error', text: 'Total Price must be a valid number greater than 0' });
      return;
    }

    if (isNaN(expenseData.amountPaid) || expenseData.amountPaid <= 0) {
      setMessage({ type: 'error', text: 'Amount Paid must be a valid number greater than 0' });
      return;
    }

    try {
      const response = await axios.post(' /api/diraja/newexpense', expenseData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Expense added successfully' });
        setExpenseData({
          shop_id: '',
          category: '',
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
        {/* Shop Dropdown */}
        <div>
          <select
            name="shop_id"
            value={expenseData.shop_id}
            onChange={handleChange}
            className={`select ${expenseData.shop_id ? 'valid' : 'invalid'}`}
          >
            <option value="">Select a shop</option>
            {shops.map((shop) => (
              <option key={shop.shop_id} value={shop.shop_id}>
                {shop.shopname}
              </option>
            ))}
          </select>
        </div>

        {/* Category Input with Suggestions */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            name="category"
            value={expenseData.category}
            onChange={handleCategoryInput}
            placeholder="Enter category"
            className="input"
          />
          {filteredCategories.length > 0 && (
            <ul className="suggestions">
              {filteredCategories.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleCategorySelect(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
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
