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
        status: '',
        sale_date: '',
        payment_methods: [{ method: '', amount: '' }]
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
    
                console.log("Item Details Response:", response.data); // ✅ Log response to check data
    
                const { metric, unit_price, stock_id, quantity, BatchNumber } = response.data;
    
                setFormData((prevData) => ({
                    ...prevData,
                    metric: metric || '',
                    unit_price: unit_price || '',
                    stock_id: stock_id || '',
                    BatchNumber: BatchNumber || '',
                    amount_paid: prevData.quantity * (unit_price || 0),
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
            newFormData.amount_paid = newFormData.quantity * newFormData.unit_price;
        }

        setFormData(newFormData);
    };

    const handlePaymentChange = (index, field, value) => {
        const newPaymentMethods = [...formData.payment_methods];
    
        newPaymentMethods[index][field] = value;
    
        if (field === "method") {
            if (value.toLowerCase() === "cash") {
                // If payment method is cash, clear the transaction code
                newPaymentMethods[index]["transactionCode"] = "";
            } else {
                // Ensure transactionCode field exists for non-cash payments
                newPaymentMethods[index]["transactionCode"] = newPaymentMethods[index]["transactionCode"] || "None";
            }
        }
    
        // Ensure transactionCode defaults to "N/A" if left empty
        if (field === "transactionCode" && !value.trim()) {
            newPaymentMethods[index]["transactionCode"] = "N/A";
        }
    
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
        setIsLoading(true);

        console.log("Submitting Sale Data:", JSON.stringify(formData, null, 2)); // ✅ Log data before sending

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

                // Wait for 2 seconds and refresh the page
                setTimeout(() => {
                    window.location.reload();
                }, 2000); // Adjust delay as needed (2000ms = 2s)

            } else {
                setMessageType('error');
                setMessage('Failed to add sale');
            }
        } catch (error) {
            console.error("Error submitting sale:", error.response ? error.response.data : error.message); // ✅ Log errors
            setMessageType('error');
            setMessage('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <div>
            {message && <div className={`message ${messageType}`}>{message}</div>}
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
                <input name="amount_paid" type="number" value={formData.amount_paid} onChange={handleChange} placeholder="Amount" />
                <select name="status" value={formData.status} onChange={handleChange}>
                        <option value="Select"> Select Payment Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="partially_paid">Partially paid</option>
                </select>
                {formData.status !== "unpaid" && (
                    <PaymentMethods
                        paymentMethods={formData.payment_methods}
                        validPaymentMethods={validPaymentMethods}
                        handlePaymentChange={handlePaymentChange}
                        addPaymentMethod={addPaymentMethod}
                        removePaymentMethod={removePaymentMethod}
                    />
                )}


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