import React, { useState } from 'react';
import axios from 'axios';

const AddSpoiltStock = () => {
  const [formData, setFormData] = useState({
    quantity: '',
    item: '',
    unit: '',
    disposal_method: '',
    collector_name: '',
    comment: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const shop_id = localStorage.getItem('shop_id');
    const accessToken = localStorage.getItem('access_token');

    const dataToSubmit = {
      ...formData,
      shop_id: shop_id,
    };

    try {
      const response = await axios.post('/api/diraja/newspoilt', dataToSubmit, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setMessage(response.data.message);
      setMessageType('success');
      setFormData({
        quantity: '',
        item: '',
        unit: '',
        disposal_method: '',
        collector_name: '',
        comment: ''
      });
    } catch (error) {
      setMessageType('error');
      setMessage('Error adding spoilt stock: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      <h1>Record Spoilt Stock</h1>
      <form onSubmit={handleSubmit} className="clerk-sale">
        <input name="item" value={formData.item} onChange={handleChange} placeholder="Item" required />
        <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
        <input name="unit" value={formData.unit} onChange={handleChange} placeholder="Unit (kg or count)" required />
        <input name="disposal_method" value={formData.disposal_method} onChange={handleChange} placeholder="Disposal Method" required />
        <input name="collector_name" value={formData.collector_name} onChange={handleChange} placeholder="Collector Name" required />
        <input name="comment" value={formData.comment} onChange={handleChange} placeholder="Comment (optional)" />
        <button className="add-sale-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Add Spoilt'}
        </button>
      </form>
    </div>
  );
};

export default AddSpoiltStock;