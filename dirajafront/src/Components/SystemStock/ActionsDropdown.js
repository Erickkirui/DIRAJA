import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ActionsDropdown = ({ shopStocks, setShopStocks, selectedStocks, setSelectedStocks }) => {
    const [selectedAction, setSelectedAction] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [newUnitPrice, setNewUnitPrice] = useState('');
    const [editingStockId, setEditingStockId] = useState(null);
    const [allShops, setAllShops] = useState([]);
    const [toShopId, setToShopId] = useState('');
    const [transferQuantity, setTransferQuantity] = useState('');

    // Fetch all shops
    useEffect(() => {
        const fetchShops = async () => {
            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                alert('Access token is missing. Please log in again.');
                return;
            }

            try {
                const response = await axios.get('/api/diraja/allshops', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setAllShops(response.data);
            } catch (error) {
                console.error('Error fetching shops:', error.response?.data?.error || error.message);
            }
        };

        fetchShops();
    }, []);

    // Handle bulk delete
    const handleBulkDelete = async () => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            alert('Access token is missing. Please log in again.');
            return;
        }

        try {
            await Promise.all(
                selectedStocks.map((stockId) =>
                    axios.delete(`/api/diraja/deleteshopstock/${stockId}`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                )
            );

            setShopStocks(shopStocks.filter(stock => !selectedStocks.includes(stock.stock_id)));
            setSelectedStocks([]);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(`Error deleting shop stocks: ${error.response?.data?.error || error.message}`);
        }
    };

    // Handle unit price update
    const handleUnitPriceUpdate = async () => {
        if (!editingStockId || newUnitPrice.trim() === '') {
            alert('Please enter a valid unit price.');
            return;
        }

        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            alert('Access token is missing. Please log in again.');
            return;
        }

        try {
            await axios.put(`/api/diraja/shopstock/${editingStockId}/update-unitprice`, 
                { unitPrice: newUnitPrice },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            setShopStocks((prevStocks) =>
                prevStocks.map((stock) =>
                    stock.stock_id === editingStockId ? { ...stock, unitPrice: newUnitPrice } : stock
                )
            );

            setIsEditModalOpen(false);
            setNewUnitPrice('');
            setEditingStockId(null);
            alert('Unit price updated successfully');
        } catch (error) {
            alert(`Error updating unit price: ${error.response?.data?.error || error.message}`);
        }
    };

    // Handle stock transfer
    const handleStockTransfer = async () => {
        if (selectedStocks.length !== 1) {
            alert('Please select one stock item to transfer.');
            return;
        }

        const stock = shopStocks.find(s => s.stock_id === selectedStocks[0]);
        if (!stock) {
            alert('Selected stock not found.');
            return;
        }

        if (!toShopId || !transferQuantity || transferQuantity <= 0) {
            alert('Please select a destination shop and enter a valid quantity.');
            return;
        }

        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            alert('Access token is missing. Please log in again.');
            return;
        }

        try {
            await axios.post('/api/diraja/transfer-system-stock', 
                {
                    from_shop_id: stock.shop_id,
                    to_shop_id: toShopId,
                    stock_id: stock.stock_id,
                    quantity: parseInt(transferQuantity, 10),
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            
            setShopStocks(shopStocks.map(s => 
                s.stock_id === stock.stock_id 
                    ? { ...s, quantity: s.quantity - transferQuantity } 
                    : s
            ));

            setIsTransferModalOpen(false);
            setToShopId('');
            setTransferQuantity('');
        } catch (error) {
            alert(`Error transferring stock: ${error.response?.data?.error || error.message}`);
        }
    };

    // Handle dropdown selection
    const handleActionChange = (e) => {
        const value = e.target.value;
        setSelectedAction(value);

        if (value === 'delete') {
            setIsDeleteModalOpen(true);
        } else if (value === 'edit-price') {
            if (selectedStocks.length !== 1) {
                alert('Please select only one item to edit its unit price.');
                return;
            }
            setEditingStockId(selectedStocks[0]);
            setIsEditModalOpen(true);
        } else if (value === 'transfer-stock') {
            if (selectedStocks.length !== 1) {
                alert('Please select one stock item to transfer.');
                return;
            }
            setIsTransferModalOpen(true);
        }
    };

    return (
        <div className="actions-container">
            <select value={selectedAction} onChange={handleActionChange} className="action-dropdown">
                <option value="">Select action</option>
                <option value="delete">Delete Selected</option>
                <option value="edit-price">Edit Unit Price</option>
                <option value="transfer-stock">Transfer Stock</option>
            </select>

            <ExportExcel data={selectedStocks} fileName="ShopstocksData" />
            <DownloadPDF tableId="shopStocks-table" fileName="ShopstocksData" />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
            />

            {/* Edit Unit Price Modal */}
            {isEditModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Edit Unit Price</h3>
                        <input
                            type="number"
                            value={newUnitPrice}
                            onChange={(e) => setNewUnitPrice(e.target.value)}
                            placeholder="Enter new unit price"
                        />
                        <div className="modal-actions">
                            <button onClick={handleUnitPriceUpdate}>Update</button>
                            <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Stock Modal */}
            {isTransferModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Transfer Stock</h3>
                        <select value={toShopId} onChange={(e) => setToShopId(e.target.value)}>
                            <option value="">Select Destination Shop</option>
                            {allShops.map((shop) => (
                                <option key={shop.shop_id} value={shop.shop_id}>
                                    {shop.shopname}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Enter quantity"
                            value={transferQuantity}
                            onChange={(e) => setTransferQuantity(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button onClick={handleStockTransfer}>Transfer</button>
                            <button onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionsDropdown;
