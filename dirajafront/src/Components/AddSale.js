import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BatchDetails from './BatchDetails';

const AddSale = () => {
    const [formData, setFormData] = useState({
        shop_id: '',
        customer_name: '',
        customer_number: '',
        quantity: '',
        amount_paid: '',
        payment_method: '',
        BatchNumber: '',
        item_name: '',
        metric: '',
        unit_price: '',
        stock_id: ''
    });
    const [shops, setShops] = useState([]);
    const [batchNumbers, setBatchNumbers] = useState([]);
    const [shopError, setShopError] = useState(false);
    const [batchError, setBatchError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' }); // For success/error messages

    const validPaymentMethods = ['bank', 'cash', 'mpesa']; // Valid payment methods

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await axios.get('/diraja/allshops', {
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
        const fetchBatchNumbers = async () => {
            try {
                const response = await axios.get('/diraja/batches/available', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                setBatchNumbers(response.data);
                if (response.data.length === 0) {
                    setBatchError(true);
                }
            } catch (error) {
                console.error('Error fetching batch numbers:', error);
                setBatchError(true);
            }
        };
        fetchBatchNumbers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    };

    const handleBatchDetailsFetched = (details) => {
        setFormData((prevData) => ({
            ...prevData,
            item_name: details.itemname,
            metric: details.metric,
            unit_price: details.unit_price,
            stock_id: details.stock_id
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = [
            'shop_id', 'BatchNumber', 'customer_name', 'customer_number',
            'quantity', 'amount_paid', 'payment_method', 'item_name', 'stock_id'
        ];

        const newErrors = {};
        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = `Please fill out the ${field.replace('_', ' ')} field.`;
            }
        });

        // Payment method validation
        if (formData.payment_method && !validPaymentMethods.includes(formData.payment_method)) {
            newErrors.payment_method = `Invalid Payment Method. Must be one of: ${validPaymentMethods.join(', ')}`;
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        try {
            const response = await axios.post('/diraja/newsale', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.status === 201) {
                setMessage({ text: response.data.message, type: 'success' });
                setFormData({
                    shop_id: '',
                    customer_name: '',
                    customer_number: '',
                    quantity: '',
                    amount_paid: '',
                    payment_method: '',
                    BatchNumber: '',
                    item_name: '',
                    metric: '',
                    unit_price: '',
                    stock_id: ''
                });
                setFieldErrors({});
            } else {
                setMessage({ text: 'Failed to add sale', type: 'error' });
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
        }
    };

    return (
        <div>
            <h1>Add Sale</h1>
            {/* General Error Alert */}
            {Object.keys(fieldErrors).length > 0 && (
                <div className="alert alert-error">
                    
                    {Object.values(fieldErrors).join(' ')} {/* Display all error messages */}
                </div>
            )}
            {message.text && (
                <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
                    {message.text}
                </div>
            )}

            {shopError ? (
                <p>Error loading shops. Please try again later.</p>
            ) : (
                <form onSubmit={handleSubmit} className="form">
                    <select name="shop_id" value={formData.shop_id} onChange={handleChange} className="input">
                        <option value="">Select Shop</option>
                        {shops.map((shop) => (
                            <option key={shop.shop_id} value={shop.shop_id}>
                                {shop.shopname}
                            </option>
                        ))}
                    </select>

                    {batchError ? (
                        <p>Error loading batch numbers. Please try again later.</p>
                    ) : (
                        <select name="BatchNumber" value={formData.BatchNumber} onChange={handleChange} className="input">
                            <option value="">Select Batch Number</option>
                            {batchNumbers.map((batch, index) => (
                                <option key={index} value={batch}>
                                    {batch}
                                </option>
                            ))}
                        </select>
                    )}
                    <BatchDetails batchNumber={formData.BatchNumber} onDetailsFetched={handleBatchDetailsFetched} />

                    <input
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        placeholder="Customer Name"
                        className="input"
                    />

                    <input
                        name="customer_number"
                        value={formData.customer_number}
                        onChange={handleChange}
                        placeholder="Customer Number"
                        className="input"
                    />

                    <input
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Quantity"
                        className="input"
                    />

                    <input
                        name="amount_paid"
                        type="number"
                        value={formData.amount_paid}
                        onChange={handleChange}
                        placeholder="Amount Paid"
                        className="input"
                    />

                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="input"
                    >
                        <option value="">Select Payment Method</option>
                        {validPaymentMethods.map((method) => (
                            <option key={method} value={method}>
                                {method.charAt(0).toUpperCase() + method.slice(1)} {/* Capitalize method */}
                            </option>
                        ))}
                    </select>

                    <button type="submit" className="button">Add Sale</button>
                </form>
            )}
        </div>
    );
};

export default AddSale;
