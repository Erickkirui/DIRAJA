import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import PaymentMethods from '../PaymentMethod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  Form,
  DatePicker,
} from 'antd';
import dayjs from 'dayjs';

const CategorizedShopSale = () => {
    const [formData, setFormData] = useState({
        shop_id: localStorage.getItem('shop_id') || '',
        customer_name: '',
        customer_number: '',
        status: '',
        sale_date: dayjs().format('YYYY-MM-DD'),
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
            remainingStock: 0,
            unit_type: 'pieces',
            estimated_cost: 0
        }]
    });
    const [availableItems, setAvailableItems] = useState([]);
    const [categorizedItems, setCategorizedItems] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);
    const [stockItems, setStockItems] = useState([]);

    const unitTypes = [
        { value: 'pieces', label: 'Pieces' },
        { value: 'pack', label: 'Pack' }
    ];
    const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay', 'not payed', 'sasapay deliveries'];

    // Sample category mapping (you would replace this with your actual data)
    const categoryMapping = {
        'Broiler': ['Necks', 'Liver', 'Whole Chicken', 'Drumsticks', 'Wings'],
        'Beef': ['Steak', 'Mince', 'Ribs', 'Roast'],
        'Pork': ['Chops', 'Bacon', 'Sausages', 'Ham'],
        'Other': ['Smokies', 'Eggs', 'Cheese']
    };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const [batchesResponse, stockItemsResponse] = await Promise.all([
                    axios.get('https://kulima.co.ke/api/diraja/batches/available-by-shopv2', {
                        params: { shop_id: formData.shop_id },
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                    }),
                    axios.get('https://kulima.co.ke/api/diraja/stockitems', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                    })
                ]);
                
                setAvailableItems(batchesResponse.data);
                setStockItems(stockItemsResponse.data.stock_items || []);
                
                // Categorize items (this is a simplified example)
                const categorized = {};
                batchesResponse.data.forEach(item => {
                    // Find which category this item belongs to
                    let category = 'Other';
                    for (const [cat, items] of Object.entries(categoryMapping)) {
                        if (items.includes(item)) {
                            category = cat;
                            break;
                        }
                    }
                    
                    if (!categorized[category]) {
                        categorized[category] = [];
                    }
                    categorized[category].push(item);
                });
                
                setCategorizedItems(categorized);
            } catch (error) {
                setMessageType('error');
                setMessage('Error fetching items. Please try again.');
            }
        };
        fetchItems();
    }, [formData.shop_id]);

    useEffect(() => {
        const total = formData.items.reduce((sum, item) => sum + (parseFloat(item.estimated_cost) || 0), 0);
        setGrandTotal(total);
    }, [formData.items]);

    const calculateEstimatedCost = (item) => {
        const stockItem = stockItems.find(si => si.item_name === item.item_name);
        if (!stockItem) return 0;

        const quantity = parseFloat(item.quantity) || 0;
        
        if (item.unit_type === 'pack' && stockItem.pack_price) {
            return quantity * parseFloat(stockItem.pack_price);
        } else {
            return quantity * (parseFloat(item.unit_price) || 0);
        }
    };

    const fetchItemDetails = async (index) => {
        const itemName = formData.items[index].item_name;
        if (!itemName || !formData.shop_id) return;

        try {
            const response = await axios.get('https://kulima.co.ke/api/diraja/shop-itemdetailsv2', {
                params: {
                    item_name: itemName,
                    shop_id: formData.shop_id,
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });

            const stockItem = stockItems.find(si => si.item_name === itemName);
            const { metric, stock_id, quantity, BatchNumber } = response.data;

            const newItems = [...formData.items];
            newItems[index] = {
                ...newItems[index],
                metric: metric || '',
                unit_price: stockItem?.unit_price || '',
                stock_id: stock_id || '',
                BatchNumber: BatchNumber || '',
                remainingStock: quantity || 0,
                unit_type: 'pieces',
                estimated_cost: calculateEstimatedCost(newItems[index])
            };

            const qty = parseFloat(newItems[index].quantity) || 0;
            newItems[index].total_price = (qty * (newItems[index].unit_price || 0)).toFixed(2);

            setFormData({ ...formData, items: newItems });
        } catch (error) {
            setMessageType('error');
            setMessage(`Error fetching details for ${itemName}. Please try again.`);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        const stockItem = stockItems.find(si => si.item_name === newItems[index].item_name);

        if (field === 'unit_type') {
            newItems[index].estimated_cost = calculateEstimatedCost(newItems[index]);
            
            const quantity = parseFloat(newItems[index].quantity) || 0;
            if (value === 'pack' && stockItem?.pack_price) {
                newItems[index].total_price = (quantity * parseFloat(stockItem.pack_price)).toFixed(2);
            } else {
                newItems[index].total_price = (quantity * parseFloat(newItems[index].unit_price)).toFixed(2);
            }
        }

        if (field === 'quantity' || field === 'unit_price') {
            const quantity = parseFloat(value) || 0;
            
            if (newItems[index].unit_type === 'pack' && stockItem?.pack_price) {
                newItems[index].total_price = (quantity * parseFloat(stockItem.pack_price)).toFixed(2);
            } else {
                const unitPrice = field === 'unit_price' ? parseFloat(value) : parseFloat(newItems[index].unit_price);
                newItems[index].total_price = (quantity * (unitPrice || 0)).toFixed(2);
            }
            
            newItems[index].estimated_cost = calculateEstimatedCost(newItems[index]);
        }

        setFormData({ ...formData, items: newItems });
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
                    remainingStock: 0,
                    unit_type: 'pieces',
                    estimated_cost: 0
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

    const handleDateChange = (date, dateString) => {
        setFormData({ ...formData, sale_date: dateString });
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
        
        // Validation
        for (const item of formData.items) {
            if (!item.item_name || item.quantity === '' || !item.unit_price) {
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

        // Calculate total amount paid
        const totalAmountPaid = formData.payment_methods.reduce(
            (sum, payment) => sum + (parseFloat(payment.amount) || 0), 0
        );

        // Calculate balance according to business rules
        let balance;
        if (totalAmountPaid === 0) {
            // If amount is 0, balance equals the estimated cost
            balance = grandTotal;
        } else {
            // Otherwise balance is the difference between estimated cost and amount paid
            balance = Math.max(0, grandTotal - totalAmountPaid);
        }

        // Prepare data for submission with explicit balance
        const formDataToSubmit = { 
            ...formData,
            balance: balance, // Explicitly set the balance
            estimated_cost: grandTotal, // Include estimated_cost at root level
            total_amount_paid: totalAmountPaid, // Include total amount paid
            items: formData.items.map(item => {
                const stockItem = stockItems.find(si => si.item_name === item.item_name);
                return {
                    item_name: item.item_name,
                    quantity: item.unit_type === 'pack' && stockItem?.pack_quantity
                        ? parseFloat(item.quantity) * parseFloat(stockItem.pack_quantity)
                        : parseFloat(item.quantity),
                    metric: item.metric,
                    unit_price: parseFloat(item.unit_price),
                    total_price: parseFloat(item.total_price),
                    estimated_cost: parseFloat(item.estimated_cost) // Include estimated_cost per item
                };
            }),
            payment_methods: formData.payment_methods.map(payment => ({
                ...payment,
                amount: parseFloat(payment.amount),
                transaction_code: payment.transaction_code.trim() === "" ? "none" : payment.transaction_code
            }))
        };
    
        try {
            const response = await axios.post('https://kulima.co.ke/api/diraja/newsale', formDataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
    
            if (response.status === 201) {
                setMessageType('success');
                setMessage(response.data.message || 'Sale recorded successfully.');
    
                // Reset form after successful submission
                setFormData({
                    shop_id: localStorage.getItem('shop_id') || '',
                    customer_name: '',
                    customer_number: '',
                    status: '',
                    sale_date: dayjs().format('YYYY-MM-DD'), // Reset to current date
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
                        remainingStock: 0,
                        unit_type: 'pieces',
                        estimated_cost: 0
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

    const selectItem = (itemName) => {
        // Add the selected item to the items list
        const newItems = [...formData.items];
        const lastIndex = newItems.length - 1;
        
        // If the last item is empty, replace it, otherwise add a new one
        if (newItems[lastIndex].item_name === '') {
            newItems[lastIndex].item_name = itemName;
            setFormData({ ...formData, items: newItems });
            fetchItemDetails(lastIndex);
        } else {
            addItem();
            // Wait for state to update then set the item name
            setTimeout(() => {
                const updatedItems = [...formData.items, {
                    item_name: itemName,
                    quantity: '',
                    metric: '',
                    unit_price: '',
                    total_price: '',
                    BatchNumber: '',
                    stock_id: '',
                    remainingStock: 0,
                    unit_type: 'pieces',
                    estimated_cost: 0
                }];
                setFormData({ ...formData, items: updatedItems });
                fetchItemDetails(updatedItems.length - 1);
            }, 0);
        }
    };

    return (
        <div className="categorized-sale">
            <h1>Record Sales</h1>
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
                
                <h5>Select Category</h5>
                <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">Select Category</option>
                    {Object.keys(categorizedItems).map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                    ))}
                </select>
                
                {selectedCategory && categorizedItems[selectedCategory] && (
                    <div className="category-items">
                        <h6>Items in {selectedCategory}</h6>
                        <div className="item-buttons">
                            {categorizedItems[selectedCategory].map((item, index) => (
                                <button 
                                    key={index} 
                                    type="button"
                                    className="item-button"
                                    onClick={() => selectItem(item)}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <h5>Sold Items</h5>
                {formData.items.map((item, itemIndex) => {
                    const selectedStockItem = stockItems.find(stockItem => 
                        stockItem.item_name === item.item_name
                    );
                    
                    return (
                        <div key={itemIndex} className="item-row">
                            <div className="item-display">
                                <span className="item-name">{item.item_name || "Select an item"}</span>
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
                            
                            {item.item_name && (
                                <>
                                    <input 
                                        type="text" 
                                        name={`quantity_${itemIndex}`}
                                        value={item.quantity} 
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                                                handleItemChange(itemIndex, 'quantity', value);
                                            }
                                        }}
                                        placeholder="Quantity" 
                                    />
                                    
                                    <p className="estimated-cost">
                                        Estimated Cost: Ksh {item.estimated_cost.toFixed(2)}
                                    </p>
                                    
                                    <p className='quantity-level'>
                                        Remaining In Stock: {item.remainingStock.toFixed(2)} {item.metric}
                                    </p>
                                </>
                            )}
                        </div>
                    );
                })}
                
                <button 
                    type="button" 
                    onClick={addItem}
                    className="complimentary-button"
                >
                    Add Another Item
                </button>
                
                <div className="grand-total">
                    <h3> Estimate Total: {grandTotal.toFixed(2)}</h3>
                </div>
                
                <h5>Select date: </h5>
                <Form.Item>
                    <DatePicker 
                        style={{ width: '100%' }} 
                        value={formData.sale_date ? dayjs(formData.sale_date) : dayjs()}
                        onChange={handleDateChange}
                        format="YYYY-MM-DD"
                    />
                </Form.Item>
                
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

export default CategorizedShopSale;