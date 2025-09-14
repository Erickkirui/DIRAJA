import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import PaymentMethods from '../PaymentMethod';
import { DatePicker } from 'antd';
import ItemQuantitySelector from './ItemQuantitySelector';
import '../../Styles/Newsaleformat.css';

function NewsaleFormat() {
    const [availableItems, setAvailableItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('chicken');
    const [selectedItems, setSelectedItems] = useState([]);
    
    // State for sale form
    const [formData, setFormData] = useState({
        shop_id: localStorage.getItem('shop_id') || '',
        customer_name: '',
        customer_number: '',
        status: '',
        sale_date: new Date().toISOString().split('T')[0],
        payment_methods: [{ method: '', amount: '', transaction_code: '' }],
        promocode: '',
        items: []
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);
    const [stockItems, setStockItems] = useState([]);

    const validPaymentMethods = ['bank', 'cash', 'mpesa', 'sasapay', 'not payed', 'sasapay deliveries'];

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const shopId = localStorage.getItem('shop_id') || '';
                
                const [batchesResponse, stockItemsResponse] = await Promise.all([
                    axios.get('api/diraja/batches/available-by-shopv2', {
                        params: { shop_id: shopId },
                        headers: { 
                            Authorization: `Bearer ${localStorage.getItem('access_token')}` 
                        },
                    }),
                    axios.get('api/diraja/stockitems', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                    })
                ]);
                
                setAvailableItems(batchesResponse.data);
                setStockItems(stockItemsResponse.data.stock_items || []);
                setError('');
            } catch (error) {
                console.error('Error fetching items:', error);
                setError('Error fetching items. Please try again.');
                setAvailableItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    // Calculate estimated cost function
    const calculateEstimatedCost = (item) => {
        const stockItem = stockItems.find(si => si.item_name === item.name);
        if (!stockItem) return 0;

        const quantity = parseFloat(item.quantity) || 0;
        
        if (item.unit_type === 'pack' && stockItem.pack_price) {
            return quantity * parseFloat(stockItem.pack_price);
        } else {
            return quantity * (parseFloat(stockItem.unit_price) || 0);
        }
    };

    // ADDED: Function to fetch item details including metric
    const fetchItemDetails = async (itemName) => {
        if (!itemName || !formData.shop_id) return null;

        try {
            const response = await axios.get('api/diraja/shop-itemdetailsv2', {
                params: {
                    item_name: itemName,
                    shop_id: formData.shop_id,
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
            });

            return response.data;
        } catch (error) {
            console.error(`Error fetching details for ${itemName}:`, error);
            return null;
        }
    };

    useEffect(() => {
        const total = selectedItems.reduce((sum, item) => {
            return sum + calculateEstimatedCost(item);
        }, 0);
        setGrandTotal(total);
        
        // Update formData items with proper structure including metric
        const updateFormDataItems = async () => {
            const formItems = await Promise.all(selectedItems.map(async (item) => {
                const stockItem = stockItems.find(si => si.item_name === item.name);
                const itemDetails = await fetchItemDetails(item.name);
                const estimatedCost = calculateEstimatedCost(item);
                
                return {
                    item_name: item.name,
                    quantity: item.quantity.toString(),
                    metric: itemDetails?.metric || stockItem?.metric || '', // Get metric from API or stock item
                    unit_price: stockItem ? (item.unit_type === 'pack' && stockItem.pack_price 
                        ? stockItem.pack_price 
                        : stockItem.unit_price) : '',
                    total_price: estimatedCost.toFixed(2),
                    BatchNumber: itemDetails?.BatchNumber || '',
                    stock_id: stockItem?.id || '',
                    remainingStock: itemDetails?.quantity || stockItem?.quantity || 0,
                    unit_type: item.unit_type || 'pieces',
                    estimated_cost: estimatedCost
                };
            }));
            
            setFormData(prev => ({
                ...prev,
                items: formItems
            }));
        };

        updateFormDataItems();
    }, [selectedItems, stockItems]);

    // Categorize items
    const categorizeItems = (items) => {
        const chickenItems = items.filter(item => {
            const lowerItem = item.toLowerCase();
            return (
                (lowerItem.includes('chicken') || 
                 lowerItem.includes('thighs') ||
                 lowerItem.includes('gizzard') ||
                 lowerItem.includes('neck') ||
                 lowerItem.includes('wings') ||
                 lowerItem.includes('big legs') ||
                 lowerItem.includes('back bone') ||
                 lowerItem.includes('boneless breast') ||
                 lowerItem.includes('feet') ||
                 lowerItem.includes('broiler') ||
                 lowerItem.includes('liver')) &&
                !lowerItem.includes('sausage') &&
                !lowerItem.includes('smokies') &&
                !lowerItem.includes('brawn')
            );
        });

        const eggItems = items.filter(item => {
            const lowerItem = item.toLowerCase();
            return (
                (lowerItem.includes('egg') || 
                 lowerItem.includes('kienyeji')) &&
                !lowerItem.includes('sausage') &&
                !lowerItem.includes('smokies') &&
                !lowerItem.includes('brawn')
            );
        });

        const farmersChoice = items.filter(item => {
            const lowerItem = item.toLowerCase();
            return (
                lowerItem.includes('sausage') ||
                lowerItem.includes('smokies') ||
                lowerItem.includes('brawn') ||
                (!chickenItems.includes(item) && !eggItems.includes(item))
            );
        });

        return {
            chicken: chickenItems,
            eggs: eggItems,
            farmersChoice: farmersChoice
        };
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleSelectItem = async (itemName) => {
        if (!selectedItems.some(item => item.name === itemName)) {
            const stockItem = stockItems.find(si => si.item_name === itemName);
            const itemDetails = await fetchItemDetails(itemName);
            
            setSelectedItems(prev => [
                ...prev,
                { 
                    name: itemName, 
                    quantity: 1,
                    unit_type: 'pieces',
                    metric: itemDetails?.metric || stockItem?.metric || '' // Get metric from API or stock item
                }
            ]);
        }
    };

    const handleQuantityChange = (index, newQuantity) => {
        if (newQuantity >= 0) {
            const updatedItems = [...selectedItems];
            updatedItems[index].quantity = newQuantity;
            setSelectedItems(updatedItems);
        }
    };

    const handleUnitTypeChange = (index, unitType) => {
        const updatedItems = [...selectedItems];
        updatedItems[index].unit_type = unitType;
        setSelectedItems(updatedItems);
    };

    const handleRemoveItem = (index) => {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
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
        
        // Validation
        for (const item of formData.items) {
            if (!item.item_name || item.quantity === '' || !item.unit_price) {
                setMessageType('error');
                setMessage('All items must have name, quantity, and unit price');
                setIsLoading(false);
                return;
            }
        }

        // Prepare data for submission with proper quantity calculation
        const formDataToSubmit = { 
            ...formData,
            items: formData.items.map(item => {
                const stockItem = stockItems.find(si => si.item_name === item.item_name);
                return {
                    item_name: item.item_name,
                    quantity: item.unit_type === 'pack' && stockItem?.pack_quantity
                        ? parseFloat(item.quantity) * parseFloat(stockItem.pack_quantity)
                        : parseFloat(item.quantity),
                    metric: item.metric, // This now comes from the API or stock item
                    unit_price: parseFloat(item.unit_price),
                    total_price: parseFloat(item.total_price)
                };
            }),
            payment_methods: formData.payment_methods.map(payment => ({
                ...payment,
                amount: parseFloat(payment.amount),
                transaction_code: payment.transaction_code.trim() === "" ? "none" : payment.transaction_code
            }))
        };
    
        try {
            const response = await axios.post('api/diraja/newsale', formDataToSubmit, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
    
            if (response.status === 201) {
                setMessageType('success');
                setMessage(response.data.message || 'Sale recorded successfully.');
    
                // Reset form after successful submission
                setSelectedItems([]);
                setFormData({
                    shop_id: localStorage.getItem('shop_id') || '',
                    customer_name: '',
                    customer_number: '',
                    status: '',
                    sale_date: new Date().toISOString().split('T')[0],
                    payment_methods: [{ method: '', amount: '', transaction_code: '' }],
                    promocode: '',
                    items: []
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

    const categories = categorizeItems(availableItems);
    const currentCategoryItems = categories[activeTab];

    // Check if payment status is not "paid"
    const showCustomerInputs = formData.status !== 'paid';

    if (loading) {
        return (
            <div className="newsale-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading items...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="newsale-container">
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    return (
        <div className="newsale-container">
            <h2 className="page-title">Record Sales</h2>
            
            {/* Category Filter Tabs */}
            <div className="category-filter">
                <p>Select Item category</p>
                <div className="category-tabs">
                    <button 
                        className={activeTab === 'chicken' ? 'tab-active' : 'tab'}
                        onClick={() => handleTabChange('chicken')}
                    >
                        Chicken ({categories.chicken.length})
                    </button>
                    <button 
                        className={activeTab === 'eggs' ? 'tab-active' : 'tab'}
                        onClick={() => handleTabChange('eggs')}
                    >
                        Eggs ({categories.eggs.length})
                    </button>
                    <button 
                        className={activeTab === 'farmersChoice' ? 'tab-active' : 'tab'}
                        onClick={() => handleTabChange('farmersChoice')}
                    >
                        Farmer's Choice ({categories.farmersChoice.length})
                    </button>
                </div>
            </div>

            <div className="sales-process-flow">
                {/* Step 1: Filtered Items */}
                <div className="process-step">
                    <h3 className="step-title">
                        {activeTab === 'chicken' ? 'Chicken Items' : 
                         activeTab === 'eggs' ? 'Egg Items' : 'Farmer\'s Choice Items'}
                    </h3>
                    
                   <div className="items-grid">
                        {currentCategoryItems.length > 0 ? (
                            currentCategoryItems.map((item, index) => (
                            <div 
                                key={index} 
                                className="item-card"
                                onClick={() => handleSelectItem(item)}
                            >
                                <div className="item-name">{item}</div>
                            </div>
                            ))
                        ) : (
                            <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <p>No items available in this category</p>
                            </div>
                        )}
                        </div>

                </div>

                {/* Step 2: Selected Items */}
                {selectedItems.length > 0 && (
                    <div className="process-step">
                        <h3 className="step-title">Selected Items</h3>
                        <div className="selected-items-list">
                            {selectedItems.map((item, index) => {
                                const stockItem = stockItems.find(si => si.item_name === item.name);
                                const formItem = formData.items[index] || {};
                                return (
                                    <div key={index} className="selected-item">
                                        <span className="selected-item-name">{item.name}</span>
                                        
                                        {stockItem && stockItem.pack_quantity ? (
                                            <ItemQuantitySelector
                                                selectedItemId={stockItem.id}
                                                onQuantityChange={(quantity) => handleQuantityChange(index, quantity)}
                                                onUnitTypeChange={(unitType) => handleUnitTypeChange(index, unitType)}
                                                initialQuantity={item.quantity}
                                                initialUnitType={item.unit_type}
                                            />
                                        ) : (
                                            <div className="quantity-controls">
                                                <button 
                                                    className="quantity-btn"
                                                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                                    className="quantity-input"
                                                />
                                                <button 
                                                    className="quantity-btn"
                                                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                        
                                        <button 
                                            className="remove-btn"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 3: Sale Summary */}
                {selectedItems.length > 0 && (
                    <div className="process-step">
                        <h3 className="step-title">Sale Summary</h3>
                        <div className="sale-summary">
                            <div className="summary-items">
                                {formData.items.map((item, index) => {
                                    const stockItem = stockItems.find(si => si.item_name === item.item_name);
                                    const estimatedCost = calculateEstimatedCost({name: item.item_name, quantity: item.quantity, unit_type: item.unit_type});
                                    return (
                                        <div key={index} className="summary-item">
                                            <span className="item-desc">
                                                {item.item_name} - {item.quantity} 
                                                {item.unit_type === 'pack' && stockItem?.pack_quantity && 
                                                ` (${item.quantity * stockItem.pack_quantity} piece${item.quantity * stockItem.pack_quantity > 1 ? 's' : ''})`
                                                }
                                                {item.unit_type !== 'pack' && item.metric && 
                                                    ` (${item.metric})`
                                                }
                                            </span>
                                            <span className="item-price">{estimatedCost.toFixed(2)} Ksh</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="summary-total">
                                <span>Total:</span>
                                <span className="total-amount">{grandTotal.toFixed(2)} Ksh</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Complete Sale Form */}
                {selectedItems.length > 0 ? (
                    <div className="process-step">
                        <h3 className="step-title">Complete Sale</h3>
                        
                        <form onSubmit={handleSubmit} className="sale-form">
                            {/* Auto-filled date field */}
                            <div className="form-group">
                                <label>Sale Date</label>
                                <input 
                                    type="date"
                                    value={formData.sale_date}
                                    className="bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Payment Status</label>
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
                            </div>
                            
                            {/* Conditionally show customer inputs */}
                            {showCustomerInputs && (
                                <>
                                    <div className="form-group">
                                        <label>Customer Name</label>
                                        <input 
                                            name="customer_name" 
                                            value={formData.customer_name} 
                                            onChange={handleChange} 
                                            placeholder="Customer Name" 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Customer Number (optional)</label>
                                        <input 
                                            name="customer_number" 
                                            value={formData.customer_number} 
                                            onChange={handleChange} 
                                            placeholder="Customer Number" 
                                        />
                                    </div>
                                </>
                            )}
                            
                            <PaymentMethods
                                paymentMethods={formData.payment_methods}
                                validPaymentMethods={validPaymentMethods}
                                handlePaymentChange={handlePaymentChange}
                                addPaymentMethod={addPaymentMethod}
                                removePaymentMethod={removePaymentMethod}
                                totalAmount={grandTotal}
                            />
                            
                            <div className="form-group">
                                <label>Promo Code (optional)</label>
                                <input 
                                    name="promocode" 
                                    type="text" 
                                    value={formData.promocode} 
                                    onChange={handleChange} 
                                    placeholder="Enter promocode" 
                                />
                            </div>
                            
                            <div className="form-buttons">
                                <button 
                                    type="button" 
                                    className="clear-btn"
                                    onClick={() => setSelectedItems([])}
                                >
                                    Clear Items
                                </button>
                                <button 
                                    type="submit" 
                                    className="submit-sale-btn" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : 'Complete Sale'}
                                </button>
                            </div>
                            
                            {message && (
                                <Stack style={{ marginTop: '15px' }}>
                                    <Alert severity={messageType} variant="outlined">
                                        {message}
                                    </Alert>
                                </Stack>
                            )}
                        </form>
                    </div>
                ) : (
                    <div className="empty-sale-form">
                        <div className="empty-form-icon">🛒</div>
                        <h3>Your sale items will appear here</h3>
                        <p>Select items from the categories to start recording a sale</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewsaleFormat;