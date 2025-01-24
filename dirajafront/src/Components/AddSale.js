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
        total_price: '', // New field for total price
    });
    const [paymentMethods, setPaymentMethods] = useState([{ method: '', amount: '' }]);
    const [shops, setShops] = useState([]);
    const [batchNumbers, setBatchNumbers] = useState([]);
    const [shopError, setShopError] = useState(false);
    const [batchError, setBatchError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay'];

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

     // Handle input changes for form data
     const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [name]: value };

            // Calculate total price if quantity or unit_price changes
            if (name === 'quantity' || name === 'unit_price') {
                const quantity = parseFloat(updatedData.quantity) || 0;
                const unitPrice = parseFloat(updatedData.unit_price) || 0;
                updatedData.total_price = quantity * unitPrice;
            }

            return updatedData;
        });
        setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };

    // Handle changes for payment methods
    const handlePaymentChange = (index, field, value) => {
        setPaymentMethods((prevMethods) =>
            prevMethods.map((method, idx) =>
                idx === index ? { ...method, [field]: value } : method
            )
        );
    };

    // Add a new payment method
    const addPaymentMethod = () => {
        setPaymentMethods((prevMethods) => [...prevMethods, { method: '', amount: '' }]);
    };

    // Remove a payment method
    const removePaymentMethod = (index) => {
        setPaymentMethods((prevMethods) => prevMethods.filter((_, idx) => idx !== index));
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
            total_price: prevData.quantity ? prevData.quantity * details.unit_price : '', // Update total price

        }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = ['shop_id', 'BatchNumber', 'quantity', 'item_name', 'stock_id'];
        const newErrors = {};
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = `Please fill out the ${field.replace('_', ' ')} field.`;
            }
        });

        if (paymentMethods.some((pm) => !pm.method || !pm.amount)) {
            newErrors.paymentMethods = 'Each payment method must have a valid type and amount.';
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        const payload = {
            ...formData,
            payment_methods: paymentMethods,
        };

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
                    BatchNumber: '',
                    item_name: '',
                    metric: '',
                    unit_price: '',
                    total_price: '',
                    stock_id: '',
                });
                setPaymentMethods([{ method: '', amount: '' }]);
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
                <select name="shop_id" value={formData.shop_id} onChange={handleChange} className="input">
                    <option value="">Select Shop</option>
                    {shops.map((shop) => (
                        <option key={shop.shop_id} value={shop.shop_id}>
                            {shop.shopname}
                        </option>
                    ))}
                </select>
                <select name="BatchNumber" value={formData.BatchNumber} onChange={handleChange} className="input">
                    <option value="">Select Batch Number</option>
                    {batchNumbers.map((batch, index) => (
                        <option key={index} value={batch}>
                            {batch}
                        </option>
                    ))}
                </select>
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
                {/* Display total price below quantity */}
                <div>
                    <label>Total Price:</label>
                    <p>{formData.total_price || 0}</p>
                </div>
                <div>
                    <h3>Payment Methods</h3>
                    {paymentMethods.map((method, index) => (
                        <div key={index} className="payment-method">
                            <select
                                value={method.method}
                                onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                                className="input"
                            >
                                <option value="">Select Payment Method</option>
                                {validPaymentMethods.map((validMethod) => (
                                    <option key={validMethod} value={validMethod}>
                                        {validMethod.charAt(0).toUpperCase() + validMethod.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={method.amount}
                                onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                                placeholder="Amount"
                                className="input"
                            />
                            <button type="button" onClick={() => removePaymentMethod(index)} className="button remove">
                                Remove
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addPaymentMethod} className="button add">
                        Add Payment Method
                    </button>
                </div>
                <button type="submit" className="button">
                    Add Sale
                </button>
            </form>
        </div>
    );
};

export default AddSale;

