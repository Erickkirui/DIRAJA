import React, { useEffect, useState } from 'react';
import '../Styles/shopstock.css';
import ExportExcel from '../Components/Download/ExportExcel'; // Correct import path
import DownloadPDF from '../Components/Download/DownloadPDF'; // Correct import path

const Shopstock = () => {
    const [shopStocks, setShopStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        const fetchShopStockData = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');

                if (!accessToken) {
                    setError('No access token found, please log in.');
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://16.171.22.129/diraja/shopstock', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch shop stock data');
                }

                const data = await response.json();
                setShopStocks(data.shop_stocks);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchShopStockData();
    }, []);

    // Filter shop stocks based on search query and selected date
    const filteredShopsStock = shopStocks.filter((stock) => {
        const matchesSearch = stock.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              stock.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              stock.shop_id.toString().includes(searchQuery);
        const matchesDate = !selectedDate || stock.date === selectedDate;
        return matchesSearch && matchesDate;
    });

    // Pagination logic
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
            {/* Search and Date Filter */}
            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Search by item, shop, or employee"
                    className="search-bar"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
            </div>
            <div className='actions-container' >
                <ExportExcel data={shopStocks} fileName="ShopstocksData" />
                <DownloadPDF tableId="shopStocks-table" fileName="ShopstocksData" />

            </div>
         
            {filteredShopsStock.length > 0 ? (
                <>
                    <table id="shopStocks-table" className="shopStocks-table">
                        <thead>
                            <tr>
                                <th>Stock ID</th>
                                <th>Shop Name</th>
                                <th>Item Name</th>
                                <th>Batch Number</th>
                                <th>Quantity</th>
                                <th>Total Cost</th>
                                <th>Unit Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStocks.map((stock) => (
                                <tr key={stock.stock_id}>
                                    <td>{stock.stock_id}</td>
                                    <td>{stock.shop_name}</td>
                                    <td>{stock.item_name}</td>
                                    <td>{stock.batchnumber}</td>
                                    <td>{stock.quantity} {stock.metric}</td>
                                    <td>{stock.total_cost}</td>
                                    <td>{stock.unitPrice}</td>
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
        </div>
    );
};

export default Shopstock;
