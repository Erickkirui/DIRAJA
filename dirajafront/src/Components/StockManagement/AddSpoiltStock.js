import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddSpoiltStock = () => {
  const [formData, setFormData] = useState({
    shop_id: localStorage.getItem('shop_id') || '',
    quantity: '',
    item: '',
    unit: '',
    disposal_method: '',
    collector_name: '',
    comment: ''
  });
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingStock, setRemainingStock] = useState(0);

  // Fetch available items for the shop
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('https://kulima.co.ke/api/diraja/batches/available-by-shopv2', {
          params: { shop_id: formData.shop_id },
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setItems(response.data);
      } catch (error) {
        setMessageType('error');
        setMessage('Error fetching items. Please try again.');
      }
    };
    
    if (formData.shop_id) fetchItems();
  }, [formData.shop_id]);

  // Fetch item details when item is selected
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!formData.item || !formData.shop_id) return;

      try {
        const response = await axios.get('https://kulima.co.ke/api/diraja/shop-itemdetailsv2', {
          params: {
            item_name: formData.item,
            shop_id: formData.shop_id
          },
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });

        const { metric, quantity } = response.data;
        setFormData(prev => ({ ...prev, unit: metric }));
        setRemainingStock(quantity);
      } catch (error) {
        setMessageType('error');
        setMessage('Error fetching item details. Please try again.');
      }
    };

    fetchItemDetails();
  }, [formData.item, formData.shop_id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseInt(formData.quantity) > remainingStock) {
      setMessageType('error');
      setMessage('Disposal quantity cannot exceed remaining stock');
      return;
    }
    

    setIsLoading(true);

    try {
      const response = await axios.post('https://kulima.co.ke/api/diraja/newspoilt', 
        { ...formData, shop_id: localStorage.getItem('shop_id') }, 
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });

      setMessage(response.data.message);
      setMessageType('success');
      setFormData({
        shop_id: localStorage.getItem('shop_id') || '',
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
        <select 
          name="item" 
          value={formData.item} 
          onChange={handleChange} 
          required
        >
          <option value="">Select Item</option>
          {items.map((item, index) => (
            <option key={index} value={item}>{item}</option>
          ))}
        </select>
        
        <input 
          name="quantity" 
          type="number" 
          value={formData.quantity} 
          onChange={handleChange} 
          placeholder="Quantity" 
          required 
        />
        
        <div>
          <label>Unit: </label>
          <span>{formData.unit}</span>
        </div>
        
        <div>
          <label>Remaining Stock: </label>
          <span>{remainingStock}</span>
        </div>

        <input 
          name="disposal_method" 
          value={formData.disposal_method} 
          onChange={handleChange} 
          placeholder="Disposal Method" 
          required 
        />
        
        <input 
          name="collector_name" 
          value={formData.collector_name} 
          onChange={handleChange} 
          placeholder="Collector Name" 
          required 
        />
        
        <input 
          name="comment" 
          value={formData.comment} 
          onChange={handleChange} 
          placeholder="Comment (optional)" 
        />

        <button className="add-sale-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Add Spoilt'}
        </button>
      </form>
    </div>
  );
};

export default AddSpoiltStock;