import React, { useEffect, useState } from 'react';
import '../Styles/shopstock.css';
import ExportExcel from '../Components/Download/ExportExcel'; // Ensure correct import path
import DownloadPDF from '../Components/Download/DownloadPDF'; // Ensure correct import path

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Deletion</h2>
                <p>Are you sure you want to delete the selected shop stocks?</p>
                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="confirm-button" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const Shopstock = () => {
    const [shopStocks, setShopStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState('');
    const [editingUnitPrice, setEditingUnitPrice] = useState(null);
    const [newUnitPrice, setNewUnitPrice] = useState('');
    const itemsPerPage = 50;

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    useEffect(() => {
        const fetchShopStockData = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');

                if (!accessToken) {
                    setError('No access token found, please log in.');
                    setLoading(false);
                    return;
                }

                const response = await fetch('/api/diraja/shopstock', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch shop stock data');
                }

                const data = await response.json();

                // Sort the data in descending order by stock_id
                const sortedData = data.shop_stocks.sort((a, b) => b.stock_id - a.stock_id);

                setShopStocks(sortedData);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchShopStockData();
    }, []);

    const handleBulkDelete = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const deletePromises = selectedStocks.map((stockId) =>
                fetch(`/api/diraja/deleteshopstock/${stockId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            await Promise.all(deletePromises);

            // Remove the deleted stocks from the state
            setShopStocks((prevStocks) => prevStocks.filter((stock) => !selectedStocks.includes(stock.stock_id)));
            setSelectedStocks([]); // Clear selected items
            alert('Selected shop stocks deleted successfully');
        } catch (error) {
            alert(`Error deleting shop stocks: ${error.message}`);
        }
    };

    const handleUnitPriceUpdate = async (stockId) => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await fetch(`/api/diraja/shopstock/${stockId}/update-unitprice`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ unitPrice: newUnitPrice }),
            });

            if (!response.ok) {
                throw new Error('Failed to update unit price');
            }

            const updatedStock = await response.json();
            setShopStocks((prevStocks) =>
                prevStocks.map((stock) =>
                    stock.stock_id === stockId ? { ...stock, unitPrice: newUnitPrice } : stock
                )
            );
            setEditingUnitPrice(null);
            setNewUnitPrice('');
            alert('Unit price updated successfully');
        } catch (error) {
            alert(`Error updating unit price: ${error.message}`);
        }
    };

    const toggleSelectStock = (stockId) => {
        setSelectedStocks((prevSelected) =>
            prevSelected.includes(stockId)
                ? prevSelected.filter((id) => id !== stockId)
                : [...prevSelected, stockId]
        );
    };

    const filteredShopsStock = shopStocks.filter((stock) => {
        const matchesSearch = stock.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.shop_id.toString().includes(searchQuery);
        const matchesDate = !selectedDate || stock.date === selectedDate;
        return matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredShopsStock.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStocks = filteredShopsStock.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="shopStocks-container">

            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Search by itemname or shopname"
                    className="search-bar"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                <input
                    type="date"
                    className="date-picker"
                    value={selectedDate}
                    onChange={handleDateChange}
                />
            </div>
            {/* Action Dropdown */}
            <div className="actions-container">
                <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="action-dropdown"
                >
                    <option value="">Select action</option>
                    <option value="edit-price">Edit Unit Price</option>
                    <option value="delete">Delete Selected</option>
                </select>

                {selectedAction === 'edit-price' && (
                    <div className="edit-price-form">
                        <input
                            type="number"
                            value={newUnitPrice}
                            onChange={(e) => setNewUnitPrice(e.target.value)}
                            placeholder="Enter new unit price"
                        />
                        <button
                            onClick={() =>
                                selectedStocks.forEach((stockId) => handleUnitPriceUpdate(stockId))
                            }
                            disabled={newUnitPrice === ''}
                        >
                            Update Unit Price
                        </button>
                    </div>
                )}

                {selectedAction === 'delete' && (
                    <button onClick={() => setIsModalOpen(true)} disabled={selectedStocks.length === 0}>
                        Delete Selected
                    </button>
                )}

                <ExportExcel data={shopStocks} fileName="ShopstocksData" />
                <DownloadPDF tableId="shopStocks-table" fileName="ShopstocksData" />
            </div>

            {filteredShopsStock.length > 0 ? (
                <>
                    <table id="shopStocks-table" className="shopStocks-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={(e) =>
                                            setSelectedStocks(
                                                e.target.checked
                                                    ? filteredShopsStock.map((stock) => stock.stock_id)
                                                    : []
                                            )
                                        }
                                        checked={selectedStocks.length === filteredShopsStock.length && filteredShopsStock.length > 0}
                                    />
                                </th>
                                <th>Stock ID</th>
                                <th>Shop Name</th>
                                <th>Item Name</th>
                                <th>Batch Number</th>
                                <th>Quantity</th>
                                <th>Unit Price (ksh)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStocks.map((stock) => (
                                <tr key={stock.stock_id} className={stock.quantity === 0 ? 'faint-row' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedStocks.includes(stock.stock_id)}
                                            onChange={() => toggleSelectStock(stock.stock_id)}
                                        />
                                    </td>
                                    <td>{stock.stock_id}</td>
                                    <td>{stock.shop_name}</td>
                                    <td>{stock.item_name}</td>
                                    <td>{stock.batchnumber}</td>
                                    <td>{stock.quantity} {stock.metric}</td>
                                    <td>
                                        {editingUnitPrice === stock.stock_id ? (
                                            <input
                                                type="number"
                                                value={newUnitPrice}
                                                onChange={(e) => setNewUnitPrice(e.target.value)}
                                                placeholder="Enter new unit price"
                                            />
                                        ) : (
                                            stock.unitPrice
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <p>No shop stocks found.</p>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleBulkDelete}
            />
        </div>
    );
};

export default Shopstock;
