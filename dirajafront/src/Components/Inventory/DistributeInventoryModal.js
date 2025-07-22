import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

const BROILER_PARTS = [
  { name: 'Boneless Breast', unitCost: 0 },
  { name: 'Thighs', unitCost: 0 },
  { name: 'Drumstick', unitCost: 0 },
  { name: 'Big Legs', unitCost: 0 },
  { name: 'Backbone', unitCost: 0 },
  { name: 'Liver', unitCost: 0 },
  { name: 'Gizzards', unitCost: 0 },
  { name: 'Necks', unitCost: 0 },
  { name: 'Feet', unitCost: 0 },
  { name: 'Wings', unitCost: 0 },
  { name: 'Broiler', unitCost: 0 }
];

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
  const [selectedBroilerPart, setSelectedBroilerPart] = useState('');
  const [broilerPartUnitCost, setBroilerPartUnitCost] = useState(0);
  const [isBroilerParts, setIsBroilerParts] = useState(false);

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

  useEffect(() => {
    if (selectedInventory.length === 1) {
      const selectedItem = inventory.find(
        item => item.inventoryV2_id === selectedInventory[0]
      );
      setIsBroilerParts(selectedItem?.itemname?.toLowerCase() === 'broiler');
    } else {
      setIsBroilerParts(false);
    }
  }, [selectedInventory, inventory]);

  const handleDistribute = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('access_token');

    if (quantity <= 0 || !shopId || !distributionDate) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (isBroilerParts && (!selectedBroilerPart || broilerPartUnitCost <= 0)) {
      setMessage({ type: 'error', text: 'Please select a broiler part and enter a valid unit price.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await Promise.all(
        selectedInventory.map(async (inventoryV2_id) => {
          const inventoryItem = inventory.find((item) => item.inventoryV2_id === inventoryV2_id);
          if (!inventoryItem) {
            throw new Error(`Inventory item with ID ${inventoryV2_id} not found`);
          }

          const unitPrice = isBroilerParts
            ? parseFloat(broilerPartUnitCost)
            : inventoryItem.unitPrice;

          const unitCost = isBroilerParts
            ? parseFloat(broilerPartUnitCost)
            : inventoryItem.unitCost;

          const requestData = {
            shop_id: parseInt(shopId, 10),
            inventoryV2_id: inventoryItem.inventoryV2_id,
            quantity: parseFloat(quantity),
            metric: inventoryItem.metric,
            itemname: isBroilerParts ? selectedBroilerPart : inventoryItem.itemname,
            unitCost: unitCost,
            unitPrice: unitPrice,
            amountPaid: unitPrice * parseFloat(quantity),
            BatchNumber: inventoryItem.batchnumber,
            created_at: new Date(distributionDate).toISOString(),
          };

          await axios.post('/api/diraja/v2/distribute-inventory', requestData, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-User-Role': 'manager',
              'Content-Type': 'application/json'
            },
          });
        })
      );

      setMessage({ type: 'success', text: 'Inventory distributed successfully' });
      onDistributeSuccess();
      setShopId('');
      setQuantity('');
      setDistributionDate('');
      setSelectedBroilerPart('');
      setBroilerPartUnitCost(0);
      setTimeout(onClose, 1500);
    } catch (error) {
      let errorMessage = 'Error distributing inventory. Please try again.';
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = 'Missing required fields in the request';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({
        type: 'error',
        text: errorMessage
      });
      console.error('Error distributing inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {message.text && (
          <Stack sx={{ marginBottom: 2 }}>
            <Alert severity={message.type === 'success' ? 'success' : 'error'} variant="outlined">
              {message.text}
            </Alert>
          </Stack>
        )}

        <h3>Distribute Inventory</h3>
        <form onSubmit={handleDistribute}>
          <div className="form-group">
            <label htmlFor="shop-select">Shop</label>
            <select
              id="shop-select"
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

          {isBroilerParts && (
            <>
              <div className="form-group">
                <label htmlFor="broiler-part-select">Broiler Part</label>
                <select
                  id="broiler-part-select"
                  className="modal-select"
                  value={selectedBroilerPart}
                  onChange={(e) => setSelectedBroilerPart(e.target.value)}
                  required
                >
                  <option value="">Select a part</option>
                  {BROILER_PARTS.map((part) => (
                    <option key={part.name} value={part.name}>
                      {part.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="unit-cost-input">Unit Price (Ksh)</label>
                <input
                  id="unit-cost-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={broilerPartUnitCost}
                  onChange={(e) => setBroilerPartUnitCost(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="quantity-input">Quantity to Transfer</label>
            <input
              id="quantity-input"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date-input">Distribution Date</label>
            <input
              id="date-input"
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
              required
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="yes-button"
              disabled={loading}
            >
              {loading ? 'Distributing...' : 'Distribute'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributeInventoryModal;
