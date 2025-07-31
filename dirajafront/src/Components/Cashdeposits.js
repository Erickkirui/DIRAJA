import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/expenses.css';

const CashDeposit = () => {
  const [formData, setFormData] = useState({
    shop_id: '',
    amount: '',
    deductions: '',
    transaction_code: '',
    reason: '',
    created_at: ''
  });

  const [shops, setShops] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isShopLoading, setIsShopLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('/api/diraja/allshops', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        setShops(response.data);
        setIsShopLoading(false);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load shops' });
        setIsShopLoading(false);
        console.error("Error fetching shops:", error);
      }
    };

    fetchShops();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.shop_id) {
      setMessage({ type: 'error', text: 'Please select a shop' });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0.' });
      return;
    }

    if (formData.deductions && parseFloat(formData.deductions) < 0) {
      setMessage({ type: 'error', text: 'Deductions cannot be negative.' });
      return;
    }

    if (!formData.transaction_code) {
      setMessage({ type: 'error', text: 'Transaction code is required' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/diraja/cashdeposits/add', 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

      setMessage({ type: 'success', text: response.data.message || 'Deposit added successfully' });
      setFormData({
        shop_id: formData.shop_id, // Keep the same shop selected
        amount: '',
        deductions: '',
        transaction_code: '',
        reason: '',
        created_at: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add cash deposit' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cash-deposit-container">
      <h1>Cash Deposit</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {isShopLoading ? (
          <p>Loading shops...</p>
        ) : (
          <select
            name="shop_id"
            value={formData.shop_id}
            onChange={handleChange}
            className="select"
            required
          >
            <option value="">Select a shop</option>
            {shops.map(shop => (
              <option key={shop.shop_id} value={shop.shop_id}>
                {shop.shopname}
              </option>
            ))}
          </select>
        )}

        <input
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Amount"
          className="input"
          required
        />

        <input
          name="deductions"
          type="number"
          value={formData.deductions}
          onChange={handleChange}
          placeholder="Deductions (optional)"
          className="input"
        />

        <input
          name="transaction_code"
          value={formData.transaction_code}
          onChange={handleChange}
          placeholder="Transaction code"
          className="input"
          required
        />

        <input
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Reason (optional)"
          className="input"
        />

        <input
          name="created_at"
          type="date"
          value={formData.created_at}
          onChange={handleChange}
          className="input"
        />

        <button 
          type="submit" 
          className="button" 
          disabled={isLoading || isShopLoading}
        >
          {isLoading ? 'Processing...' : 'Add Deposit'}
        </button>
      </form>
    </div>
  );
};

export default CashDeposit;