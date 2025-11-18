import React, { useEffect, useState } from 'react';
import '../../Styles/shopstock.css';
import LoadingAnimation from '../LoadingAnimation';
import ActionsDropdown from '../SystemStock/ActionsDropdown';
import GeneralTableLayout from '../GeneralTableLayout';

const ShopStockV2 = () => {
    const [shopStocks, setShopStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [stockItems, setStockItems] = useState([]); // Added for stock items metadata

    useEffect(() => {
        const fetchShopStockData = async () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                if (!accessToken) {
                    setError('No access token found, please log in.');
                    setLoading(false);
                    return;
                }
                
                // Fetch shop stock data
                const response = await fetch('api/diraja/shopstockv2', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch shop stock data');
                const data = await response.json();

                // Fetch stock items metadata
                const itemsResponse = await fetch('api/diraja/stockitems', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!itemsResponse.ok) throw new Error('Failed to fetch stock items');
                const itemsData = await itemsResponse.json();
                const stockItemsData = itemsData.stock_items || [];
                setStockItems(stockItemsData);

                // Apply display formatting to shop stocks
                const processedStocks = data.shop_stocks.map((stock) => {
                    const itemInfo = stockItemsData.find(
                        (item) => item.item_name === stock.itemname
                    );

                    if (!itemInfo) {
                        return {
                            ...stock,
                            display: `${stock.quantity} ${stock.metric || "pcs"}`,
                        };
                    }

                    // Format display for quantity
                    const display = formatQuantityDisplay(stock.quantity, stock.metric, itemInfo);

                    return {
                        ...stock,
                        display: display,
                    };
                });

                setShopStocks(processedStocks.sort((a, b) => b.stockv2_id - a.stockv2_id));
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchShopStockData();
    }, []);

    // Helper function to format quantity display
    const formatQuantityDisplay = (quantity, metric, itemInfo) => {
        // If metric is kgs, display directly
        if (metric && metric.toLowerCase() === "kgs") {
            return `${quantity} kgs`;
        }

        // Eggs logic → trays and pieces
        if (
            itemInfo.item_name.toLowerCase().includes("eggs") &&
            (itemInfo.pack_quantity > 0 || !itemInfo.pack_quantity)
        ) {
            const packQty =
                itemInfo.pack_quantity && itemInfo.pack_quantity > 0
                    ? itemInfo.pack_quantity
                    : 30; // default tray size
            const trays = Math.floor(quantity / packQty);
            const pieces = quantity % packQty;
            return trays > 0
                ? `${trays} tray${trays !== 1 ? "s" : ""}${
                    pieces > 0 ? `, ${pieces} pcs` : ""
                  }`
                : `${pieces} pcs`;
        }

        // Other items with pack_quantity → pkts and pcs
        if (itemInfo.pack_quantity > 0) {
            const packets = Math.floor(quantity / itemInfo.pack_quantity);
            const pieces = quantity % itemInfo.pack_quantity;
            return packets > 0
                ? `${packets} pkt${packets !== 1 ? "s" : ""}${
                    pieces > 0 ? `, ${pieces} pcs` : ""
                  }`
                : `${pieces} pcs`;
        }

        // Default
        return `${quantity} ${metric || "pcs"}`;
    };

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
        },
        {
            header: 'Value',
            key: 'total_cost',
            render: (stock) => `Ksh ${stock.total_cost ?? ''}`
        },

        {
            header: 'Quantity',
            key: 'quantity',
            render: (stock) => stock.display || `${stock.quantity} ${stock.metric}`
        },
        // {
        //     header: 'Unit Price (ksh)',
        //     key: 'unitPrice',
        //     render: (stock) => stock.unitPrice
        // }
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