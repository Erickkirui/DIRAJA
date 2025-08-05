import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShopToShopTransfer = () => {
  // Get shop_id from localStorage
  const shopIdFromStorage = localStorage.getItem('shop_id');
  console.log('Shop ID from localStorage:', shopIdFromStorage);

  const [formData, setFormData] = useState({
    from_shop_id: shopIdFromStorage || '',
    to_shop_id: '',
    item_name: '',  // Changed from stockv2_id to item_name
    quantity: '',
    BatchNumber: '',
    metric: ''
  });

  const [shops, setShops] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isShopLoading, setIsShopLoading] = useState(true);
  const [isItemLoading, setIsItemLoading] = useState(false);

  // Fetch all shops
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

  // Fetch available items when from_shop_id changes
  useEffect(() => {
    const fetchItems = async () => {
      if (!formData.from_shop_id) return;

      setIsItemLoading(true);
      try {
        const response = await axios.get('/api/diraja/batches/available-by-shopv2', {
          params: { shop_id: formData.from_shop_id },
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        
        // API returns array of item names
        setAvailableItems(response.data);
        
        // Fetch additional item details if needed
        if (formData.item_name) {
          fetchItemDetails(formData.item_name);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error fetching items. Please try again.' });
      } finally {
        setIsItemLoading(false);
      }
    };

    fetchItems();
  }, [formData.from_shop_id]);

  // Fetch item details when item_name changes
  const fetchItemDetails = async (itemName) => {
    if (!itemName || !formData.from_shop_id) return;

    try {
      const response = await axios.get('/api/diraja/shop-itemdetailsv2', {
        params: {
          item_name: itemName,
          shop_id: formData.from_shop_id,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      const { metric, BatchNumber, quantity } = response.data;
      
      setFormData(prev => ({
        ...prev,
        metric: metric || '',
        BatchNumber: BatchNumber || '',
        remainingStock: quantity || 0
      }));

    } catch (error) {
      setMessage({ type: 'error', text: `Error fetching details for ${itemName}` });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Fetch details when item is selected
    if (name === 'item_name' && value) {
      fetchItemDetails(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.to_shop_id) {
      setMessage({ type: 'error', text: 'Please select destination shop' });
      return;
    }

    if (!formData.item_name) {
      setMessage({ type: 'error', text: 'Please select an item to transfer' });
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setMessage({ type: 'error', text: 'Quantity must be greater than 0' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/diraja/transfer-stock', 
        {
          from_shop_id: parseInt(formData.from_shop_id),
          to_shop_id: parseInt(formData.to_shop_id),
          item_name: formData.item_name,
          quantity: parseFloat(formData.quantity),
          BatchNumber: formData.BatchNumber
        }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

      setMessage({ 
        type: 'success', 
        text: response.data.message || 'Transfer completed successfully' 
      });
      
      // Reset form but keep shop selections
      setFormData(prev => ({
        ...prev,
        item_name: '',
        quantity: '',
        BatchNumber: '',
        metric: ''
      }));

    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Failed to complete transfer';
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-container">
      <h1>Shop to Shop Transfer</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {/* Display current shop */}
        <div className="form-group">
          <label>From Shop</label>
          <div className="shop-display">
            {formData.from_shop_id ? `Shop ID: ${formData.from_shop_id}` : 'No shop selected'}
          </div>
        </div>

        {/* Destination Shop Selection */}
        <div className="form-group">
          <label>To Shop</label>
          {isShopLoading ? (
            <p>Loading shops...</p>
          ) : (
            <select
              name="to_shop_id"
              value={formData.to_shop_id}
              onChange={handleChange}
              className="select"
              required
              disabled={!formData.from_shop_id}
            >
              <option value="">Select destination shop</option>
              {shops
                .filter(shop => shop.shops_id != formData.from_shop_id)
                .map(shop => (
                  <option key={shop.shops_id} value={shop.shops_id}>
                    {shop.shopname} (ID: {shop.shops_id})
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Item Selection */}
        {formData.from_shop_id && (
          <div className="form-group">
            <label>Item to Transfer</label>
            {isItemLoading ? (
              <p>Loading items...</p>
            ) : (
              <select
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                className="select"
                required
                disabled={availableItems.length === 0}
              >
                <option value="">Select an item</option>
                {availableItems.map((item, index) => (
                  <option key={index} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            )}
            {availableItems.length === 0 && !isItemLoading && (
              <p className="info-message">No items available for transfer</p>
            )}
          </div>
        )}

        {/* Display item details */}
        {formData.item_name && (
          <>
            <div className="form-group">
              <label>Batch Number</label>
              <input
                type="text"
                value={formData.BatchNumber}
                readOnly
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Metric</label>
              <input
                type="text"
                value={formData.metric}
                readOnly
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Available Quantity</label>
              <input
                type="number"
                value={formData.remainingStock}
                readOnly
                className="input"
              />
            </div>
          </>
        )}

        {/* Quantity Input */}
        <div className="form-group">
          <label>Quantity to Transfer</label>
          <input
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            className="input"
            required
            min="0.01"
            step="0.01"
            max={formData.remainingStock}
            disabled={!formData.item_name}
          />
        </div>

        <button 
          type="submit" 
          className="button" 
          disabled={isLoading || isShopLoading || isItemLoading || !formData.from_shop_id}
        >
          {isLoading ? 'Processing Transfer...' : 'Transfer Items'}
        </button>
      </form>
    </div>
  );
};

export default ShopToShopTransfer;