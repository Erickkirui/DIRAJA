import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ItemQuantitySelector = ({ 
  selectedItemId, 
  onQuantityChange, 
  onUnitTypeChange,
  initialQuantity = '',
  initialUnitType = 'pieces'
}) => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [unitType, setUnitType] = useState(initialUnitType);
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    const fetchStockItems = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('User is not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 200) {
          setStockItems(response.data.stock_items || []);
        }
      } catch (error) {
        setError('An error occurred while fetching stock items');
      } finally {
        setLoading(false);
      }
    };

    fetchStockItems();
  }, []);

  useEffect(() => {
    if (selectedItemId && stockItems.length > 0) {
      const item = stockItems.find(item => item.id === selectedItemId);
      setSelectedItem(item);
    }
  }, [selectedItemId, stockItems]);

  const isEggItem = () => {
    if (!selectedItem) return false;
    return selectedItem.item_name.includes('Egg');
  };

  const handleUnitTypeChange = (e) => {
    const newUnitType = e.target.value;
    setUnitType(newUnitType);
    onUnitTypeChange(newUnitType);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    // Allow empty value or valid numbers
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setQuantity(value);
      
      // Only call onQuantityChange if we have a valid number
      if (value !== '') {
        onQuantityChange(parseFloat(value));
      }
    }
  };

  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="item-quantity-selector">
      {selectedItem && selectedItem.pack_quantity ? (
        <>
          <div className="form-group">
            <label htmlFor="unitType">Selling Unit:</label>
            <select 
              id="unitType" 
              value={unitType}
              onChange={handleUnitTypeChange}
              className="form-control"
            >
              <option value="pieces">Pieces</option>
              <option value="pack">
                {isEggItem() ? 'Trays' : 'Pack'}
              </option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="quantity">
              {unitType === 'pack' ? 
                (isEggItem() ? 'Number of Trays' : 'Number of Packs') : 
                'Quantity'}:
            </label>
            <input
              type="text"
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              className="form-control"
              placeholder="Enter quantity"
            />
            {unitType === 'pack' && (
              <small className="text-muted">
                {isEggItem() ? 
                  `Each tray contains ${selectedItem.pack_quantity} eggs` : 
                  `Each pack contains ${selectedItem.pack_quantity} pieces`}
              </small>
            )}
          </div>
        </>
      ) : (
        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="text"
            id="quantity"
            value={quantity}
            onChange={handleQuantityChange}
            className="form-control"
            placeholder="Enter quantity"
          />
        </div>
      )}
    </div>
  );
};

export default ItemQuantitySelector;