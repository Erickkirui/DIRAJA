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
  { name: 'Gizzard', unitCost: 0 },
  { name: 'Neck', unitCost: 0 },
  { name: 'Feet', unitCost: 0 },
  { name: 'Wings', unitCost: 0 },
  { name: 'Chicken Minced', unitCost: 0 },
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
  const [stockItems, setStockItems] = useState([]);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [unitType, setUnitType] = useState('pack');
  const [distributionMode, setDistributionMode] = useState('distribute'); // 'distribute' or 'process'
  const [processedItems, setProcessedItems] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('api/diraja/activeshops', {
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

    const fetchStockItems = async () => {
      try {
        const response = await axios.get('api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'X-User-Role': 'manager',
          },
        });
        if (Array.isArray(response.data.stock_items)) {
          setStockItems(response.data.stock_items);
        } else {
          console.error('Stock items response is not an array');
        }
      } catch (error) {
        console.error('Error fetching stock items:', error);
      }
    };

    fetchShops();
    fetchStockItems();
  }, []);

  useEffect(() => {
    if (selectedInventory.length === 1) {
      const selectedItem = inventory.find(
        item => item.inventoryV2_id === selectedInventory[0]
      );
      const isBroiler = selectedItem?.itemname?.toLowerCase() === 'broiler';
      setIsBroilerParts(isBroiler);
      
      // Reset mode when selection changes
      if (isBroiler) {
        setDistributionMode('distribute');
      }
      
      // Find the corresponding stock item
      if (selectedItem?.itemname) {
        const stockItem = stockItems.find(si => si.item_name === selectedItem.itemname);
        setSelectedStockItem(stockItem || null);
      }
    } else {
      setIsBroilerParts(false);
      setDistributionMode('distribute');
    }
    
    // Reset unit type to pack when selection changes
    setUnitType('pack');
    setProcessedItems([]);
  }, [selectedInventory, inventory, stockItems]);

  // Initialize processed items when mode changes to process
  useEffect(() => {
    if (distributionMode === 'process' && isBroilerParts) {
      // Initialize with some common broiler parts
      const initialProcessedItems = [
        { itemname: 'Boneless Breast', quantity: '', metric: 'kg' }
        
      ];
      setProcessedItems(initialProcessedItems);
    } else {
      setProcessedItems([]);
    }
  }, [distributionMode, isBroilerParts]);

  // Prevent wheel/touchpad scrolling from changing number inputs
  const handleWheel = (e) => {
    e.target.blur();
  };

  // Validate and format quantity input
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  // Validate quantity on blur
  const handleQuantityBlur = (e) => {
    let value = e.target.value;
    
    // Remove leading zeros and ensure proper decimal format
    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        setQuantity(numValue.toString());
      } else {
        setQuantity('');
      }
    }
  };

  // Determine placeholder text for quantity input
  const getQuantityPlaceholder = () => {
    if (selectedInventory.length === 1) {
      const selectedItem = inventory.find(
        item => item.inventoryV2_id === selectedInventory[0]
      );
      if (selectedItem?.itemname?.toLowerCase() === 'broiler') {
        return 'Quantity in kgs';
      }
    }
    return 'Quantity in packs/kg';
  };

  // Handle processed item changes
  const handleProcessedItemChange = (index, field, value) => {
    const updatedItems = [...processedItems];
    
    // Validate numeric fields
    if (field === 'quantity') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        updatedItems[index][field] = value;
      }
    } else {
      updatedItems[index][field] = value;
    }
    
    setProcessedItems(updatedItems);
  };

  // Add new processed item
  const addProcessedItem = () => {
    setProcessedItems([
      ...processedItems,
      { itemname: '', quantity: '', metric: 'kg' }
    ]);
  };

  // Remove processed item
  const removeProcessedItem = (index) => {
    const updatedItems = processedItems.filter((_, i) => i !== index);
    setProcessedItems(updatedItems);
  };

  // Calculate total processed quantity
  const getTotalProcessedQuantity = () => {
    return processedItems.reduce((total, item) => {
      const qty = parseFloat(item.quantity) || 0;
      return total + qty;
    }, 0);
  };

  const handleDistribute = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('access_token');

    if (distributionMode === 'process') {
      // Process broiler logic
      const totalProcessedQty = getTotalProcessedQuantity();
      if (totalProcessedQty <= 0) {
        setMessage({ type: 'error', text: 'Please enter valid quantities for processed items.' });
        return;
      }

      // Validate all processed items
      for (const item of processedItems) {
        if (!item.itemname || !item.quantity) {
          setMessage({ type: 'error', text: 'Please fill in all fields for processed items.' });
          return;
        }
      }

      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const sourceInventoryId = selectedInventory[0];
        const response = await axios.post('api/diraja/create-parts', {
          source_inventory_id: sourceInventoryId,
          processed_items: processedItems.map(item => ({
            itemname: item.itemname,
            quantity: parseFloat(item.quantity),
            metric: item.metric,
            unitPrice: 0 // Unit price will be calculated by backend based on cost allocation
          })),
          note: `Processed broiler into parts`
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager',
            'Content-Type': 'application/json'
          },
        });

        setMessage({ type: 'success', text: 'Broiler processed successfully into inventory parts' });
        onDistributeSuccess();
        setTimeout(onClose, 1500);
      } catch (error) {
        let errorMessage = 'Error processing broiler. Please try again.';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        setMessage({ type: 'error', text: errorMessage });
        console.error('Error processing broiler:', error);
      } finally {
        setLoading(false);
      }

    } else {
      // Original distribution logic
      const quantityNum = parseFloat(quantity);
      if (quantityNum <= 0 || !shopId || !distributionDate) {
        setMessage({ type: 'error', text: 'Please fill in all required fields with valid values.' });
        return;
      }

      if (isNaN(quantityNum)) {
        setMessage({ type: 'error', text: 'Please enter a valid quantity.' });
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

            // Convert quantity from packs to pieces if needed
            let finalQuantity = quantityNum;
            if (selectedStockItem?.pack_quantity && !isBroilerParts) {
              finalQuantity = finalQuantity * parseFloat(selectedStockItem.pack_quantity);
            }

            const requestData = {
              shop_id: parseInt(shopId, 10),
              inventoryV2_id: inventoryItem.inventoryV2_id,
              quantity: finalQuantity,
              received_quantity: 0, // Add received_quantity initialized as 0
              difference: 0, // Add difference initialized as 0
              metric: inventoryItem.metric,
              itemname: inventoryItem.itemname, // Always use original item name when distributing
              unitCost: inventoryItem.unitCost,
              unitPrice: inventoryItem.unitPrice,
              amountPaid: inventoryItem.unitPrice * finalQuantity,
              BatchNumber: inventoryItem.batchnumber,
              created_at: new Date(distributionDate).toISOString(),
            };

            await axios.post('api/diraja/v2/distribute-inventory', requestData, {
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
        setUnitType('pack');
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

        <h3>
          {distributionMode === 'process' ? 'Process Broiler into Parts' : 'Distribute Inventory'}
        </h3>

        {/* Mode selector for broiler */}
        {isBroilerParts && (
          <div className="form-group">
            <label>Action Type</label>
            <div className="mode-selector">
              <button
                type="button"
                className={`mode-button ${distributionMode === 'distribute' ? 'active' : ''}`}
                onClick={() => setDistributionMode('distribute')}
              >
                Distribute as Broiler
              </button>
              <button
                type="button"
                className={`mode-button ${distributionMode === 'process' ? 'active' : ''}`}
                onClick={() => setDistributionMode('process')}
              >
                Process into Parts
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleDistribute}>
          {/* Distribution Mode Fields */}
          {distributionMode === 'distribute' && (
            <>
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

              {/* Show pack information if item has pack quantity */}
              {selectedStockItem && selectedStockItem.pack_quantity && !isBroilerParts && (
                <div className="form-group">
                  <div className="pack-info">
                    <small className="text-muted">
                      <strong>Pack Information:</strong> 1 pack = {selectedStockItem.pack_quantity} pieces
                    </small>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="quantity-input">
                  Quantity to Transfer: {getQuantityPlaceholder()}
                </label>
                <input
                  id="quantity-input"
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  onWheel={handleWheel}
                  placeholder={getQuantityPlaceholder()}
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
            </>
          )}

          {/* Process Mode Fields */}
          {distributionMode === 'process' && (
            <>
              <div className="form-group">
                <label>Processed Parts</label>
                <div className="processed-items-list">
                  {processedItems.map((item, index) => (
                    <div key={index} className="processed-item-row">
                      <select
                        value={item.itemname}
                        onChange={(e) => handleProcessedItemChange(index, 'itemname', e.target.value)}
                        className="modal-select"
                        required
                      >
                        <option value="">Select Part</option>
                        {BROILER_PARTS.filter(part => part.name !== 'Broiler').map(part => (
                          <option key={part.name} value={part.name}>{part.name}</option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Qty (kg)"
                        value={item.quantity}
                        onChange={(e) => handleProcessedItemChange(index, 'quantity', e.target.value)}
                        onWheel={handleWheel}
                        className="quantity-input"
                        required
                      />
                      
                      
                      
                      <button
                        type="button"
                        onClick={() => removeProcessedItem(index)}
                        className="remove-item-btn"
                        disabled={processedItems.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={addProcessedItem}
                  className="add-item-btn"
                >
                  + Add Another Part
                </button>
                
                {processedItems.length > 0 && (
                  <div className="total-processed">
                    <small>
                      Total Quantity: <strong>{getTotalProcessedQuantity().toFixed(2)} kg</strong>
                    </small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="process-date-input">Processing Date</label>
                <input
                  id="process-date-input"
                  type="date"
                  value={distributionDate}
                  onChange={(e) => setDistributionDate(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="yes-button"
              disabled={loading}
            >
              {loading 
                ? (distributionMode === 'process' ? 'Processing...' : 'Distributing...')
                : (distributionMode === 'process' ? 'Process Broiler' : 'Distribute')
              }
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

      <style jsx>{`
        .mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .mode-button {
          flex: 1;
          padding: 10px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .mode-button.active {
          border-color: #007bff;
          background: #007bff;
          color: white;
        }
        
        .processed-items-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 10px;
          margin-bottom: 10px;
        }
        
        .processed-item-row {
          display: grid;
          grid-template-columns: 2fr 1fr auto auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
          padding: 5px;
        }
        
        .quantity-input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .metric-display {
          padding: 8px;
          color: #666;
          font-weight: bold;
        }
        
        .remove-item-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .remove-item-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .add-item-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 10px;
        }
        
        .total-processed {
          text-align: right;
          padding: 5px;
          background: #f8f9fa;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default DistributeInventoryModal;