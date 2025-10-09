import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/expenses.css';

const AllShopTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [stockItems, setStockItems] = useState([]);

  // List of items that should always use "kg" as metric
  const kgItems = [
    "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
    "liver", "gizzard", "neck", "feet", "wings", "broiler"
  ];

  // Helper: format quantity without trailing .00
  const formatNumber = (num, decimals = 3) => {
    return Number(num) % 1 === 0 ? Number(num).toString() : Number(num).toFixed(decimals);
  };

  // Process quantity display like ShopStockList
  const processQuantityDisplay = useCallback((itemname, quantity, metric, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    // Always use kg for specific items regardless of incoming metric
    const shouldUseKg = kgItems.some(kgItem => 
      itemname.toLowerCase().includes(kgItem.toLowerCase())
    );

    if (shouldUseKg) {
      return `${formatNumber(quantity)} kg`;
    }

    if (!itemInfo) {
      return `${formatNumber(quantity)} ${metric || "pcs"}`;
    }

    // Kgs stay as kgs
    if (metric && metric.toLowerCase() === "kgs") {
      return `${formatNumber(quantity)} kgs`;
    }

    // Eggs → trays + pieces
    const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return trays > 0
        ? `${formatNumber(trays, 0)} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces, 0)} pcs` : ""
          }`
        : `${formatNumber(pieces, 0)} pcs`;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(quantity / itemInfo.pack_quantity);
      const pieces = quantity % itemInfo.pack_quantity;
      return packets > 0
        ? `${formatNumber(packets, 0)} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces, 0)} pcs` : ""
          }`
        : `${formatNumber(pieces, 0)} pcs`;
    }

    // Fallback
    return `${formatNumber(quantity)} ${metric || "pcs"}`;
  }, []);

  // Fetch stock items for proper metric conversion
  const fetchStockItems = async () => {
    try {
      const response = await axios.get("api/diraja/stockitems", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      return response.data.stock_items || [];
    } catch (err) {
      console.error("Error fetching stock items:", err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        
        // Fetch both stock items and transfers in parallel
        const [items, transfersResponse] = await Promise.all([
          fetchStockItems(),
          axios.get('api/diraja/allstocktransfers', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        ]);

        setStockItems(items);
        
        // Process transfers with formatted quantity display
        const processedTransfers = transfersResponse.data.map(transfer => ({
          ...transfer,
          display_quantity: processQuantityDisplay(
            transfer.itemname, 
            transfer.quantity, 
            transfer.metric,
            items
          )
        }));

        setTransfers(processedTransfers);
      } catch (err) {
        setError('Failed to fetch transfers. Please try again.');
      }
    };

    fetchData();
  }, [processQuantityDisplay]);

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.itemname?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !selectedDate ||
      new Date(transfer.transfer_date).toLocaleDateString('en-CA') === selectedDate;

    return matchesSearch && matchesDate;
  });

  const columns = [
    {
      header: 'Date',
      key: 'transfer_date',
      render: (item) =>
        new Date(item.transfer_date).toLocaleDateString('en-CA')
    },
    { header: 'From Shop', key: 'from_shop_name' },
    { header: 'To Shop', key: 'to_shop_name' },
    { header: 'User', key: 'username' },
    { header: 'Item', key: 'itemname' },
    { 
      header: 'Qty', 
      key: 'display_quantity',
      render: (item) => item.display_quantity || `${item.quantity} ${item.metric || 'pcs'}`
    },
    { header: 'Status', key: 'status' },
    // { header: 'Note', key: 'decline_note' },
    { header: 'Batch', key: 'batch_number' },
  ];

  return (
    <div className="expenses-container">
      <h2>All Shop-to-Shop Transfers</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by shop, item, or user"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
      </div>

      <GeneralTableLayout
        data={filteredTransfers}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};

export default AllShopTransfers;