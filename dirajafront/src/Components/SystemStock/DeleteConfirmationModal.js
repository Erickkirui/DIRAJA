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
    const value = e.target.value;
    
    // Allow empty input or decimal numbers
    if (value === '') {
      setQuantity('');
      setError('');
      return;
    }
    
    // Validate it's a valid decimal number
    if (!/^\d*\.?\d*$/.test(value)) {
      return; // Don't update if not a valid decimal
    }
    
    // Convert to number for validation
    const numericValue = parseFloat(value);
    
    if (numericValue > maxQuantity) {
      setError(`Cannot return more than ${maxQuantity}`);
    } else if (numericValue <= 0) {
      setError('Quantity must be greater than 0');
    } else {
      setError('');
    }
    
    setQuantity(value); // Store as string to allow decimal input
  };

  const handleConfirm = async () => {
    if (!quantity) {
      setError('Please enter a quantity');
      return;
    }
    
    const numericQuantity = parseFloat(quantity);
    
    if (numericQuantity > maxQuantity || numericQuantity <= 0 || isNaN(numericQuantity)) {
      setError('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(numericQuantity);
      onClose();
    } catch (error) {
      setError(error.message || 'An error occurred during the return process');
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
            type="text" // Changed to text to allow decimal input
            value={quantity}
            onChange={handleQuantityChange}
            disabled={isSubmitting}
            placeholder="Enter quantity"
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