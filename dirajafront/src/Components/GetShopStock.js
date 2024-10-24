import React, { useEffect, useState } from 'react';
import '../Styles/shopstock.css';

const Shopstock = () => {
    const [shopStocks, setShopStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShopStockData = async () => {
            try {
                // Get the access token from localStorage
                const accessToken = localStorage.getItem('access_token');

                if (!accessToken) {
                    setError('No access token found, please log in.');
                    setLoading(false);
                    return;
                }

                // API call to get shop stock data with Authorization header
                const response = await fetch('/diraja/shopstock', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`, // Include the access token in the Authorization header
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch shop stock data');
                }

                const data = await response.json();
                setShopStocks(data.shop_stocks); // Assuming the response has a shop_stocks field
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchShopStockData();
    }, []); // Empty dependency array ensures the fetch runs only once

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Shop Stock List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Stock ID</th>
                        <th>Shop ID</th>
                        <th>Shop Name</th>
                        <th>Inventory ID</th>
                        <th>Item Name</th>
                        <th>Batch Number</th>
                        <th>Metric</th>
                        <th>Quantity</th>
                        <th>Total Cost</th>
                        <th>Unit Price</th>
                    </tr>
                </thead>
                <tbody>
                    {shopStocks.map((stock) => (
                        <tr key={stock.stock_id}>
                            <td>{stock.stock_id}</td>
                            <td>{stock.shop_id}</td>
                            <td>{stock.shop_name}</td>
                            <td>{stock.inventory_id}</td>
                            <td>{stock.item_name}</td>
                            <td>{stock.batchnumber}</td>
                            <td>{stock.metric}</td>
                            <td>{stock.quantity}</td>
                            <td>{stock.total_cost}</td>
                            <td>{stock.unitPrice}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Shopstock;