
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BatchDetails from './BatchDetails';
import PaymentMethods from './PaymentMethod';

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
        total_price: '',
        sale_date: '', // New field for selecting sale date
    });

    const [paymentMethods, setPaymentMethods] = useState([{ method: '', amount: '' }]);
    const [items, setItems] = useState([]);
    const [shops, setShops] = useState([]);
    const [batchNumbers, setBatchNumbers] = useState([]);
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
            } catch (error) {
                console.error('Error fetching shops:', error);
            }
        };
        fetchShops();
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            if (!formData.shop_id) {
                setItems([]);
                return;
            }
            try {
                const response = await axios.get('/api/diraja/items/available-by-shop', {
                    params: { shop_id: formData.shop_id },
                    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                });
                setItems(response.data);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };
        fetchItems();
    }, [formData.shop_id]);

    // Fetch batch numbers based on shop_id
    useEffect(() => {
        const fetchBatchNumbers = async () => {
            if (!formData.shop_id) {
                setBatchNumbers([]);
                return;
            }
            try {
                const response = await axios.get('/api/diraja/batches/available-by-shop', {
                    params: { shop_id: formData.shop_id },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                setBatchNumbers(response.data);
            } catch (error) {
                console.error('Error fetching batch numbers:', error);
            }
        };
        fetchBatchNumbers();
    }, [formData.shop_id]);

    const handleItemSelect = async (e) => {
        const selectedItemName = e.target.value;
        setFormData((prevData) => ({ ...prevData, item_name: selectedItemName }));

        try {
            const response = await axios.get('/api/diraja/shop-itemdetails', {
                params: { shop_id: formData.shop_id, item_name: selectedItemName },
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });
            const details = response.data;
            setFormData((prevData) => ({
                ...prevData,
                metric: details.metric,
                unit_price: details.unit_price,
                stock_id: details.stock_id,
                amount_paid: prevData.quantity ? prevData.quantity * details.unit_price : '',
                total_price: prevData.quantity ? prevData.quantity * details.unit_price : '',
            }));
        } catch (error) {
            console.error('Error fetching item details:', error);
        }
    };

    // Handle input changes for form data
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [name]: value };

            // Recalculate total price if quantity or unit_price changes
            if ((name === 'quantity' || name === 'unit_price') && name !== 'total_price') {
                const quantity = parseFloat(updatedData.quantity) || 0;
                const unitPrice = parseFloat(updatedData.unit_price) || 0;
                updatedData.total_price = quantity * unitPrice;
            }

            return updatedData;
        });
        setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = ['shop_id', 'quantity', 'item_name', 'stock_id', 'sale_date'];
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

        // Log the data being sent
        console.log("Payload data being sent:", payload);

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
                    sale_date: '',
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
                <select name="item_name" value={formData.item_name} onChange={handleItemSelect} className="input">
                    <option value="">Select Item</option>
                    {items.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
                
                
                <input type="date" name="sale_date" value={formData.sale_date} onChange={handleChange} className="input" />

                <input name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name" className="input" />
                <input name="customer_number" value={formData.customer_number} onChange={handleChange} placeholder="Customer Number (optional)" className="input" />
                <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="input" />

                <input type="number" name="total_price" value={formData.total_price || ''} onChange={handleChange} placeholder="Total Price" className="input" />

                <PaymentMethods paymentMethods={paymentMethods} validPaymentMethods={validPaymentMethods} handlePaymentChange={(index, field, value) =>
                    setPaymentMethods((prev) =>
                        prev.map((pm, idx) => (idx === index ? { ...pm, [field]: value } : pm))
                    )
                } addPaymentMethod={() => setPaymentMethods((prev) => [...prev, { method: '', amount: '' }])} removePaymentMethod={(index) =>
                    setPaymentMethods((prev) => prev.filter((_, idx) => idx !== index))
                } />

                <button type="submit" className="button">Add Sale</button>
            </form>
        </div>
    );
};

export default AddSale;


