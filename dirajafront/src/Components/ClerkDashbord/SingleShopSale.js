import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
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
        total_price: '',
        BatchNumber: '',
        stock_id: '',
        status: '',
        sale_date: '',
        payment_methods: [{ method: '', amount: '', transaction_code: '' }], // Added transaction_code field
        promocode:''
    });
    const [item, setItems] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [remainingStock, setRemainingStock] = useState(0);

    const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay', 'not payed'];

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get('/api/diraja/items/available-by-shop', {
                    params: { shop_id: formData.shop_id },
                    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                });
                setItems(response.data);
            } catch (error) {
                setMessageType('error');
                setMessage('Error fetching items. Please try again.');
            }
        };
        fetchItems();
    }, [formData.shop_id]);

    useEffect(() => {
        const fetchItemDetails = async () => {
            if (!formData.item_name || !formData.shop_id) return;

            try {
                const response = await axios.get('/api/diraja/shop-itemdetails', {
                    params: {
                        item_name: formData.item_name,
                        shop_id: formData.shop_id,
                    },
                    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                });

                const { metric, unit_price, stock_id, quantity, BatchNumber } = response.data;

                setFormData((prevData) => ({
                    ...prevData,
                    metric: metric || '',
                    unit_price: unit_price || '',
                    stock_id: stock_id || '',
                    BatchNumber: BatchNumber || '',
                    total_price: prevData.quantity * (unit_price || 0),
                }));

                setRemainingStock(quantity);
            } catch (error) {
                setMessageType('error');
                setMessage('Error fetching item details. Please try again.');
            }
        };

        fetchItemDetails();
    }, [formData.item_name, formData.shop_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === 'quantity' || name === 'unit_price') {
            newFormData.total_price = parseInt(newFormData.quantity * newFormData.unit_price, 10) || 0;
        }

        setFormData(newFormData);
    };

    const handlePaymentChange = (index, field, value) => {
        const newPaymentMethods = [...formData.payment_methods];

        newPaymentMethods[index][field] = value;

        // Ensure that the transaction_code field is properly set when required
        if (field === "method") {
            if (value.toLowerCase() === "cash") {
                newPaymentMethods[index]["transaction_code"] = ""; // Clear transaction code if cash
            } else {
                // Ensure transaction_code field exists for non-cash payments
                newPaymentMethods[index]["transaction_code"] = newPaymentMethods[index]["transaction_code"] || "";
            }
        }

        // Ensure transaction_code defaults to "none" if left empty
        if (field === "transaction_code" && !value.trim()) {
            newPaymentMethods[index]["transaction_code"] = "none";
        }

        setFormData({ ...formData, payment_methods: newPaymentMethods });
    };

    const addPaymentMethod = () => {
        setFormData({
            ...formData,
            payment_methods: [...formData.payment_methods, { method: '', amount: '', transaction_code: '' }],
        });
    };

    const removePaymentMethod = (index) => {
        const newPaymentMethods = formData.payment_methods.filter((_, i) => i !== index);
        setFormData({ ...formData, payment_methods: newPaymentMethods });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        
        const formDataToSubmit = { ...formData };
        formDataToSubmit.payment_methods = formData.payment_methods.map(payment => ({
            ...payment,
            transaction_code: payment.transaction_code.trim() === "" ? "none" : payment.transaction_code
        }));
    
        try {
            console.log("Submitting Sale Data:", JSON.stringify(formDataToSubmit, null, 2));
    
            const response = await axios.post('/api/diraja/newsale', formDataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
    
            if (response.status === 201) {
                setMessageType('success');
                setMessage(response.data.message || 'Sale recorded successfully.');
    
                // Reset the form
                setFormData({
                    shop_id: localStorage.getItem('shop_id') || '',
                    customer_name: '',
                    customer_number: '',
                    item_name: '',
                    quantity: '',
                    metric: '',
                    unit_price: '',
                    total_price: '',
                    BatchNumber: '',
                    stock_id: '',
                    status: '',
                    sale_date: '',
                    payment_methods: [{ method: '', amount: '', transaction_code: '' }],
                    promocode: '',
                });
    
                setRemainingStock(0);
    
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (error) {
            console.error("Error submitting sale:", error);
    
            // Extract error message from API response
            const errorMessage = error.response?.data?.message || "An unexpected error occurred. Please try again.";
            
            setMessageType('error');
            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    

    
    

    return (
        <div>
            {message && (
                    <Stack>
                        <Alert severity={messageType} variant="outlined">
                            {message}
                        </Alert>
                    </Stack>
                )}
            <h1>Record a Sale</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <input name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name" />
                <input name="customer_number" value={formData.customer_number} onChange={handleChange} placeholder="Customer Number (optional)" />
                <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" />
                <select name="item_name" value={formData.item_name} onChange={handleChange}>
                    <option value="">Select Item</option>
                    {item.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                    ))}
                </select>
                {/* Date Selection */}
                <div>
                    <label>Select date:   </label>
                    <input
                        type="date"
                        name="sale_date"
                        value={formData.sale_date}
                        onChange={handleChange}
                        required
                    />
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
                    <label>Remaining Stock:</label>
                    <span>{remainingStock}</span>
                </div>
                <input name="total_price" type="number" value={formData.total_price} onChange={handleChange} placeholder="Amount" />
                <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Select">Select Payment Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially paid</option>
                </select>
                
                    <PaymentMethods
                        paymentMethods={formData.payment_methods}
                        validPaymentMethods={validPaymentMethods}
                        handlePaymentChange={handlePaymentChange}
                        addPaymentMethod={addPaymentMethod}
                        removePaymentMethod={removePaymentMethod}
                    />
                <div>
                    <label>Promocode:   </label>

                <input name="promocode" type="text" value={formData.promocode} onChange={handleChange} placeholder="Enter promocode" />
                </div>
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
