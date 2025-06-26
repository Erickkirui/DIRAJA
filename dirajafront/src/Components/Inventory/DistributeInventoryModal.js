import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

const DistributeInventoryModal = ({ 
  selectedInventory, 
  inventory, 
  onClose, 
  onDistributeSuccess 
}) => {
  const [shopId, setShopId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [distributionDate, setDistributionDate] = useState('');
  const [shops, setShops] = useState([]);
  const [shopError, setShopError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('/api/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setShops(response.data);
        if (response.data.length === 0) {
          setShopError(true);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setShopError(true);
      }
    };

    fetchShops();
  }, []);

 const handleDistribute = async (e) => {
  e.preventDefault();
  const accessToken = localStorage.getItem('access_token');
  if (quantity <= 0 || !shopId || !distributionDate) {
    setMessage({ type: 'error', text: 'Please fill in all required fields.' });
    return;
  }

  setLoading(true);
  setMessage({ type: '', text: '' });

  try {
    await Promise.all(
      selectedInventory.map(async (inventoryId) => {
        const inventoryItem = inventory.find((item) => item.inventory_id === inventoryId);
        const requestData = {
          shop_id: parseInt(shopId, 10),
          inventory_id: inventoryItem.inventory_id,
          quantity: parseFloat(quantity),
          metric: inventoryItem.metric,
          itemname: inventoryItem.itemname,
          unitPrice: inventoryItem.unitPrice,
          unitCost: inventoryItem.unitCost,
          amountPaid: inventoryItem.unitCost * parseFloat(quantity),
          BatchNumber: inventoryItem.batchnumber,
          created_at: new Date(distributionDate).toISOString(),
        };
        await axios.post('/api/diraja/transfer', requestData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager', // 👈 Added role here
          },
        });
      })
    );
    setMessage({ type: 'success', text: 'Inventory distributed successfully' });
    onDistributeSuccess();
    setShopId('');
    setQuantity('');
    setDistributionDate('');
    setTimeout(onClose, 1500);
  } catch (error) {
    if (error.response && error.response.data) {
      setMessage({
        type: 'error',
        text: error.response.data.message || 'Error distributing inventory. Please try again.',
      });
    } else {
      setMessage({ type: 'error', text: 'Error distributing inventory. Please try again.' });
    }
    console.error('Error distributing inventory:', error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {message.text && (
          <Stack>
            <Alert severity={message.type === 'success' ? 'success' : 'error'} variant="outlined">
              {message.text}
            </Alert>
          </Stack>
        )}

        <h3>Distribute Inventory</h3>
        <form onSubmit={handleDistribute}>
          <div>
            <label>Shop</label>
            <select
              className="modal-select"
              name="shop_id"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              required
            >
              <option value="">Select a shop</option>
              {shops.length > 0 ? (
                shops.map((shop) => (
                  <option key={shop.shop_id} value={shop.shop_id}>
                    {shop.shopname}
                  </option>
                ))
              ) : (
                <option disabled>No shops available</option>
              )}
            </select>
            {shopError && <p className="text-red-500 mt-1">No shops available</p>}
          </div>

          <div>
            <label>Quantity to Transfer</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Distribution Date</label>
            <input
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
              required
            />
          </div>

          <button type="submit"  className= "yes-button"disabled={loading}>
            {loading ? 'Distributing...' : 'Distribute'}
          </button>
          <button type="button" className='cancel-button' onClick={onClose} >
            Cancel
          </button>
        
        </form>
      </div>
    </div>
  );
};

export default DistributeInventoryModal;
