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
    paymentRef:'',
    comments: ''
  });

  const [shops, setShops] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopResponse, expenseResponse, accountResponse] = await Promise.all([
          axios.get('/api/diraja/allshops', {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          }),
          axios.get('/api/diraja/allexpenses', {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          }),
          axios.get('/api/diraja/all-acounts', {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          })
        ]);

        setShops(shopResponse.data);
        const categories = [...new Set(expenseResponse.data.map(expense => expense.category))];
        setCategorySuggestions(categories);
        
        // Log the account response to check its format
        console.log('Bank Accounts Response:', accountResponse.data);

        // Check if the accounts response is an array before setting the state
        if (Array.isArray(accountResponse.data.accounts)) {
          setAccounts(accountResponse.data.accounts);
        } else {
          console.error('Bank accounts data is not an array');
          setAccounts([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategorySuggestions([]);
        setAccounts([]);
      }
    };

    fetchData();
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

    if (!expenseData.paymentRef) {
      setMessage({ type: 'error', text: 'Please add a payment reference code' });
      return;
    }

  
    // Convert amountPaid and totalPrice to float, quantity to int
    const formattedData = {
      ...expenseData,
      quantity: parseInt(expenseData.quantity, 10),
      totalPrice: parseFloat(expenseData.totalPrice),
      amountPaid: parseFloat(expenseData.amountPaid),
    };
  
    try {
      const response = await axios.post('/api/diraja/newexpense', formattedData, {
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
          paymentRef:'',
          comments: ''
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

        {/* Dynamic Source Dropdown */}
        <div>
          <select name="source" value={expenseData.source} onChange={handleChange} className="select">
            <option value="">Select Source</option>
            <option value="External funding">External funding</option> {/* Hardcoded option */}
            {Array.isArray(accounts) && accounts.length > 0 ? (
              accounts.map((accounts, index) => (
                <option key={index} value={accounts.Account_name}>{accounts.Account_name}</option>
              ))
            ) : (
              <option value="">No accounts available</option>
            )}
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
        <div><input type="text" name="paymentRef" value={expenseData.paymentRef} onChange={handleChange} placeholder="Payment Ref(Transaction code)" className="input" /></div>
        <div><input type="text" name="paidTo" value={expenseData.paidTo} onChange={handleChange} placeholder="Paid To" className="input" /></div>
        <div><input type="date" name="created_at" value={expenseData.created_at} onChange={handleChange} className="input" /></div>

        <button type="submit" className="button">Add Expense</button>
      </form>
    </div>
  );
};

export default AddExpense;
