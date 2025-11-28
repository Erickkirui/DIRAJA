import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import GeneralTableLayout from '../GeneralTableLayout';
import LoadingAnimation from '../LoadingAnimation';

const SpoiltStockTable = () => {
  const [spoiltStock, setSpoiltStock] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [stockItems, setStockItems] = useState([]);

  // List of items that should always use "kg" as metric
  const kgItems = [
    "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
    "liver", "gizzard", "neck", "feet", "wings", "broiler"
  ];

  useEffect(() => {
    const fetchSpoiltStock = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        // Fetch both spoilt stock and stock items in parallel
        const [spoiltResponse, itemsResponse] = await Promise.all([
          axios.get('api/diraja/allspoilt', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get('api/diraja/stockitems', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        ]);

        const stockItemsData = itemsResponse.data.stock_items || [];
        setStockItems(stockItemsData);

        // Process spoilt stock data with proper quantity display
        const processedSpoilt = spoiltResponse.data.map((entry) => ({
          ...entry,
          displayQuantity: formatQuantityDisplay(entry.item, entry.quantity, entry.unit, stockItemsData),
          formattedDate: new Date(entry.created_at).toLocaleDateString(),
          employeeInitial: entry.username ? entry.username.charAt(0).toUpperCase() : '?',
          employeeFirstName: entry.username ? entry.username.split(' ')[0] : 'Unknown'
        }));

        setSpoiltStock(processedSpoilt);
      } catch (err) {
        setError('Error fetching spoilt stock. Please try again.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpoiltStock();
  }, []);

  // Helper: format quantity without trailing .00
  const formatNumber = (num, decimals = 3) => {
    return Number(num) % 1 === 0 ? Number(num).toString() : Number(num).toFixed(decimals);
  };

  // Process quantity display like ShopStockList
  const formatQuantityDisplay = (itemname, quantity, unit, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    // Always use kg for specific items regardless of incoming unit
    const shouldUseKg = kgItems.some(kgItem => 
      itemname.toLowerCase().includes(kgItem.toLowerCase())
    );

    if (shouldUseKg) {
      return `${formatNumber(quantity)} kg`;
    }

    if (!itemInfo) {
      return `${formatNumber(quantity)} ${unit || "pcs"}`;
    }

    // Kgs stay as kgs
    if (unit && unit.toLowerCase() === "kgs") {
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
    return `${formatNumber(quantity)} ${unit || "pcs"}`;
  };

  const filteredSpoilt = spoiltStock.filter((entry) => {
    const item = entry.item?.toLowerCase() || '';
    const collector = entry.collector_name?.toLowerCase() || '';
    const user = entry.username?.toLowerCase() || '';
    const shop = entry.shop_name?.toLowerCase() || '';

    const matchesSearch =
      item.includes(searchQuery.toLowerCase()) ||
      collector.includes(searchQuery.toLowerCase()) ||
      user.includes(searchQuery.toLowerCase()) ||
      shop.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(entry.created_at).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  // Define columns for GeneralTableLayout
  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (entry) => (
        <div className="employee-info">
          <div className="employee-icon">{entry.employeeInitial}</div>
          <span className="employee-name">{entry.employeeFirstName}</span>
        </div>
      )
    },
    {
      header: 'Shop Name',
      key: 'shop_name',
      render: (entry) => entry.shop_name
    },
    {
      header: 'Item',
      key: 'item',
      render: (entry) => entry.item
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (entry) => entry.displayQuantity || `${formatNumber(entry.quantity)} ${entry.unit}`
    },
    {
      header: 'Disposal Method',
      key: 'disposal_method',
      render: (entry) => entry.disposal_method
    },
    {
      header: 'Collector Name',
      key: 'collector_name',
      render: (entry) => entry.collector_name
    },
    {
      header: 'Comment',
      key: 'comment',
      render: (entry) => entry.comment
    },
    {
      header: 'Batch',
      key: 'batches_affected',
      render: (entry) => entry.batches_affected || 'N/A'
    },
    {
      header: 'Status',
      key: 'status',
      render: (entry) => entry.status
    },
    {
      header: 'Date',
      key: 'formattedDate',
      render: (entry) => entry.formattedDate
    }
  ];

  if (loading) return <LoadingAnimation />;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="purchases-container">
      <h2>Spoilt stock</h2>
      
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search item, collector, user, or shop"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="actions-container">
        <ExportExcel data={filteredSpoilt} fileName="SpoiltStockData" />
        <DownloadPDF tableId="spoilt-stock-table" fileName="SpoiltStockData" />
      </div>

      {filteredSpoilt.length > 0 ? (
        <>
          <GeneralTableLayout 
            data={filteredSpoilt} 
            columns={columns}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            tableId="spoilt-stock-table"
          />
        </>
      ) : (
        <p>No spoilt stock found.</p>
      )}
    </div>
  );
};

export default SpoiltStockTable;