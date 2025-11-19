import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ExpenseDetails({ expenseId, onClose, onUpdateSuccess }) {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch expense details when component mounts or expenseId changes
  useEffect(() => {
    if (expenseId) {
      fetchExpenseDetails();
    }
  }, [expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      
      const response = await axios.get(`api/diraja/expense/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setExpense(response.data);
      setFormData(response.data); // Initialize form data with current values
    } catch (err) {
      console.error('Error fetching expense details:', err);
      setError('Failed to fetch expense details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`/api/diraja/expense/${expenseId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setIsEditing(false);
      onUpdateSuccess(); // Refresh the parent component
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense.');
    }
  };

  const handleCancel = () => {
    setFormData(expense); // Reset form data to original values
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`/api/diraja/expenses/${expenseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        onUpdateSuccess(); // Refresh the parent component
        onClose(); // Close the details panel
      } catch (err) {
        console.error('Error deleting expense:', err);
        setError('Failed to delete expense.');
      }
    }
  };

  if (loading) {
    return (
      <div className="expense-details-overlay">
        <div className="expense-details-panel">
          <div className="loading-message">Loading expense details...</div>
        </div>
      </div>
    );
  }

  if (error && !expense) {
    return (
      <div className="expense-details-overlay">
        <div className="expense-details-panel">
          <div className="error-message">{error}</div>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-details-overlay">
      <div className="expense-details-panel">
        {/* Header */}
        <div className="expense-details-header">
          <h2>Expense Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Action Buttons */}
        <div className="expense-details-actions">
          {!isEditing ? (
            <>
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button 
                className="delete-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button 
                className="save-btn"
                onClick={handleSave}
              >
                Save
              </button>
              <button 
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Expense Details Form */}
        <div className="expense-details-content">
          <div className="details-grid">
            <div className="detail-item">
              <label>Item:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="item"
                  value={formData.item || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{expense.item}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Description:</label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows="3"
                />
              ) : (
                <span>{expense.description}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Category:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{expense.category}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Quantity:</label>
              {isEditing ? (
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{expense.quantity}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Amount Paid (Ksh):</label>
              {isEditing ? (
                <input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
              ) : (
                <span>{expense.amountPaid?.toLocaleString()}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Total Price (Ksh):</label>
              {isEditing ? (
                <input
                  type="number"
                  name="totalPrice"
                  value={formData.totalPrice || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
              ) : (
                <span>{expense.totalPrice?.toLocaleString()}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Paid To:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="paidTo"
                  value={formData.paidTo || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{expense.paidTo}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Source:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="source"
                  value={formData.source || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{expense.source}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Payment Ref:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="paymentRef"
                  value={formData.paymentRef || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <span>{expense.paymentRef}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Comments:</label>
              {isEditing ? (
                <textarea
                  name="comments"
                  value={formData.comments || ''}
                  onChange={handleInputChange}
                  rows="3"
                />
              ) : (
                <span>{expense.comments}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Date Created:</label>
              <span>{new Date(expense.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseDetails;