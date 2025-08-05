import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShopToShopTransfer = () => {
  const shopIdFromStorage = localStorage.getItem('shop_id');

  const [formData, setFormData] = useState({
    from_shop_id: shopIdFromStorage || '',
    to_shop_id: '',
    item_name: '',
    quantity: '',
    BatchNumber: '',
    metric: '',
    remainingStock: 0
  });

  const [shops, setShops] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isShopLoading, setIsShopLoading] = useState(true);
  const [isItemLoading, setIsItemLoading] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('/api/diraja/allshops', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        setShops(response.data);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load shops' });
      } finally {
        setIsShopLoading(false);
      }
    };

    fetchShops();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!formData.from_shop_id) return;

      setIsItemLoading(true);
      try {
        const response = await axios.get('/api/diraja/batches/available-by-shopv2', {
          params: { shop_id: formData.from_shop_id },
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });

        setAvailableItems(response.data);

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

    if (name === 'item_name' && value) {
      fetchItemDetails(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (parseFloat(formData.quantity) > parseFloat(formData.remainingStock)) {
      setMessage({ type: 'error', text: 'Quantity exceeds available stock' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        from_shop_id: parseInt(formData.from_shop_id),
        to_shop_id: parseInt(formData.to_shop_id),
        item_name: formData.item_name,
        quantity: parseFloat(formData.quantity),
        BatchNumber: formData.BatchNumber
      };

      const response = await axios.post('/api/diraja/transfer-stock', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setMessage({
        type: 'success',
        text: response.data.message || 'Transfer completed successfully'
      });

      setFormData(prev => ({
        ...prev,
        item_name: '',
        quantity: '',
        BatchNumber: '',
        metric: '',
        remainingStock: 0
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
                .filter(shop => shop.shops_id !== parseInt(formData.from_shop_id))
                .map(shop => (
                  <option key={shop.shop_id} value={shop.shop_id}>
                    {shop.shopname}
                  </option>
                ))}
            </select>
          )}
        </div>

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

        {formData.item_name && (
          <div className="form-group">
            <label>Item Details</label>
            <ul>
              <li><strong>Batch Number:</strong> {formData.BatchNumber || 'N/A'}</li>
              <li><strong>Metric:</strong> {formData.metric || 'N/A'}</li>
              <li><strong>Available Quantity:</strong> {formData.remainingStock}</li>
            </ul>
          </div>
        )}

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
          disabled={
            isLoading || isShopLoading || isItemLoading || !formData.from_shop_id
          }
        >
          {isLoading ? 'Processing Transfer...' : 'Transfer Items'}
        </button>
      </form>
    </div>
  );
};

export default ShopToShopTransfer;
