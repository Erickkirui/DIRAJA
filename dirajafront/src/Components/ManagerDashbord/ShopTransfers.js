import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../Styles/expenses.css';

const AllShopTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 50;

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await axios.get('/api/diraja/allstocktransfers', {
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

  const currentTransfers = filteredTransfers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="expenses-container">
      <h2>All Shop-to-Shop Transfers</h2>

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

      <table className="expenses-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>From Shop</th>
            <th>To Shop</th>
            <th>User</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Batch No</th>
          </tr>
        </thead>
        <tbody>
          {currentTransfers.map((transfer) => (
            <tr key={transfer.transfer_id}>
              <td>{new Date(transfer.transfer_date).toLocaleDateString('en-CA')}</td>
              <td>{transfer.from_shop_name}</td>
              <td>{transfer.to_shop_name}</td>
              <td>{transfer.username}</td>
              <td>{transfer.itemname}</td>
              <td>{transfer.quantity}</td>
              <td>{transfer.batch_number}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className="pagination-button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllShopTransfers;
