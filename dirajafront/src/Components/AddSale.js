import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BatchDetails from './BatchDetails';

const AddSale = () => {
    const [formData, setFormData] = useState({
        shop_id: '',
        customer_name: '',
        customer_number: '',
        quantity: '',
        payment_method: '',
        BatchNumber: '',
        item_name: '',
        metric: '',
        unit_price: '',
        stock_id: '',
        amount_paid: '',
    });
    const [shops, setShops] = useState([]);
    const [batchNumbers, setBatchNumbers] = useState([]);
    const [shopError, setShopError] = useState(false);
    const [batchError, setBatchError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    const validPaymentMethods = ['bank', 'cash', 'mpesa'];

    // Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            try {
                const response = await axios.get('/api/diraja/allshops', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                setShops(response.data);
                if (response.data.length === 0) setShopError(true);
            } catch (error) {
                console.error('Error fetching shops:', error);
                setShopError(true);
            }
        };
        fetchShops();
    }, []);

    // Fetch batch numbers
    useEffect(() => {
        const fetchBatchNumbers = async () => {
            try {
                const response = await axios.get('/api/diraja/batches/available', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                setBatchNumbers(response.data);
                if (response.data.length === 0) setBatchError(true);
            } catch (error) {
                console.error('Error fetching batch numbers:', error);
                setBatchError(true);
            }
        };
        fetchBatchNumbers();
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => {
            // Dynamically calculate amount_paid if quantity or unit_price changes
            if (name === 'quantity' || name === 'unit_price') {
                const updatedValue = { ...prevData, [name]: value };
                return {
                    ...updatedValue,
                    amount_paid: updatedValue.quantity && updatedValue.unit_price
                        ? updatedValue.quantity * updatedValue.unit_price
                        : '',
                };
            }
    
            // Allow manual editing of amount_paid
            return {
                ...prevData,
                [name]: value,
            };
        });
        setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };
    
    // Handle batch details fetched
    const handleBatchDetailsFetched = useCallback((details) => {
        setFormData((prevData) => ({
            ...prevData,
            item_name: details.itemname,
            metric: details.metric,
            unit_price: details.unit_price,
            stock_id: details.stock_id,
            amount_paid: prevData.quantity ? prevData.quantity * details.unit_price : '',
        }));
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const requiredFields = [
            'shop_id', 'BatchNumber', 'quantity', 'payment_method', 'item_name', 'stock_id',
        ];
    
        const newErrors = {};
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = `Please fill out the ${field.replace('_', ' ')} field.`;
            }
        });
    
        if (formData.payment_method && !validPaymentMethods.includes(formData.payment_method)) {
            newErrors.payment_method = `Invalid Payment Method. Must be one of: ${validPaymentMethods.join(', ')}`;
        }
    
        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }
    
        // Prepare payload
        const payload = {
            ...formData,
            customer_number: formData.customer_number || null, // Convert blank to null
        };
    
        console.log('Payload being sent:', JSON.stringify(payload, null, 2)); // Log the payload
    
        try {
            const response = await axios.post('/api/diraja/newsale', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
        
            if (response.status === 201) {
                setMessage({ text: response.data.message, type: 'success' });
                setFormData({
                    shop_id: '',
                    customer_name: '',
                    customer_number: '',
                    quantity: '',
                    payment_method: '',
                    BatchNumber: '',
                    item_name: '',
                    metric: '',
                    unit_price: '',
                    stock_id: '',
                    amount_paid: '',
                });
                setFieldErrors({});
            } else {
                setMessage({ text: 'Failed to add sale', type: 'error' });
            }
        } catch (error) {
            console.error('Error:', error);
        
            if (error.response && error.response.data) {
                const { data } = error.response;
        
                // Backend sends a specific error message
                if (data.message) {
                    setMessage({ text: data.message, type: 'error' });
                }
        
                // Backend sends validation errors for specific fields
                if (data.errors) {
                    const newErrors = {};
                    Object.entries(data.errors).forEach(([field, errorMsg]) => {
                        newErrors[field] = errorMsg;
                    });
                    setFieldErrors(newErrors);
                }
            } else {
                setMessage({ text: 'An unknown error occurred. Please try again.', type: 'error' });
            }
        }
        
    };
    

    return (
        <div>
            <h1>Add Sale</h1>
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
                        placeholder="Customer Number(optional)"
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
                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="input"
                    >
                        <option value="">Select Payment Method</option>
                        {validPaymentMethods.map((method) => (
                            <option key={method} value={method}>
                                {method.charAt(0).toUpperCase() + method.slice(1)}
                            </option>
                        ))}
                    </select>
                    <div>
                        
                        <input
                            id="amount_paid"
                            name="amount_paid"
                            type="number"
                            value={formData.amount_paid}
                            onChange={handleChange}
                            className="input"
                            placeholder="Amount Paid"
                        />
                    </div>

                    <button type="submit" className="button">Add Sale</button>
                </form>
            )}
        </div>
    );
};

export default AddSale;
