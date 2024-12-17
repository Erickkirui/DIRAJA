import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SingleShopSale = () => {
    const [formData, setFormData] = useState({
        shop_id: localStorage.getItem('shop_id') || '',  // Get shop_id from local storage
        customer_name: '',
        customer_number: '',
        item_name: '',
        quantity: '',
        metric: '',
        unit_price: '', // Fetched from batch details
        amount_paid: '', // Will be calculated
        payment_method: '',
        BatchNumber: '',
        stock_id: '',
    });
    const [batchNumbers, setBatchNumbers] = useState([]);
    const [batchError, setBatchError] = useState(false);
    const [message, setMessage] = useState(''); // For displaying messages
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    useEffect(() => {
        const fetchBatchNumbers = async () => {
            try {
                const response = await axios.get('/api/diraja/batches/available-by-shop', {
                    params: { shop_id: formData.shop_id },  // Send shop_id as a query parameter
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
    }, [formData.shop_id]);

    useEffect(() => {
        const fetchBatchDetails = async () => {
            if (!formData.BatchNumber) return;

            try {
                const response = await axios.get('/api/diraja/batch-details', {
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
                    amount_paid: prevData.quantity * (unit_price || 0), // Calculate amount_paid automatically
                }));
            } catch (error) {
                console.error('Error fetching batch details:', error);
            }
        };

        fetchBatchDetails();
    }, [formData.BatchNumber]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        // Automatically calculate amount_paid if quantity changes
        if (name === 'quantity' || name === 'unit_price') {
            newFormData.amount_paid = newFormData.quantity * newFormData.unit_price;
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const requiredFields = [
            'shop_id', 'customer_name', 'customer_number', 'item_name', 
            'quantity', 'metric', 'unit_price', 'amount_paid', 
            'payment_method', 'BatchNumber', 'stock_id'
        ];
    
        for (const field of requiredFields) {
            if (!formData[field]) {
                setMessageType('error');
                setMessage(`Please fill out the ${field} field.`);
                return;
            }
        }
    
        console.log("Data being sent for sale:", formData);
    
        try {
            const response = await axios.post('/api/diraja/newsale', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });
    
            if (response.status === 201) {
                setMessageType('success');
                setMessage(response.data.message);
                setFormData({
                    shop_id: localStorage.getItem('shop_id') || '',  // Reset with shop_id from local storage
                    customer_name: '',
                    customer_number: '',
                    item_name: '',
                    quantity: '',
                    metric: '',
                    unit_price: '', // Reset unit_price
                    amount_paid: '',  // Reset amount_paid
                    payment_method: '',
                    BatchNumber: '',
                    stock_id: '',
                });
            } else {
                setMessageType('error');
                setMessage('Failed to add sale');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessageType('error');
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            {/* Display the message above the form */}
            {message && (
                <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}
            
            <h1>Record a sale</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <input name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name" />
                <input name="customer_number" value={formData.customer_number} onChange={handleChange} placeholder="Customer Number" />
                <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" />

                {/* Batch Number Dropdown */}
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
                
                <div>
                    <label>Item Name:</label>
                    <span>{formData.item_name}</span>
                </div>
                <div>
                    <label>Metric:</label>
                    <span>{formData.metric}</span>
                </div>
                <div>
                    <label>Unit Price:</label>
                    <span>{formData.unit_price}</span>
                </div>
                <div>
                    <label>Stock ID:</label>
                    <span>{formData.stock_id}</span>
                </div>

                <div>
                    <label>Total Amount:</label>
                    <span>{formData.amount_paid}</span> {/* Display calculated amount */}
                </div>

                <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="payment-method-dropdown">
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank</option>
                </select>

                
                <button className="button" type="submit">Add Sale</button>
                
            </form>
            <Link to='/clerk'>Home</Link>
        </div>
    );
};

export default SingleShopSale;
