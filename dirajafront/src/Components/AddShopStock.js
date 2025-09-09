import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/expenses.css'; // Assuming you'll reuse the same styles

const AddShopStock = () => {
  const [stockData, setStockData] = useState({
    shop_id: '',
    itemname: '',
    unitPrice: '',
    metric: ''
  });

  const [shops, setShops] = useState([]);
  const [metrics, setMetrics] = useState(['kg', 'item']);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('https://kulima.co.ke/api/diraja/allshops', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        setShops(response.data);
      } catch (error) {
        console.error("Error fetching shops:", error);
        setMessage({ type: 'error', text: 'Failed to load shops' });
      }
    };

    fetchShops();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStockData({ ...stockData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!stockData.shop_id || !stockData.itemname || !stockData.unitPrice || !stockData.metric) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    // Validate unitPrice is a positive number
    if (isNaN(stockData.unitPrice)) {
      setMessage({ type: 'error', text: 'Unit price must be a number' });
      return;
    }

    try {
      const response = await axios.post('https://kulima.co.ke/api/diraja/addstock', stockData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });

      if (response.status === 201) {
        setMessage({ 
          type: 'success', 
          text: `Item "${stockData.itemname}" added to shop stock successfully` 
        });
        setStockData({
          shop_id: '',
          itemname: '',
          unitPrice: '',
          metric: ''
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add item to shop stock';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error adding shop stock:', error);
    }
  };

  return (
    <div className="container">
      <h1>Add Direct Shop Stock</h1>
      <p className="subtitle">Add items directly to shop stock </p>
      
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Shop</label>
          <select 
            name="shop_id" 
            value={stockData.shop_id} 
            onChange={handleChange} 
            className="select"
            required
          >
            <option value="">Select a shop</option>
            {shops.map(shop => (
              <option key={shop.shop_id} value={shop.shop_id}>{shop.shopname}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Item Name</label>
          <input 
            type="text" 
            name="itemname" 
            value={stockData.itemname} 
            onChange={handleChange} 
            placeholder="Enter item name" 
            className="input"
            required
          />
        </div>

        <div className="form-group">
          <label>Unit Price</label>
          <input 
            type="number" 
            name="unitPrice" 
            value={stockData.unitPrice} 
            onChange={handleChange} 
            placeholder="Enter unit price" 
            className="input"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Metric</label>
          <select 
            name="metric" 
            value={stockData.metric} 
            onChange={handleChange} 
            className="select"
            required
          >
            <option value="">Select metric</option>
            {metrics.map((metric, index) => (
              <option key={index} value={metric}>{metric}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="button">Add to Shop Stock</button>
      </form>
    </div>
  );
};

export default AddShopStock;