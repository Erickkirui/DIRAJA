import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stack, Alert } from '@mui/material';

const AddPromoSales = () => {
  const storedUserId = localStorage.getItem('users_id') || '';
  const storedShopId = localStorage.getItem('shop_id') || '';

  const [formData, setFormData] = useState({
    user_id: storedUserId,
    shop_id: storedShopId,
    shop_sale_name: '',
    customer_name: '',
    customer_number: '',
    created_at: '',
    total_price: '',
    item_name: [{ item: '', quantity: '', unit_price: '' }]
  });

  const [shops, setShops] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isTotalEdited, setIsTotalEdited] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('/api/diraja/allshops', { headers })
      .then((res) => {
        setShops(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Error fetching shops:', err);
      });

    setItemsLoading(true);
    axios.get('/api/diraja/stockitems', { headers })
      .then((res) => {
        const items = Array.isArray(res.data.stock_items) ? res.data.stock_items : [];
        setStockItems(items);
      })
      .catch((err) => {
        console.error('Error fetching stock items:', err);
      })
      .finally(() => {
        setItemsLoading(false);
      });
  }, []);

  // Calculate total price from items
  useEffect(() => {
    const total = formData.item_name.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + quantity * price;
    }, 0);
    const formatted = total.toFixed(2);
    setCalculatedTotal(formatted);

    // If user hasn't manually changed the total, sync it
    if (!isTotalEdited) {
      setFormData((prev) => ({ ...prev, total_price: formatted }));
    }
  }, [formData.item_name, isTotalEdited]);

  const handleChange = (e) => {
    if (e.target.name === 'total_price') {
      setIsTotalEdited(true);
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const updatedItems = [...formData.item_name];
    updatedItems[index][e.target.name] = e.target.value;
    setFormData({ ...formData, item_name: updatedItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      item_name: [...formData.item_name, { item: '', quantity: '', unit_price: '' }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const submissionData = { ...formData };

    try {
      const response = await axios.post('/api/diraja/salesdepartmentnew', submissionData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setMessage(response.data.message);
      setMessageType('success');
      setIsTotalEdited(false);

      setFormData({
        user_id: storedUserId,
        shop_id: storedShopId,
        shop_sale_name: '',
        customer_name: '',
        customer_number: '',
        created_at: '',
        total_price: '',
        item_name: [{ item: '', quantity: '', unit_price: '' }]
      });
    } catch (error) {
      setMessageType('error');
      setMessage('Error adding sale: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sales-form-container">
      <h1>Record Department Sale</h1>

      <form className="clerk-sale" onSubmit={handleSubmit}>
        {message && (
          <Stack sx={{ width: '100%', mb: 2 }}>
            <Alert severity={messageType === 'success' ? 'success' : 'error'} variant="outlined">
              {message}
            </Alert>
          </Stack>
        )}

        <div className="form-group">
          <select
            name="shop_sale_name"
            value={formData.shop_sale_name}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Sale Shop Name --</option>
            {shops.map((shop) => (
              <option key={shop.shop_id} value={shop.shopname}>
                {shop.shopname}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <input
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            placeholder="Customer Name"
          />
        </div>

        <div className="form-group">
          <input
            name="customer_number"
            value={formData.customer_number}
            onChange={handleChange}
            placeholder="Customer Phone"
          />
        </div>

        <div className="form-group">
          <input
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
            required
          />
        </div>

        <h3>Items</h3>
        {formData.item_name.map((item, index) => (
          <div key={index} className="item-entry">
            <div className="form-group">
              <select
                name="item"
                value={item.item}
                onChange={(e) => handleItemChange(index, e)}
                required
                disabled={itemsLoading}
              >
                <option value="">{`-- Select Item ${index + 1} --`}</option>
                {itemsLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  stockItems.map((stockItem) => (
                    <option key={stockItem.id} value={stockItem.item_name}>
                      {stockItem.item_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <input
                name="quantity"
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, e)}
                placeholder="Quantity"
                required
              />
            </div>

            <div className="form-group">
              <input
                name="unit_price"
                type="number"
                value={item.unit_price}
                onChange={(e) => handleItemChange(index, e)}
                placeholder="Unit Price"
                required
              />
            </div>
          </div>
        ))}

        <button type="button" onClick={addItem} className="complimentary-button">
          + Add Another Item
        </button>

        <div className="form-group">
          <input
            type="number"
            name="total_price"
            value={formData.total_price}
            onChange={handleChange}
            placeholder={`Total Price (Auto: ${calculatedTotal})`}
          />
        </div>

        <button type="submit" className="add-sale-button" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Sale'}
        </button>
      </form>
    </div>
  );
};

export default AddPromoSales;
