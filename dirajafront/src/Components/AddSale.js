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
    const [shopError, setShopError] = useState(false);

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
                alert(`Please fill out the ${field} field.`);
                return;
            }
        }

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
            } else {
                alert('Failed to add sale');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            {shopError ? (
                <p>Error loading shops. Please try again later.</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <select name="shop_id" value={formData.shop_id} onChange={handleChange}>
                        <option value="">Select Shop</option>
                        {shops.map((shop) => (
                            <option key={shop.shop_id} value={shop.shop_id}>
                                {shop.shopname}
                            </option>
                        ))}
                    </select>
                    <input name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name" />
                    <input name="customer_number" value={formData.customer_number} onChange={handleChange} placeholder="Customer Number" />
                    <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" />

                    {/* Display Batch Number and fetched details */}
                    <input name="BatchNumber" value={formData.BatchNumber} onChange={handleChange} placeholder="Batch Number" />
                    
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

                    <input name="amount_paid" type="number" value={formData.amount_paid} onChange={handleChange} placeholder="Amount Paid" />
                    <input name="payment_method" value={formData.payment_method} onChange={handleChange} placeholder="Payment Method" />
                    
                    <button type="submit">Add Sale</button>
                </form>
            )}
        </div>
    );
};

export default AddSale;
