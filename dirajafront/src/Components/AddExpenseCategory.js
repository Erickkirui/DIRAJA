import React, { useState } from 'react';
import axios from 'axios';
import '../Styles/expenses.css';

const AddExpenseCategory = () => {
  const [categoryData, setCategoryData] = useState({
    category_name: '',
    type: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategoryData({ ...categoryData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate inputs
    if (!categoryData.category_name.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
      setLoading(false);
      return;
    }

    if (!categoryData.type.trim()) {
      setMessage({ type: 'error', text: 'Category type is required' });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://kulima.co.ke/api/diraja/add-expense-category', categoryData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        setMessage({ 
          type: 'success', 
          text: `Category "${response.data.expense_category.category_name}" created successfully!`
        });
        setCategoryData({
          category_name: '',
          type: ''
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create category';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error creating category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Add Expense Category</h1>
      <p className="subtitle">Create new expense categories</p>
      
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Category Name</label>
          <input
            type="text"
            name="category_name"
            value={categoryData.category_name}
            onChange={handleChange}
            placeholder="e.g., Office Supplies"
            className="input"
            required
          />
        </div>

        <div className="form-group">
          <label>Category Type</label>
          <input
            type="text"
            name="type"
            value={categoryData.type}
            onChange={handleChange}
            placeholder="e.g., Expense or Cost of Sales"
            className="input"
            required
          />
          <p className="input-hint">Common types: Expense, Cost of Sales, Asset, Liability</p>
        </div>

        <button 
          type="submit" 
          className="button"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Category'}
        </button>
      </form>
    </div>
  );
};

export default AddExpenseCategory;