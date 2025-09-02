import React, { useState, useEffect } from 'react';
import axios from 'axios';


function NewsaleFormat() {
    const [availableItems, setAvailableItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('chicken');
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const shopId = localStorage.getItem('shop_id') || '';
                
                const response = await axios.get('/api/diraja/batches/available-by-shopv2', {
                    params: { shop_id: shopId },
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('access_token')}` 
                    },
                });
                
                setAvailableItems(response.data);
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

    // Categorize items
    const categorizeItems = (items) => {
        const chickenItems = items.filter(item => 
            item.toLowerCase().includes('chicken') || 
            item.toLowerCase().includes('thighs') ||
            item.toLowerCase().includes('gizzard') ||
            item.toLowerCase().includes('neck') ||
            item.toLowerCase().includes('feet') ||
            item.toLowerCase().includes('broiler') ||
            item.toLowerCase().includes('liver')
        );

        const eggItems = items.filter(item => 
            item.toLowerCase().includes('egg') || 
            item.toLowerCase().includes('kienyeji')
        );

        const farmersChoice = items.filter(item => 
            !chickenItems.includes(item) && !eggItems.includes(item)
        );

        return {
            chicken: chickenItems,
            eggs: eggItems,
            farmersChoice: farmersChoice
        };
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleSelectItem = (itemName) => {
        // Check if item is already selected
        if (!selectedItems.some(item => item.name === itemName)) {
            setSelectedItems(prev => [
                ...prev,
                { name: itemName, quantity: 1 }
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

    const handleRemoveItem = (index) => {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
    };

    const categories = categorizeItems(availableItems);
    const currentCategoryItems = categories[activeTab];

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

            {/* Items Container */}
            <div className="items-container">
                <h3 className="container-title">
                    {activeTab === 'chicken' ? 'Chicken Items' : 
                     activeTab === 'eggs' ? 'Egg Items' : 'Farmer\'s Choice Items'}
                </h3>
                
                <div className="items-grid">
                    {currentCategoryItems.length > 0 ? (
                        currentCategoryItems.map((item, index) => (
                            <div key={index} className="item-card">
                                <div className="item-name">{item}</div>
                                <button 
                                    className="select-item-btn"
                                    onClick={() => handleSelectItem(item)}
                                >
                                    Select Item
                                </button>
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

            

            {/* Selected Items List */}
            {selectedItems.length > 0 && (
                <div className="selected-items-container">
                    <h3 className="selected-items-title">Selected Items</h3>
                    <div className="selected-items-list">
                        {selectedItems.map((item, index) => (
                            <div key={index} className="selected-item">
                                <span className="selected-item-name">{item.name}</span>
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
                                    <button 
                                        className="remove-btn"
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Sale Summary */}
            {selectedItems.length > 0 && (
                <div className="sale-summary">
                    <h3 className="summary-title">Sale Summary</h3>
                    <div className="summary-items">
                        {selectedItems.map((item, index) => (
                            <div key={index} className="summary-item">
                                <span className="item-desc">{item.name} --- {item.quantity}kg</span>
                                <span className="item-price">500 Ksh</span>
                            </div>
                        ))}
                    </div>
                    <div className="summary-total">
                        <span>Total:</span>
                        <span className="total-amount">
                            {selectedItems.reduce((total, item) => total + (item.quantity * 500), 0)} Ksh
                        </span>
                    </div>
                </div>
            )}
            
        </div>
    );
}

export default NewsaleFormat;