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
    paidTo: '',
    created_at: '',
    source: '',
    comments: '' // Updated field for comments
  });

  const [shops, setShops] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchShopsAndCategories = async () => {
      try {
        const shopResponse = await axios.get('/api/diraja/allshops', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        setShops(shopResponse.data);

        const expenseResponse = await axios.get('/api/diraja/allexpenses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        const categories = [...new Set(expenseResponse.data.map(expense => expense.category))];
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
    setExpenseData({ ...expenseData, [name]: value });
  };

  const handleCategoryInput = (e) => {
    const value = e.target.value;
    setExpenseData({ ...expenseData, category: value });
    setFilteredCategories(value ? categorySuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(value.toLowerCase())) : []);
  };

  const handleCategorySelect = (suggestion) => {
    setExpenseData({ ...expenseData, category: suggestion });
    setFilteredCategories([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expenseData.shop_id || !expenseData.category || !expenseData.source) {
      setMessage({ type: 'error', text: 'Please select a shop, category, and source' });
      return;
    }

    // Validate numeric fields
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
      const response = await axios.post('/api/diraja/newexpense', expenseData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
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
          paidTo: '',
          created_at: '',
          source: '',
          comments: '' // Reset the comments field
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
          <select name="shop_id" value={expenseData.shop_id} onChange={handleChange} className="select">
            <option value="">Select a shop</option>
            {shops.map(shop => (
              <option key={shop.shop_id} value={shop.shop_id}>{shop.shopname}</option>
            ))}
          </select>
        </div>

        {/* Category Input with Suggestions */}
        <div style={{ position: 'relative' }}>
          <input type="text" name="category" value={expenseData.category} onChange={handleCategoryInput} placeholder="Enter category" className="input" />
          {filteredCategories.length > 0 && (
            <ul className="suggestions">
              {filteredCategories.map((suggestion, index) => (
                <li key={index} onClick={() => handleCategorySelect(suggestion)}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Source Dropdown */}
        <div>
          <select name="source" value={expenseData.source} onChange={handleChange} className="select">
            <option value="">Select Source</option>
            <option value="Mpesa - 0748277960">Mpesa - 0748277960</option>
            <option value="Mpesa - 0116400393">Mpesa - 0116400393</option>
            <option value="Sasapay - Mirema">Sasapay - Mirema</option>
            <option value="Sasapay - TRM">Sasapay - TRM</option>
            <option value="Sasapay - Lumumba Drive">Sasapay - Lumumba Drive</option>
            <option value="Sasapay - Zimmerman shop">Sasapay - Zimmerman shop</option>
            <option value="Sasapay - Zimmerman Store">Sasapay - Zimmerman Store</option>
            <option value="Sasapay - Githurai 44">Sasapay - Githurai 44</option>
            <option value="Sasapay - Kangundo Rd Market">Sasapay - Kangundo Rd Market</option>
            <option value="Sasapay - Ngoingwa">Sasapay - Ngoingwa</option>
            <option value="Sasapay - Thika Market">Sasapay - Thika Market</option>
            <option value="Sasapay - Mabanda">Sasapay - Mabanda</option>
            <option value="Sasapay - Kisumu">Sasapay - Kisumu</option>
            <option value="Sasapay - Pipeline">Sasapay - Pipeline</option>
            <option value="Sasapay - Turi">Sasapay - Turi</option>
            <option value="Sta">Sta</option>
            <option value="Standard Chartered Bank">Standard Chartered Bank</option>
            <option value="External funding">External funding</option>
          </select>
        </div>

        {/* Comments Field */}
        <div>
          <input type="text" name="comments" value={expenseData.comments} onChange={handleChange} placeholder="Comments (Optional)" className="input" />
        </div>

        {/* Other form fields */}
        <div><input type="text" name="item" value={expenseData.item} onChange={handleChange} placeholder="Item" className="input" /></div>
        <div><input type="text" name="description" value={expenseData.description} onChange={handleChange} placeholder="Description" className="input" /></div>
        <div><input type="number" name="quantity" value={expenseData.quantity} onChange={handleChange} placeholder="Quantity" className="input" /></div>
        <div><input type="number" name="totalPrice" value={expenseData.totalPrice} onChange={handleChange} placeholder="Total Price" className="input" /></div>
        <div><input type="number" name="amountPaid" value={expenseData.amountPaid} onChange={handleChange} placeholder="Amount Paid" className="input" /></div>
        <div><input type="text" name="paidTo" value={expenseData.paidTo} onChange={handleChange} placeholder="Paid To" className="input" /></div>
        <div><input type="date" name="created_at" value={expenseData.created_at} onChange={handleChange} className="input" /></div>

        <button type="submit" className="button">Add Expense</button>
      </form>
    </div>
  );
};

export default AddExpense;
