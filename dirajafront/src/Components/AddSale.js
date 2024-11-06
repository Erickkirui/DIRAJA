import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddSale = () => {
    const [formData, setFormData] = useState({
        shop_id: '',
        customer_name: '',
        customer_number: '',
        item_name: '',
        quantity: '',
        metric: '',
        unit_price: '',
        amount_paid: '',
        payment_method: '',
        BatchNumber: '',
        stock_id: '',
    });
    const [shops, setShops] = useState([]);
    const [batchNumbers, setBatchNumbers] = useState([]);
    const [shopError, setShopError] = useState(false);
    const [batchError, setBatchError] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

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

    useEffect(() => {
        const fetchBatchDetails = async () => {
            if (!formData.BatchNumber) return;

            try {
                const response = await axios.get('/diraja/batch-details', {
                    params: { BatchNumber: formData.BatchNumber },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`
                    }
                });

                const { itemname, metric, unit_price, stock_id } = response.data;

                setFormData((prevData) => ({
                    ...prevData,
                    item_name: itemname || '',
                    metric: metric || '',
                    unit_price: unit_price || '',
                    stock_id: stock_id || '',
                }));
            } catch (error) {
                console.error('Error fetching batch details:', error);
            }
        };
        fetchBatchDetails();
    }, [formData.BatchNumber]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = [
            'shop_id', 'BatchNumber', 'customer_name', 'customer_number', 'item_name',
            'quantity', 'metric', 'unit_price', 'amount_paid',
            'payment_method', 'stock_id'
        ];

        const newErrors = {};
        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = `Please fill out the ${field.replace('_', ' ')} field.`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        console.log("Data being sent for sale:", formData);

        try {
            const response = await axios.post('/diraja/newsale', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.status === 201) {
                alert(response.data.message);
                setFormData({
                    shop_id: '',
                    customer_name: '',
                    customer_number: '',
                    item_name: '',
                    quantity: '',
                    metric: '',
                    unit_price: '',
                    amount_paid: '',
                    payment_method: '',
                    BatchNumber: '',
                    stock_id: '',
                });
                setFieldErrors({});
            } else {
                setFieldErrors({ form: 'Failed to add sale' });
            }
        } catch (error) {
            console.error('Error:', error);
            setFieldErrors({ form: 'An error occurred. Please try again.' });
        }
    };

    return (
        <div>
            <h1>Add Sale</h1>
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
                    {fieldErrors.shop_id && <p className="error">{fieldErrors.shop_id}</p>}

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
                    {fieldErrors.BatchNumber && <p className="error">{fieldErrors.BatchNumber}</p>}

                    <input
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        placeholder="Customer Name"
                        className="input"
                    />
                    {fieldErrors.customer_name && <p className="error">{fieldErrors.customer_name}</p>}

                    <input
                        name="customer_number"
                        value={formData.customer_number}
                        onChange={handleChange}
                        placeholder="Customer Number"
                        className="input"
                    />
                    {fieldErrors.customer_number && <p className="error">{fieldErrors.customer_number}</p>}

                    <input
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Quantity"
                        className="input"
                    />
                    {fieldErrors.quantity && <p className="error">{fieldErrors.quantity}</p>}

                    <input
                        name="amount_paid"
                        type="number"
                        value={formData.amount_paid}
                        onChange={handleChange}
                        placeholder="Amount Paid"
                        className="input"
                    />
                    {fieldErrors.amount_paid && <p className="error">{fieldErrors.amount_paid}</p>}

                    <input
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        placeholder="Payment Method"
                        className="input"
                    />
                    {fieldErrors.payment_method && <p className="error">{fieldErrors.payment_method}</p>}

                    <button type="submit" className="button">Add Sale</button>
                    {fieldErrors.form && <p className="error">{fieldErrors.form}</p>}
                </form>
            )}
            {formData.item_name && <span>Item Name: {formData.item_name}</span>}
            {formData.metric && <span>Metric: {formData.metric}</span>}
            {formData.unit_price && <span>Unit Price: {formData.unit_price}</span>}
            {formData.stock_id && <span>Stock ID: {formData.stock_id}</span>}
        </div>
    );
};

export default AddSale;
