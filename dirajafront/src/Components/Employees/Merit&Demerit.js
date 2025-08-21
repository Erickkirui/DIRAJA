import React, { useState } from 'react';
import axios from 'axios';

const AddMeritPoints = () => {
  const [formData, setFormData] = useState({
    reason: '',
    point: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedReason = formData.reason.trim();
    const numericPoint = parseFloat(formData.point);

    if (isNaN(numericPoint)) {
      setMessageType('error');
      setMessage('Point must be a valid number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://kulima.co.ke/api/diraja/newmeritpoint',
        {
          reason: trimmedReason,
          point: numericPoint
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      setMessageType('success');
      setMessage(response.data.message || 'Merit point added successfully');
      setFormData({
        reason: '',
        point: ''
      });
    } catch (error) {
      setMessageType('error');
      setMessage('Error adding merit point: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      <h1>Add New Merit/Demerit Point</h1>
      <form onSubmit={handleSubmit} className="clerk-sale">
        <input 
          name="reason" 
          value={formData.reason} 
          onChange={handleChange} 
          placeholder="Reason" 
          required 
        />
        
        <input 
          name="point" 
          type="number" 
          value={formData.point} 
          onChange={handleChange} 
          placeholder="Points (positive or negative)" 
          required 
        />
        
        <div className="point-description">
          <p>Enter positive values for merits, negative for demerits</p>
        </div>

        <button className="add-sale-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Add Merit Point'}
        </button>
      </form>
    </div>
  );
};

export default AddMeritPoints;
