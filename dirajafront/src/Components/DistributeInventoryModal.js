import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DistributeInventoryModal = ({ 
  selectedInventory, 
  inventory, 
  onClose, 
  onDistributeSuccess 
}) => {
  const [shopId, setShopId] = useState('');
  const [quantity, setQuantity] = useState('');
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
    if (quantity <= 0 || !shopId) {
      setMessage({ type: 'error', text: 'Please select a valid shop and quantity.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await Promise.all(
        selectedInventory.map(async (inventoryId) => {
          const inventoryItem = inventory.find((item) => item.inventory_id === inventoryId);
          const requestData = {
            shop_id: parseInt(shopId),
            inventory_id: inventoryItem.inventory_id,
            quantity: parseInt(quantity),
            metric: inventoryItem.metric,
            itemname: inventoryItem.itemname,
            unitPrice: inventoryItem.unitPrice,
            unitCost: inventoryItem.unitCost,
            // Calculate amountPaid as unitCost * quantity
            amountPaid: inventoryItem.unitCost * parseInt(quantity),
            BatchNumber: inventoryItem.batchnumber,
          };
          await axios.post('/api/diraja/transfer', requestData, {

            headers: { Authorization: `Bearer ${accessToken}` },
          });
        })
      );
      setMessage({ type: 'success', text: 'Inventory distributed successfully' });
      onDistributeSuccess();
      setShopId('');
      setQuantity('');
      setTimeout(onClose, 1500); // Close modal after a short delay
    } catch (error) {
      setMessage({ type: 'error', text: 'Error distributing inventory. Please try again.' });
      console.error('Error distributing inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
              className="border p-2 w-full"
              required
            />
          </div>

          <button type="submit" className="bg-blue-500 text-white px-4 py-2" disabled={loading}>
            {loading ? 'Distributing...' : 'Distribute'}
          </button>
          <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 ml-2">
            Cancel
          </button>
        </form>
        
        {message.text && (
          <p className={`mt-4 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default DistributeInventoryModal;
