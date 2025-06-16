import React, { useEffect, useState } from 'react';
import '../../Styles/shopstock.css';
import LoadingAnimation from '../LoadingAnimation';
import ActionsDropdown from './ActionsDropdown';
import GeneralTableLayout from '../GeneralTableLayout';

const Shopstock = () => {
    const [shopStocks, setShopStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

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

                if (!response.ok) throw new Error('Failed to fetch shop stock data');

                const data = await response.json();
                setShopStocks(data.shop_stocks.sort((a, b) => b.stock_id - a.stock_id));
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchShopStockData();
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const filteredShopsStock = shopStocks
        .filter((stock) => {
            const matchesSearch =
                stock.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stock.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stock.shop_id.toString().includes(searchQuery);
            const matchesDate = !selectedDate || stock.date === selectedDate;
            return matchesSearch && matchesDate;
        })
        .sort((a, b) => {
            // Move zero quantity items to the bottom
            if (a.quantity === 0 && b.quantity !== 0) return 1;
            if (a.quantity !== 0 && b.quantity === 0) return -1;
            // Maintain original sorting (by stock_id) for others
            return b.stock_id - a.stock_id;
        });

    // Define columns for GeneralTableLayout
    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    onChange={(e) =>
                        setSelectedStocks(
                            e.target.checked ? filteredShopsStock.map((stock) => stock.stock_id) : []
                        )
                    }
                    checked={selectedStocks.length === filteredShopsStock.length && filteredShopsStock.length > 0}
                />
            ),
            key: 'select',
            render: (stock) => (
                <input
                    type="checkbox"
                    checked={selectedStocks.includes(stock.stock_id)}
                    onChange={() =>
                        setSelectedStocks((prev) =>
                            prev.includes(stock.stock_id)
                                ? prev.filter((id) => id !== stock.stock_id)
                                : [...prev, stock.stock_id]
                        )
                    }
                />
            )
        },
        {
            header: 'Shop Name',
            key: 'shop_name',
            render: (stock) => stock.shop_name
        },
        {
            header: 'Item Name',
            key: 'item_name',
            render: (stock) => stock.item_name
        },
        {
            header: 'Batch Number',
            key: 'batchnumber',
            render: (stock) => stock.batchnumber
        },
        {
            header: 'Quantity',
            key: 'quantity',
            render: (stock) => `${stock.quantity} ${stock.metric}`
        },
        {
            header: 'Unit Price (ksh)',
            key: 'unitPrice',
            render: (stock) => stock.unitPrice
        }
    ];

    if (loading) return <LoadingAnimation />;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="shopStocks-container">
            <h2>System stock</h2>
            {/* Search & Filter */}
            <div className="filter-container">
                <input
                    type="text"
                    placeholder="Search by item name or shop name"
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

            {/* Actions Dropdown */}
            <ActionsDropdown
                shopStocks={shopStocks}
                setShopStocks={setShopStocks}
                selectedStocks={selectedStocks}
                setSelectedStocks={setSelectedStocks}
            />

            {/* Table */}
            <GeneralTableLayout 
                data={filteredShopsStock} 
                columns={columns}
                rowClassName={(stock) => stock.quantity === 0 ? 'zero-quantity' : ''}
            />
        </div>
    );
};

export default Shopstock;