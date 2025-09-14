import React, { useState } from 'react';
import axios from 'axios';

const AddCashDeposit = () => {
  const [formData, setFormData] = useState({
    shop_id: localStorage.getItem('shop_id') || '',
    amount: '',
    deductions: '',
    transaction_code: '',
    reason: '',
    created_at: ''
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessageType('error');
      setMessage('Amount must be greater than 0.');
      return;
    }

    if (formData.deductions && parseFloat(formData.deductions) < 0) {
      setMessageType('error');
      setMessage('Deductions cannot be negative.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('api/diraja/cashdeposits/add', 
        { 
          ...formData, 
          shop_id: localStorage.getItem('shop_id') 
        }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

      setMessageType('success');
      setMessage(response.data.message);
      setFormData({
        shop_id: localStorage.getItem('shop_id') || '',
        amount: '',
        deductions: '',
        transaction_code:'',
        reason: '',
        created_at: ''
      });
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      <h1>Cash Deposit</h1>
      <form onSubmit={handleSubmit} className="clerk-sale">
        <input
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Amount"
          required
        />

        <input
          name="deductions"
          type="number"
          value={formData.deductions}
          onChange={handleChange}
          placeholder="Deductions (optional)"
        />

        <input
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Reason"
          required
        />

        <input
          name="transaction_code"
          value={formData.transaction_code}
          onChange={handleChange}
          placeholder="Transaction code"
          required
        />

        <input
          name="created_at"
          type="date"
          value={formData.created_at}
          onChange={handleChange}
          placeholder="Date (optional)"
        />

        <button className="add-sale-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Add Deposit'}
        </button>
      </form>
    </div>
  );
};

export default AddCashDeposit;
