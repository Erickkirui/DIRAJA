import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import GeneralTableLayout from '../Components/GeneralTableLayout';
import LoadingAnimation from './LoadingAnimation';
import '../Styles/transfers.css';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('api/diraja/alltransfers', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager', // Added user role header
          },
        });

        const sortedTransfers = response.data.sort((a, b) => b.transfer_id - a.transfer_id);
        setTransfers(sortedTransfers);
      } catch (err) {
        setError('Error fetching transfers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const getFirstName = (username) => {
    return username.split(' ')[0];
  };

  const getFirstLetter = (username) => {
    return username.charAt(0).toUpperCase();
  };

  const filteredTransfers = transfers
    .filter((transfer) => {
      const matchesSearch =
        transfer.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.batchnumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.username.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = selectedDate
        ? new Date(transfer.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
        : true;

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => b.transfer_id - a.transfer_id);

  const columns = [
    {
      header: 'Employee',
      key: 'username',
      render: (transfer) => (
        <div className="employee-info">
          <div className="employee-icon">{getFirstLetter(transfer.username)}</div>
          <span className="employee-name">{getFirstName(transfer.username)}</span>
        </div>
      )
    },
    { header: 'Shop', key: 'shop_name' },
    { header: 'Item', key: 'itemname' },
    { header: 'Batch', key: 'batchnumber' },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (transfer) => `${transfer.quantity} ${transfer.metric}`
    },
    { header: 'Unit Cost (Ksh)', key: 'unitCost' },
    { header: 'Total Cost (Ksh)', key: 'totalCost' },
    { header: 'Amount Paid (Ksh)', key: 'amountPaid' },
    {
      header: 'Date',
      key: 'created_at',
      render: (transfer) => new Date(transfer.created_at).toLocaleDateString()
    }
  ];

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transfers-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, or employee"
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

        <div className="actions-container">
          <ExportExcel data={filteredTransfers} fileName="TransfersData" />
          <DownloadPDF data={filteredTransfers} columns={columns} fileName="TransfersData" />
        </div>
      </div>

      {loading ? (
        <LoadingAnimation />
      ) : filteredTransfers.length > 0 ? (
        <GeneralTableLayout
          data={filteredTransfers}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No transfers found.</p>
      )}
    </div>
  );
};

export default Transfers;