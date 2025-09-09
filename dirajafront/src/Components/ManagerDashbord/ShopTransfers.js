import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get('https://kulima.co.ke/api/diraja/allstocktransfers', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setTransfers(response.data);
      } catch (err) {
        setError('Failed to fetch transfers. Please try again.');
      }
    };

    fetchTransfers();
  }, []);

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    { header: 'Qty', key: 'quantity' },
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
