// src/components/StockItemsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/GeneralTableLayout.css';

const StockItemsList = () => {
  const [stockItems, setStockItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStockItems = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('User is not authenticated');
        return;
      }

      try {
        const response = await axios.get('/api/diraja/stockitems', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 200) {
          setStockItems(response.data.stock_items || []);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          setError(error.response.data.message);
        } else {
          setError('An error occurred while fetching stock items');
        }
      }
    };

    fetchStockItems();
  }, []);

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Item Name', key: 'item_name' },
    { header: 'Item Code', key: 'item_code' },
    { header: 'Unit Price', key: 'unit_price', format: (value) => `$${value?.toFixed(2) || '0.00'}` },
    { header: 'Pack Price', key: 'pack_price', format: (value) => `$${value?.toFixed(2) || '0.00'}` },
    { header: 'Pack Quantity', key: 'pack_quantity' },
  ];

  return (
    <div className="stock-items-list">
      {error && <p className="error-message">{error}</p>}
      {!error && (
        <GeneralTableLayout 
          data={stockItems} 
          columns={columns} 
          tableTitle="Stock Items"
          emptyMessage="No stock items available"
        />
      )}
    </div>
  );
};

export default StockItemsList;