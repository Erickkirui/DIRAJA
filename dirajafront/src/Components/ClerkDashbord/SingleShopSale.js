import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PaymentMethods from '../PaymentMethod';

const SingleShopSale = () => {
    const [formData, setFormData] = useState({
        shop_id: localStorage.getItem('shop_id') || '',
        customer_name: '',
        customer_number: '',
        item_name: '',
        quantity: '',
        metric: '',
        unit_price: '',
        amount_paid: '',
        BatchNumber: '',
        stock_id: '',
        sale_date: '', // Added date field
        payment_methods: [{ method: '', amount: '' }]
    });
    const [batchNumbers, setBatchNumbers] = useState([]);
    const [batchError, setBatchError] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [remainingStock, setRemainingStock] = useState(0);

    const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay'];

    useEffect(() => {
        const fetchBatchNumbers = async () => {
            try {
                const response = await axios.get('/api/diraja/batches/available-by-shop', {
                    params: { shop_id: formData.shop_id },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                setBatchNumbers(response.data);
                if (response.data.length === 0) {
                    setBatchError(true);
                }
            } catch (error) {
                console.error('Error fetching batch numbers:', error);
                setBatchError(true);
                setMessageType('error');
                setMessage('Error fetching batch numbers. Please try again later.');
            }
        };
        fetchBatchNumbers();
    }, [formData.shop_id]);

    useEffect(() => {
        const fetchBatchDetails = async () => {
            if (!formData.BatchNumber || !formData.shop_id) return;

            try {
                const response = await axios.get('/api/diraja/shop-batchdetails', {
                    params: {
                        BatchNumber: formData.BatchNumber,
                        shop_id: formData.shop_id,
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });

                const { itemname, metric, unit_price, stock_id, quantity } = response.data;

                setFormData((prevData) => ({
                    ...prevData,
                    item_name: itemname || '',
                    metric: metric || '',
                    unit_price: unit_price || '',
                    stock_id: stock_id || '',
                    amount_paid: prevData.quantity * (unit_price || 0),
                }));

                setRemainingStock(quantity);
            } catch (error) {
                console.error('Error fetching batch details:', error);
                setMessageType('error');
                setMessage('Error fetching batch details. Please try again.');
            }
        };

        fetchBatchDetails();
    }, [formData.BatchNumber, formData.shop_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === 'quantity' || name === 'unit_price') {
            newFormData.amount_paid = newFormData.quantity * newFormData.unit_price;
        }

        setFormData(newFormData);
    };

    const handlePaymentChange = (index, field, value) => {
        const newPaymentMethods = [...formData.payment_methods];
        newPaymentMethods[index][field] = value;
        setFormData({ ...formData, payment_methods: newPaymentMethods });
    };

    const addPaymentMethod = () => {
        setFormData({
            ...formData,
            payment_methods: [...formData.payment_methods, { method: '', amount: '' }],
        });
    };

    const removePaymentMethod = (index) => {
        const newPaymentMethods = formData.payment_methods.filter((_, i) => i !== index);
        setFormData({ ...formData, payment_methods: newPaymentMethods });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = [
            'shop_id',
            'customer_name',
            'item_name',
            'quantity',
            'metric',
            'unit_price',
            'amount_paid',
            'BatchNumber',
            'stock_id',
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                setMessageType('error');
                setMessage(`Please fill out the ${field} field.`);
                return;
            }
        }

        if (formData.payment_methods.some((method) => !method.method || !method.amount)) {
            setMessageType('error');
            setMessage('Please provide valid payment method details.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('/api/diraja/newsale', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 201) {
                setMessageType('success');
                setMessage(response.data.message);
                setFormData({
                    shop_id: localStorage.getItem('shop_id') || '',
                    customer_name: '',
                    customer_number: '',
                    item_name: '',
                    quantity: '',
                    metric: '',
                    unit_price: '',
                    amount_paid: '',
                    BatchNumber: '',
                    stock_id: '',
                    payment_methods: [{ method: '', amount: '' }],
                });
                setRemainingStock(0);
            } else {
                setMessageType('error');
                setMessage('Failed to add sale');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setMessageType('error');
                setMessage(error.response.data.message);
            } else {
                setMessageType('error');
                setMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {message && (
                <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <h1>Record a Sale</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <input
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Customer Name"
                />
                <input
                    name="customer_number"
                    value={formData.customer_number}
                    onChange={handleChange}
                    placeholder="Customer Number (optional)"
                />
                <input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Quantity"
                />
               

                {batchError ? (
                    <p>Error loading batch numbers. Please try again later.</p>
                ) : (
                    <select name="BatchNumber" value={formData.BatchNumber} onChange={handleChange}>
                        <option value="">Select Batch Number</option>
                        {batchNumbers.map((batch, index) => (
                            <option key={index} value={batch}>
                                {batch}
                            </option>
                        ))}
                    </select>
                )}

                 {/* Date Selection */}
                 <div>
                    <label>Select date : </label>
                 <input
                    type="date"
                    name="sale_date"
                    value={formData.sale_date}
                    onChange={handleChange}
                    required
                />
                </div>

                <div>
                    <label>Item Name : </label>
                    <span>{formData.item_name}</span>
                </div>
                <div>
                    <label>Metric : </label>
                    <span>{formData.metric}</span>
                </div>
                <div>
                    <label>Unit Price : </label>
                    <span>{formData.unit_price}</span>
                </div>
                <div>
                    <label>Stock ID : </label>
                    <span>{formData.stock_id}</span>
                </div>

                {/* Display Remaining Stock */}
                <div>
                    <label>Remaining Stock: </label>
                    <span>{remainingStock}</span>
                </div>

                <div>
                    <label>Total Amount : </label>
                    <input
                        id="amount_paid"
                        name="amount_paid"
                        type="number"
                        value={formData.amount_paid}
                        onChange={handleChange}
                        className="input"
                        placeholder="Amount"
                    />
                </div>

                {/* Payment Methods Component */}
                <PaymentMethods
                    paymentMethods={formData.payment_methods}
                    validPaymentMethods={validPaymentMethods}
                    handlePaymentChange={handlePaymentChange}
                    addPaymentMethod={addPaymentMethod}
                    removePaymentMethod={removePaymentMethod}
                />

             

                <button className="add-sale-button" type="submit">
                    Add Sale
                </button>

                {isLoading && <div className="posting-sale"></div>}

                <Link className="nav-clerk-button" to="/clerk">
                    Home
                </Link>
            </form>
        </div>
    );
};

export default SingleShopSale;
