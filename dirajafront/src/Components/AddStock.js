import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManualTransfer = () => {
    const [formData, setFormData] = useState({
        itemname: '',
        quantity: '',
        metric: '',
        unitCost: '',
        unitPrice: '',
        amountPaid: '',
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    const validMetrics = ['kg', 'liter', 'item', 'tray', 'egg']; // Add more if needed

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [name]: value };

            // Convert trays to eggs automatically
            if (name === 'metric' && value === 'tray') {
                updatedData.quantity = parseFloat(updatedData.quantity) * 30 || 0; // 1 tray = 30 eggs
                updatedData.metric = 'egg'; // Store as eggs
            }

            return updatedData;
        });
        setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = ['itemname', 'quantity', 'metric', 'unitCost', 'unitPrice', 'amountPaid'];
        const newErrors = {};
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = `Please fill out the ${field.replace('_', ' ')} field.`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        try {
            const response = await axios.post('/api/diraja/manualtransfer', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 201) {
                setMessage({ text: 'Stock added successfully!', type: 'success' });
                setFormData({
                    itemname: '',
                    quantity: '',
                    metric: '',
                    unitCost: '',
                    unitPrice: '',
                    amountPaid: '',
                });
                setFieldErrors({});
            } else {
                setMessage({ text: 'Failed to add stock', type: 'error' });
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
        }
    };

    return (
        <div>
            <h1>Mabanda Stock</h1>
            {Object.keys(fieldErrors).length > 0 && (
                <div className="alert alert-error">
                    {Object.values(fieldErrors).map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </div>
            )}
            {message.text && (
                <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="form">
                <input
                    name="itemname"
                    value={formData.itemname}
                    onChange={handleChange}
                    placeholder="Item Name"
                    className="input"
                />

                <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Quantity"
                    className="input"
                />

                <select name="metric" value={formData.metric} onChange={handleChange} className="input">
                    <option value="">Select Metric</option>
                    {validMetrics.map((metric, index) => (
                        <option key={index} value={metric}>
                            {metric}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleChange}
                    placeholder="Unit Cost"
                    className="input"
                />

                <input
                    type="number"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleChange}
                    placeholder="Unit Price"
                    className="input"
                />

                <input
                    type="number"
                    name="amountPaid"
                    value={formData.amountPaid}
                    onChange={handleChange}
                    placeholder="Amount Paid"
                    className="input"
                />

                <button type="submit" className="button">
                    Add Stock
                </button>
            </form>
        </div>
    );
};

export default ManualTransfer;
