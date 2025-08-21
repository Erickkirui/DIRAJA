import React, { useState } from 'react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  maxQuantity,
  itemName,
  isBulkAction = false
}) => {
  const [quantity, setQuantity] = useState(maxQuantity || 1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (e) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setQuantity('');
      return;
    }
    
    if (value > maxQuantity) {
      setError(`Cannot return more than ${maxQuantity}`);
    } else if (value <= 0) {
      setError('Quantity must be greater than 0');
    } else {
      setError('');
    }
    
    setQuantity(value);
  };

  const handleConfirm = async () => {
    if (quantity > maxQuantity || quantity <= 0 || !quantity) {
      setError('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(quantity);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Return</h2>
        <p>
          {isBulkAction 
            ? `How many items from each selected item would you like to return?`
            : `How many ${itemName || 'items'} would you like to return?`
          }
        </p>
        
        <div className="quantity-input-container">
          <label htmlFor="return-quantity">Quantity per item:</label>
          <input
            id="return-quantity"
            type="number"
            min="0.01"
            step="0.01"
            max={maxQuantity}
            value={quantity}
            onChange={handleQuantityChange}
            disabled={isSubmitting}
          />
          <span className="max-quantity-hint">(Max: {maxQuantity})</span>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="modal-actions">
          <button 
            className="cancel-button" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            disabled={!!error || !quantity || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;