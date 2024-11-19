import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/expenses.css';

const AddExpense = () => {
  const [expenseData, setExpenseData] = useState({
    shop_id: '',
    category_id: '',
    item: '',
    description: '',
    quantity: '',
    totalPrice: '',
    amountPaid: '',
    created_at: ''
  });

  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchShopsAndCategories = async () => {
      try {
        const shopResponse = await axios.get('/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setShops(shopResponse.data);

        const categoryResponse = await axios.get('/diraja/expensecategory', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        console.log("Categories API response:", categoryResponse.data);

        const categoryData = Array.isArray(categoryResponse.data.categories)
          ? categoryResponse.data.categories.map((category) => ({
              category_id: category.category_id, // Ensure correct key mapping
              categoryname: category.categoryname, // Ensure correct key mapping
            }))
          : [];

        setCategories(categoryData);

        if (categoryData.length === 0) {
          console.warn("No categories available!");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Category name cannot be empty.');
      return;
    }

    try {
      const response = await axios.post(
        '/diraja/newexpensecategory',
        { categoryname: newCategory.trim() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      // Add the new category to the dropdown and reset the form
      setCategories([...categories, { category_id: response.data.category_id, categoryname: response.data.categoryname }]);
      setNewCategory('');
      setShowAddCategory(false);
      setMessage({ type: 'success', text: 'Category added successfully' });
    } catch (error) {
      console.error('Error adding category:', error.response || error.message);
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Failed to add category. Please try again.'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expenseData.shop_id || !expenseData.category_id) {
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
      const response = await axios.post('/diraja/newexpense', expenseData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.status === 201) {
        setMessage({ type: 'success', text: 'Expense added successfully' });
        setExpenseData({
          shop_id: '',
          category_id: '',
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

        {/* Category Dropdown */}
        <div>
          <select
            name="category_id"
            value={expenseData.category_id}
            onChange={handleChange}
            className={`select ${expenseData.category_id ? 'valid' : 'invalid'}`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.categoryname}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddCategory((prev) => !prev)}
            className="button"
          >
            Add New Category
          </button>
        </div>

        {/* Add Category Input */}
        {showAddCategory && (
          <div>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="input"
            />
            <button type="button" onClick={handleAddCategory} className="button">
              Save Category
            </button>
          </div>
        )}

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
