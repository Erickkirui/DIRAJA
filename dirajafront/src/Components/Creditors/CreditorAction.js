import React, { useState } from 'react';
import axios from 'axios';

const CreditorActions = ({ creditor, onCreditorUpdated, onCreditorDeleted, shops }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [formData, setFormData] = useState({
        name: creditor.name || '',
        shop_id: creditor.shop_id || '',
        total_credit: creditor.total_credit || 0.0,
        credit_amount: creditor.credit_amount || 0.0
    });

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.put(`/api/creditors/${creditor.id}`, formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                setMessageType('success');
                setMessage('Creditor updated successfully!');
                setTimeout(() => {
                    onCreditorUpdated();
                }, 1000);
            }
        } catch (error) {
            console.error("Error updating creditor:", error);
            const errorMessage = error.response?.data?.error || "Failed to update creditor";
            setMessageType('error');
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!window.confirm('Are you sure you want to delete this creditor? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await axios.delete(`/api/creditors/${creditor.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                setMessageType('success');
                setMessage('Creditor deleted successfully!');
                setTimeout(() => {
                    onCreditorDeleted();
                }, 1000);
            }
        } catch (error) {
            console.error("Error deleting creditor:", error);
            const errorMessage = error.response?.data?.error || "Failed to delete creditor";
            setMessageType('error');
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('credit') ? parseFloat(value) || 0.0 : value
        }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        // Allow only numbers and decimal point
        const numericValue = value.replace(/[^0-9.]/g, '');
        setFormData(prev => ({
            ...prev,
            [name]: numericValue === '' ? 0.0 : parseFloat(numericValue)
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    return (
        <div>
            {message && (
                <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '4px',
                    backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                    color: messageType === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Creditor Name:
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        placeholder="Enter creditor name"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Shop:
                    </label>
                    <select
                        name="shop_id"
                        value={formData.shop_id}
                        onChange={handleInputChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Select a shop</option>
                        {shops.map(shop => (
                            <option 
                                key={shop.shops_id || shop.id || shop.shop_id} 
                                value={shop.shops_id || shop.id || shop.shop_id}
                            >
                                {shop.name || shop.shop_name || `Shop ${shop.shops_id || shop.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Total Credit Limit:
                    </label>
                    <input
                        type="text"
                        name="total_credit"
                        value={formData.total_credit}
                        onChange={handleNumberChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        placeholder="0.00"
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Current: {formatCurrency(formData.total_credit)}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Current Credit Amount:
                    </label>
                    <input
                        type="text"
                        name="credit_amount"
                        value={formData.credit_amount}
                        onChange={handleNumberChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: formData.credit_amount > 0 ? '#dc3545' : 
                                  formData.credit_amount < 0 ? '#28a745' : '#000'
                        }}
                        placeholder="0.00"
                    />
                    <div style={{ 
                        fontSize: '12px', 
                        color: formData.credit_amount > 0 ? '#dc3545' : 
                              formData.credit_amount < 0 ? '#28a745' : '#666',
                        marginTop: '5px',
                        fontWeight: 'bold'
                    }}>
                        Current: {formatCurrency(formData.credit_amount)} • 
                        Status: {formData.credit_amount > 0 ? 'Outstanding' : 
                               formData.credit_amount < 0 ? 'Credit Balance' : 'Settled'}
                    </div>
                </div>

                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    marginBottom: '20px',
                    border: '1px solid #e9ecef'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        Credit Summary:
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        <div>Available Credit: {formatCurrency(formData.total_credit - formData.credit_amount)}</div>
                        <div>Utilization: {formData.total_credit > 0 ? 
                            ((formData.credit_amount / formData.total_credit) * 100).toFixed(1) : 0}%</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                    <button
                        type="button"
                        onClick={handleDeleteConfirm}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Deleting...' : 'Delete Creditor'}
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onCreditorUpdated}
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? 'Updating...' : 'Update Creditor'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreditorActions;