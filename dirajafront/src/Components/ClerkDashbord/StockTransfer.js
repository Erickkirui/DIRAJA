import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShopToShopTransfer = () => {
  const shopIdFromStorage = localStorage.getItem('shop_id');

  const [formData, setFormData] = useState({
    from_shop_id: shopIdFromStorage || '',
    to_shop_id: '',
    item_name: '',
    pack_quantity: '',
    piece_quantity: '',
    BatchNumber: '',
    metric: '',
    remainingStock: 0,
    action: 'transfer'  // <-- NEW field
  });

  const [shops, setShops] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isShopLoading, setIsShopLoading] = useState(true);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [displayQuantity, setDisplayQuantity] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('api/diraja/activeshops', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        setShops(response.data);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load shops' });
      } finally {
        setIsShopLoading(false);
      }
    };

    const fetchStockItems = async () => {
      try {
        const response = await axios.get('api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (Array.isArray(response.data.stock_items)) {
          setStockItems(response.data.stock_items);
        }
      } catch (error) {
        console.error('Error fetching stock items:', error);
      }
    };

    fetchShops();
    fetchStockItems();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!formData.from_shop_id) return;

      setIsItemLoading(true);
      try {
        const response = await axios.get('api/diraja/batches/available-by-shopv2', {
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

  useEffect(() => {
    if (formData.item_name) {
      const item = stockItems.find(stockItem => stockItem.item_name === formData.item_name);
      setSelectedStockItem(item || null);
    }
  }, [formData.item_name, stockItems]);

  useEffect(() => {
    if (formData.remainingStock > 0 && selectedStockItem) {
      const remaining = formData.remainingStock;

      if (selectedStockItem.item_name.toLowerCase().includes("eggs")) {
        const packQty = selectedStockItem.pack_quantity > 0 
          ? selectedStockItem.pack_quantity 
          : 30;
        const trays = Math.floor(remaining / packQty);
        const pieces = remaining % packQty;

        setDisplayQuantity(
          trays > 0
            ? `${trays} tray${trays !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`
        );
      } else if (selectedStockItem.pack_quantity > 0) {
        const packets = Math.floor(remaining / selectedStockItem.pack_quantity);
        const pieces = remaining % selectedStockItem.pack_quantity;

        setDisplayQuantity(
          packets > 0
            ? `${packets} pkt${packets !== 1 ? "s" : ""}${pieces > 0 ? `, ${pieces} pcs` : ""}`
            : `${pieces} pcs`
        );
      } else {
        setDisplayQuantity(`${remaining} ${formData.metric || "pcs"}`);
      }
    } else {
      setDisplayQuantity(`${formData.remainingStock} ${formData.metric || "pcs"}`);
    }
  }, [formData.remainingStock, formData.metric, selectedStockItem]);

  const fetchItemDetails = async (itemName) => {
    if (!itemName || !formData.from_shop_id) return;

    try {
      const response = await axios.get('api/diraja/shop-itemdetailsv2', {
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

    if ((name === 'pack_quantity' || name === 'piece_quantity') && value !== '') {
      if (!/^\d*\.?\d*$/.test(value)) {
        return;
      }
    }

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

    if (!formData.item_name) {
      setMessage({ type: 'error', text: 'Please select an item' });
      return;
    }

    let finalQuantity;
    if (selectedStockItem && selectedStockItem.pack_quantity > 0) {
      let packs = parseFloat(formData.pack_quantity || 0);
      let pieces = parseFloat(formData.piece_quantity || 0);
      finalQuantity = (packs * selectedStockItem.pack_quantity) + pieces;
    } else {
      finalQuantity = parseFloat(formData.piece_quantity || 0);
    }

    if (finalQuantity <= 0) {
      setMessage({ type: 'error', text: 'Quantity must be greater than 0' });
      return;
    }

    if (finalQuantity > parseFloat(formData.remainingStock)) {
      setMessage({ type: 'error', text: 'Quantity exceeds available stock' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (formData.action === 'transfer') {
        // Normal shop-to-shop transfer
        if (!formData.to_shop_id) {
          setMessage({ type: 'error', text: 'Please select destination shop' });
          setIsLoading(false);
          return;
        }

        const payload = {
          from_shop_id: parseInt(formData.from_shop_id),
          to_shop_id: parseInt(formData.to_shop_id),
          item_name: formData.item_name,
          quantity: finalQuantity,
          BatchNumber: formData.BatchNumber
        };

        const response = await axios.post('api/diraja/transfer-stock', payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        setMessage({ type: 'success', text: response.data.message || 'Transfer completed successfully' });

      } else if (formData.action === 'return') {
        // Return to main inventory
        const response = await axios.delete(`/api/diraja/shops/${formData.from_shop_id}/stock/delete`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          data: {
            itemname: formData.item_name,
            quantity_to_delete: finalQuantity
          }
        });

        setMessage({ type: 'success', text: response.data.message || 'Return to store completed successfully' });
      }

      setFormData(prev => ({
        ...prev,
        to_shop_id: '',
        item_name: '',
        pack_quantity: '',
        piece_quantity: '',
        BatchNumber: '',
        metric: '',
        remainingStock: 0
      }));

    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Operation failed';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getUnitLabel = () => {
    if (!selectedStockItem) return 'pack';
    if (selectedStockItem.item_name.toLowerCase().includes("eggs")) {
      return 'tray';
    }
    return 'pack';
  };

  return (
    <div className="transfer-container">
      <h1>Stock Transfer</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {/* NEW - Action Selector */}
        <div className="form-group">
          <label>Action</label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            className="select"
          >
            <option value="transfer">Transfer to Shop</option>
            <option value="return">Return to Store</option>
          </select>
        </div>

        {/* Show destination shop only if transfer */}
        {formData.action === 'transfer' && (
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
                required={formData.action === 'transfer'}
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
        )}

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
            <label>Quantity to Transfer</label>
            
            {/* Show pack quantity input only for items with pack quantity */}
            {selectedStockItem && selectedStockItem.pack_quantity > 0 ? (
              <>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    name="pack_quantity"
                    type="text"  // Changed to text to allow decimal input
                    value={formData.pack_quantity}
                    onChange={handleChange}
                    placeholder={`No. of ${getUnitLabel()}s`}
                    className="input"
                  />
                  <input
                    name="piece_quantity"
                    type="text"  // Changed to text to allow decimal input
                    value={formData.piece_quantity}
                    onChange={handleChange}
                    placeholder="No. of pieces"
                    className="input"
                  />
                </div>
                <small className="text-muted">
                  1 {getUnitLabel()} = {selectedStockItem.pack_quantity} pieces
                </small>
              </>
            ) : (
              // Show only piece quantity input for items without pack quantity
              <input
                name="piece_quantity"
                type="text"  // Changed to text to allow decimal input
                value={formData.piece_quantity}
                onChange={handleChange}
                placeholder="Quantity"
                className="input"
              />
            )}
          </div>
        )}

        {formData.item_name && (
          <div className="form-group">
            <label>Item Details</label>
            <ul>
              <li><strong>Available Quantity:</strong> {displayQuantity}</li>
              {/* {selectedStockItem && (
                <li><strong>Metric:</strong> {formData.metric || "pcs"}</li>
              )}
              {formData.BatchNumber && (
                <li><strong>Batch Number:</strong> {formData.BatchNumber}</li>
              )} */}
            </ul>
          </div>
        )}

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