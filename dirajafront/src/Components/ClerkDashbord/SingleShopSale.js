import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import PaymentMethods from '../PaymentMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const SingleShopSale = () => {
    const [formData, setFormData] = useState({
        shop_id: localStorage.getItem('shop_id') || '',
        customer_name: '',
        customer_number: '',
        status: '',
        sale_date: '',
        payment_methods: [{ method: '', amount: '', transaction_code: '' }],
        promocode: '',
        items: [{
            item_name: '',
            quantity: '',
            metric: '',
            unit_price: '',
            total_price: '',
            BatchNumber: '',
            stock_id: '',
            remainingStock: 0
        }]
    });
    const [availableItems, setAvailableItems] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);

    const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay', 'not payed'];

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get('/api/diraja/items/available-by-shop', {
                    params: { shop_id: formData.shop_id },
                    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                });
                setAvailableItems(response.data);
            } catch (error) {
                setMessageType('error');
                setMessage('Error fetching items. Please try again.');
            }
        };
        fetchItems();
    }, [formData.shop_id]);

    useEffect(() => {
        // Calculate grand total whenever items change
        const total = formData.items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
        setGrandTotal(total);
    }, [formData.items]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Calculate total price if quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
            const quantity = parseFloat(newItems[index].quantity) || 0;
            const unitPrice = parseFloat(newItems[index].unit_price) || 0;
            newItems[index].total_price = (quantity * unitPrice).toFixed(2);
        }

        setFormData({ ...formData, items: newItems });
    };

    const fetchItemDetails = async (index) => {
        const itemName = formData.items[index].item_name;
        if (!itemName || !formData.shop_id) return;

        try {
            const response = await axios.get('/api/diraja/shop-itemdetails', {
                params: {
                    item_name: itemName,
                    shop_id: formData.shop_id,
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });

            const { metric, unit_price, stock_id, quantity, BatchNumber } = response.data;

            const newItems = [...formData.items];
            newItems[index] = {
                ...newItems[index],
                metric: metric || '',
                unit_price: unit_price || '',
                stock_id: stock_id || '',
                BatchNumber: BatchNumber || '',
                remainingStock: quantity || 0
            };

            // Recalculate total price with new unit price
            const qty = parseFloat(newItems[index].quantity) || 0;
            newItems[index].total_price = (qty * (unit_price || 0)).toFixed(2);

            setFormData({ ...formData, items: newItems });
        } catch (error) {
            setMessageType('error');
            setMessage(`Error fetching details for ${itemName}. Please try again.`);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    item_name: '',
                    quantity: '',
                    metric: '',
                    unit_price: '',
                    total_price: '',
                    BatchNumber: '',
                    stock_id: '',
                    remainingStock: 0
                }
            ]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length <= 1) {
            setMessageType('warning');
            setMessage('You must have at least one item in the sale.');
            return;
        }

        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePaymentChange = (index, field, value) => {
        const newPaymentMethods = [...formData.payment_methods];
        newPaymentMethods[index][field] = value;

        if (field === "method") {
            if (value.toLowerCase() === "cash") {
                newPaymentMethods[index]["transaction_code"] = "";
            } else {
                newPaymentMethods[index]["transaction_code"] = newPaymentMethods[index]["transaction_code"] || "";
            }
        }

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
        
        // Validate items
        for (const item of formData.items) {
            if (!item.item_name || !item.quantity || !item.unit_price) {
                setMessageType('error');
                setMessage('All items must have name, quantity, and unit price');
                setIsLoading(false);
                return;
            }
            
            if (parseFloat(item.quantity) > parseFloat(item.remainingStock)) {
                setMessageType('error');
                setMessage(`Quantity for ${item.item_name} exceeds available stock (${item.remainingStock})`);
                setIsLoading(false);
                return;
            }
        }

        const formDataToSubmit = { 
            ...formData,
            items: formData.items.map(item => ({
                item_name: item.item_name,
                quantity: parseFloat(item.quantity),
                metric: item.metric,
                unit_price: parseFloat(item.unit_price),
                total_price: parseFloat(item.total_price)
            })),
            payment_methods: formData.payment_methods.map(payment => ({
                ...payment,
                amount: parseFloat(payment.amount),
                transaction_code: payment.transaction_code.trim() === "" ? "none" : payment.transaction_code
            }))
        };
    
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
                    status: '',
                    sale_date: '',
                    payment_methods: [{ method: '', amount: '', transaction_code: '' }],
                    promocode: '',
                    items: [{
                        item_name: '',
                        quantity: '',
                        metric: '',
                        unit_price: '',
                        total_price: '',
                        BatchNumber: '',
                        stock_id: '',
                        remainingStock: 0
                    }]
                });
    
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (error) {
            console.error("Error submitting sale:", error);
            const errorMessage = error.response?.data?.message || "An unexpected error occurred. Please try again.";
            setMessageType('error');
            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
           
            <h1>Record  Sales</h1>
            <form onSubmit={handleSubmit} className="clerk-sale">
                <h5>Customer Details</h5>
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
                
                {/* Items Section */}
               
                    <h5>Sold Items</h5>
                    {formData.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="item-row">
                            <select 
                                name={`item_name_${itemIndex}`} 
                                value={item.item_name} 
                                onChange={(e) => {
                                    handleItemChange(itemIndex, 'item_name', e.target.value);
                                    // Fetch details when item is selected
                                    if (e.target.value) {
                                        setTimeout(() => fetchItemDetails(itemIndex), 100);
                                    }
                                }}
                            >
                                <option value="">Select Item</option>
                                {availableItems.map((availItem, idx) => (
                                    <option key={idx} value={availItem}>{availItem}</option>
                                ))}
                            </select>
                            
                            <input 
                                type="number" 
                                name={`quantity_${itemIndex}`}
                                value={item.quantity} 
                                onChange={(e) => handleItemChange(itemIndex, 'quantity', e.target.value)}
                                placeholder="Quantity" 
                                min="0"
                                step="0.01"
                            />
                            
                        
                            <p className='qunatity-level'>Remaining In Stock : {item.remainingStock} {item.metric}</p>
                                
                            {formData.items.length > 1 && (
                                <button 
                                    type="button" 
                                    onClick={() => removeItem(itemIndex)}
                                    className='delete-entry'
                                   
                                >
                                    <FontAwesomeIcon icon={faTrash} className="text-red-500 w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    
                    <button 
                        type="button" 
                        onClick={addItem}
                        className="complimentary-button"
                    >
                        Add Another Item
                    </button>
              
                
                {/* Grand Total */}
                <div className="grand-total">
                    <h3>Grand Total: {grandTotal.toFixed(2)}</h3>
                </div>
                
                {/* Date Selection */}
               
                    <h5>Select date: </h5>
                    <input
                        type="date"
                        placeholder="DD/MM/YYYY"
                        name="sale_date"
                        value={formData.sale_date}
                        onChange={handleChange}
                        required
                    />
              
                
                <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Payment Status</option>
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
                    totalAmount={grandTotal}
                />
                
             
                   
                    <input 
                        name="promocode" 
                        type="text" 
                        value={formData.promocode} 
                        onChange={handleChange} 
                        placeholder="Enter promocode" 
                    />
              
                
                <button className="add-sale-button" type="submit" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Add Sale'}
                </button>
                 {message && (
                <Stack>
                    <Alert severity={messageType} variant="outlined">
                        {message}
                    </Alert>
                </Stack>
            )}

                <Link className="nav-clerk-button" to="/clerk">
                    Home
                </Link>
            </form>
        </div>
    );
};

export default SingleShopSale;