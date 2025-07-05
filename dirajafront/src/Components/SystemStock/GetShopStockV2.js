import React, { useEffect, useState } from 'react';
import '../../Styles/shopstock.css';
import LoadingAnimation from '../LoadingAnimation';
import ActionsDropdown from './ActionsDropdown';
import GeneralTableLayout from '../GeneralTableLayout';

const ShopStockV2 = () => {
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
                const response = await fetch('/api/diraja/shopstockv2', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch shop stock data');

                const data = await response.json();

                setShopStocks(data.shop_stocks.sort((a, b) => b.stockv2_id - a.stockv2_id));

                setShopStocks(data.shop_stocks_v2.sort((a, b) => b.stockv2_id - a.stockv2_id));

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
                stock.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stock.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stock.shop_id.toString().includes(searchQuery);
            const matchesDate = !selectedDate || stock.date === selectedDate;
            return matchesSearch && matchesDate;
        })
        .sort((a, b) => {
            // Move zero quantity items to the bottom
            if (a.quantity === 0 && b.quantity !== 0) return 1;
            if (a.quantity !== 0 && b.quantity === 0) return -1;
            // Maintain original sorting (by stockv2_id) for others
            return b.stockv2_id - a.stockv2_id;
        });

    // Define columns for GeneralTableLayout
    const columns = [
        {
            header: (
                <input
                    type="checkbox"
                    onChange={(e) =>
                        setSelectedStocks(
                            e.target.checked ? filteredShopsStock.map((stock) => stock.stockv2_id) : []
                        )
                    }
                    checked={selectedStocks.length === filteredShopsStock.length && filteredShopsStock.length > 0}
                />
            ),
            key: 'select',
            render: (stock) => (
                <input
                    type="checkbox"
                    checked={selectedStocks.includes(stock.stockv2_id)}
                    onChange={() =>
                        setSelectedStocks((prev) =>
                            prev.includes(stock.stockv2_id)
                                ? prev.filter((id) => id !== stock.stockv2_id)
                                : [...prev, stock.stockv2_id]
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
            key: 'itemname',
            render: (stock) => stock.itemname
        },
        {
            header: 'Batch Number',

            key: 'batchnumber',
            render: (stock) => stock.batchnumber

            key: 'BatchNumber',
            render: (stock) => stock.BatchNumber

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
            <h2>System stock V2</h2>
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
                isV2={true}
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

export default ShopStockV2;