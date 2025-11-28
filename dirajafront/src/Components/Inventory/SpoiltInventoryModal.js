import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

const SpoiltInventoryModal = ({
  selectedInventory,
  inventory,
  onClose,
  onSpoiltSuccess
}) => {
  const [quantity, setQuantity] = useState('');
  const [comment, setComment] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');
  const [collectorName, setCollectorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (selectedInventory.length === 1) {
      const inventoryItem = inventory.find(
        item => item.inventoryV2_id === selectedInventory[0]
      );
      setSelectedItem(inventoryItem);
      
      // FIX: Use remaining_quantity instead of quantity
      const remainingQty = inventoryItem?.remaining_quantity || inventoryItem?.quantity || 0;
      setAvailableQuantity(remainingQty);
      
      // Auto-fill disposal method if it's broiler
      if (inventoryItem?.itemname?.toLowerCase() === 'broiler') {
        setDisposalMethod('Animal Feed');
      }
    } else {
      setSelectedItem(null);
      setAvailableQuantity(0);
    }
    
    // Reset form fields
    setQuantity('');
    setComment('');
    setCollectorName('');
  }, [selectedInventory, inventory]);

  // Prevent wheel/touchpad scrolling from changing number inputs
  const handleWheel = (e) => {
    e.target.blur();
  };

  // Improved decimal input handling
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    
    // Allow: empty, numbers, single decimal point with digits
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Prevent multiple decimal points
      if ((value.match(/\./g) || []).length <= 1) {
        setQuantity(value);
      }
    }
  };

  // Improved validation on blur
  const handleQuantityBlur = (e) => {
    let value = e.target.value.trim();
    
    if (value === '') {
      setQuantity('');
      return;
    }

    // Handle values starting with decimal point
    if (value.startsWith('.')) {
      value = '0' + value;
    }

    // Handle values ending with decimal point
    if (value.endsWith('.')) {
      value = value + '0';
    }

    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue > 0) {
      // Check if quantity exceeds available stock with decimal precision
      if (numValue > availableQuantity) {
        setMessage({ 
          type: 'error', 
          text: `Quantity exceeds available stock. Maximum: ${availableQuantity}` 
        });
        setQuantity('');
      } else {
        // Format to remove unnecessary trailing zeros, but keep decimals
        setQuantity(numValue.toString());
        setMessage({ type: '', text: '' });
      }
    } else {
      setMessage({ type: 'error', text: 'Please enter a valid positive number' });
      setQuantity('');
    }
  };

  // Allow keyboard input for decimals
  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: numbers and numpad numbers
        (e.keyCode >= 48 && e.keyCode <= 57) ||
        (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    // Prevent all other keys
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('access_token');

    const quantityNum = parseFloat(quantity);
    
    // Enhanced validation
    if (!quantity || quantityNum <= 0 || isNaN(quantityNum)) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity greater than 0.' });
      return;
    }

    // More precise decimal comparison
    if (Math.abs(quantityNum - availableQuantity) > 0.0001 && quantityNum > availableQuantity) {
      setMessage({ 
        type: 'error', 
        text: `Quantity exceeds available stock. Maximum: ${availableQuantity.toFixed(4)}` 
      });
      return;
    }

    if (!disposalMethod.trim()) {
      setMessage({ type: 'error', text: 'Please enter a disposal method.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const inventoryId = selectedInventory[0];
      
      const requestData = {
        inventory_id: inventoryId,
        quantity: quantityNum,
        comment: comment || undefined,
        disposal_method: disposalMethod.trim(),
        collector_name: collectorName || undefined
      };

      // Remove undefined fields
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined) {
          delete requestData[key];
        }
      });

      const response = await axios.post('api/diraja/spoilt/inventory', requestData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      setMessage({ 
        type: 'success', 
        text: response.data.message || 'Spoilt stock recorded successfully' 
      });

      // Call success callback and close modal after delay
      onSpoiltSuccess();
      setTimeout(() => {
        onClose();
        // Reset form
        setQuantity('');
        setComment('');
        setDisposalMethod('');
        setCollectorName('');
      }, 1500);

    } catch (error) {
      let errorMessage = 'Error recording spoilt stock. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Show available quantity if provided in error response
        if (error.response.data.available_quantity !== undefined) {
          errorMessage += `. Available quantity: ${error.response.data.available_quantity}`;
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Missing required fields in the request';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({
        type: 'error',
        text: errorMessage
      });
      console.error('Error recording spoilt stock:', error);
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

        <h3>Record Spoilt Stock</h3>

        {/* Selected Item Information */}
        {/* {selectedItem && (
          <div className="item-info-card">
            <h4>Selected Item</h4>
            <div className="item-details">
              <p><strong>Item:</strong> {selectedItem.itemname}</p>
              <p><strong>Batch Number:</strong> {selectedItem.batchnumber}</p>
              <p><strong>Available Quantity:</strong> {availableQuantity} {selectedItem.metric}</p>
            </div>
          </div>
        )} */}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="quantity-input">
              Spoilt Quantity ({selectedItem?.metric || 'units'}) *
            </label>
            <input
              id="quantity-input"
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              onWheel={handleWheel}
              onKeyDown={handleKeyDown}
              placeholder={`Enter quantity e.g., 0.23, 5.67 (max: ${availableQuantity})`}
              required
            />
            <small className="text-muted">
              Maximum available: {availableQuantity} {selectedItem?.metric}
            </small>
            <small className="text-muted" style={{display: 'block', marginTop: '2px'}}>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="disposal-method-input">Disposal Method *</label>
            <input
              id="disposal-method-input"
              type="text"
              value={disposalMethod}
              onChange={(e) => setDisposalMethod(e.target.value)}
              placeholder="Enter disposal method (e.g., Discarded, Donated, Animal Feed, etc.)"
              required
            />
            <small className="text-muted">
              Describe how the spoilt items were disposed of
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="collector-input">Collector Name</label>
            <input
              id="collector-input"
              type="text"
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              placeholder="Optional - name of person collecting spoilt items"
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment-textarea">Comments/Reason</label>
            <textarea
              id="comment-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional - reason for spoilage or additional details"
              rows="3"
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="yes-button"
              disabled={loading || !selectedItem}
            >
              {loading ? 'Recording...' : 'Record Spoilt Stock'}
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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.5rem;
          text-align: center;
        }

        .item-info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .item-info-card h4 {
          margin: 0 0 12px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .item-details p {
          margin: 4px 0;
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #333;
        }

        input, select, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .text-muted {
          color: #6c757d;
          font-size: 0.8rem;
          margin-top: 4px;
          display: block;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .yes-button {
          flex: 1;
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .yes-button:hover:not(:disabled) {
          background: #c82333;
        }

        .yes-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .cancel-button {
          flex: 1;
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .cancel-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 16px;
          }

          .button-group {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SpoiltInventoryModal;