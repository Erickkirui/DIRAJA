import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Components/Download/ExportExcel';
import DownloadPDF from '../../Components/Download/DownloadPDF';
import GeneralTableLayout from '../../Components/GeneralTableLayout';

const StockReturns = () => {
  const [returns, setReturns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('api/diraja/stockreturns', {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager'
          },
        });

        if (response.data && Array.isArray(response.data)) {
          const sortedReturns = response.data.sort((a, b) => 
            new Date(b.return_date) - new Date(a.return_date)
          );
          setReturns(sortedReturns);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err.message || 'Error fetching stock returns. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  const getFirstName = (username) => {
    return username?.split(' ')[0] || '';
  };

  const getFirstLetter = (username) => {
    return username?.charAt(0).toUpperCase() || '';
  };

  const filteredReturns = returns.filter((returnItem) => {
    const matchesSearch =
      returnItem.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.returned_by_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(returnItem.return_date).toLocaleDateString() ===
        new Date(selectedDate).toLocaleDateString()
      : true;

    return matchesSearch && matchesDate;
  });

  const columns = [
    {
      header: 'Employee',
      key: 'returned_by_username',
      render: (returnItem) => (
        <div className="employee-info">
          <div className="employee-icon">
            {getFirstLetter(returnItem.returned_by_username)}
          </div>
          <span className="employee-name">
            {getFirstName(returnItem.returned_by_username)}
          </span>
        </div>
      )
    },
    { header: 'Shop', key: 'shop_name' },
    { header: 'Item', key: 'item_name' },
    { header: 'Batch', key: 'batch_number' },
    { header: 'Quantity', key: 'quantity' },
    { 
      header: 'Return Date', 
      key: 'return_date',
      render: (returnItem) => (
        returnItem.return_date 
          ? new Date(returnItem.return_date).toLocaleString() 
          : 'N/A'
      )
    },
    { header: 'Reason', key: 'reason' }
  ];

  return (
    <div className="purchases-container">
      <h2>Stock Returns</h2>
      
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, employee, batch or reason"
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

      <div className='actions-container'>
        <ExportExcel data={filteredReturns} fileName="StockReturnsData" />
        <DownloadPDF data={filteredReturns} columns={columns} fileName="StockReturnsData" />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredReturns.length > 0 ? (
        <GeneralTableLayout
          data={filteredReturns}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No stock returns found.</p>
      )}
    </div>
  );
};

export default StockReturns;