import React, { useState, useEffect } from 'react';

const StockTransfer = ({ isOpen, onClose, selectedStocks }) => {
    const [targetShop, setTargetShop] = useState('');
    const [transferQuantity, setTransferQuantity] = useState('');
    const [availableShops, setAvailableShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fromShopId = localStorage.getItem('shop_id'); // Get shop_id from local storage

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const response = await fetch('/api/diraja/allshops', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch shops');
                }

                const data = await response.json();
                setAvailableShops(data);
            } catch (err) {
                setError(err.message);
            }
        };

        if (isOpen) {
            fetchShops();
        }
    }, [isOpen]);

    const handleTransfer = async () => {
        if (!targetShop || !transferQuantity || selectedStocks.length === 0) {
            alert("Please select a target shop, enter quantity, and select at least one stock item.");
            return;
        }

        if (!fromShopId) {
            alert("Source shop ID is missing.");
            return;
        }

        setLoading(true);

        try {
            const accessToken = localStorage.getItem('access_token');
            const transferData = selectedStocks.map((stockId) => ({
                stock_id: stockId,
                from_shop_id: fromShopId, // Added source shop ID
                to_shop_id: targetShop,   // Destination shop ID
                quantity: parseFloat(transferQuantity),
            }));

            console.log("Sending transfer data:", JSON.stringify(transferData, null, 2));

            const response = await fetch('/api/diraja/transfer', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transferData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to transfer stock');
            }

            alert('Stock transferred successfully');
            setTransferQuantity('');
            setTargetShop('');
            onClose();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Stock Transfer</h2>
                <p>Selected Stock: {selectedStocks?.join(', ') || 'None'}</p>

                {error && <p className="error-message">{error}</p>}

                <label>Select Target Shop:</label>
                <select value={targetShop} onChange={(e) => setTargetShop(e.target.value)}>
                    <option value="">Select a shop</option>
                    {availableShops.map((shop) => (
                        <option key={shop.shop_id} value={shop.shop_id}>
                            {shop.shopname}
                        </option>
                    ))}
                </select>

                <label>Transfer Quantity:</label>
                <input
                    type="number"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(e.target.value)}
                    placeholder="Enter quantity"
                />

                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button className="confirm-button" onClick={handleTransfer} disabled={loading}>
                        {loading ? 'Transferring...' : 'Transfer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockTransfer;
