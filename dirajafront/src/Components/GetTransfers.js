import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/transfers.css';
import LoadingAnimation from './LoadingAnimation';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true); // Start loading
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/diraja/alltransfers', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Sort transfers by transfer_id in descending order
        const sortedTransfers = response.data.sort((a, b) => b.transfer_id - a.transfer_id);

        setTransfers(sortedTransfers);
      } catch (err) {
        setError('Error fetching transfers. Please try again.');
      } finally {
        setLoading(false); // Stop loading
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const filteredTransfers = transfers
    .filter((transfer) => {
      const matchesSearch =
        transfer.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.username.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = selectedDate
        ? new Date(transfer.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
        : true;

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => b.transfer_id - a.transfer_id); // Ensure filtered transfers are sorted

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransfers = filteredTransfers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

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
      </div>

      <div className="actions-container">
        <ExportExcel data={filteredTransfers} fileName="TransfersData" />
        <DownloadPDF tableId="transfers-table" fileName="TransfersData" />
      </div>

      {loading ? (
       <LoadingAnimation /> // Show loading message
      ) : filteredTransfers.length > 0 ? (
        <>
          <table id="transfers-table" className="transfers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Shop</th>
                <th>Item</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Unit Cost(ksh)</th>
                <th>Total Cost(ksh)</th>
                <th>Amount Paid(ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentTransfers.map((transfer) => (
                <tr key={transfer.transfer_id}>
                  <td>{transfer.transfer_id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(transfer.username)}</div>
                      <span className="employee-name">{getFirstName(transfer.username)}</span>
                    </div>
                  </td>
                  <td>{transfer.shop_name}</td>
                  <td>{transfer.itemname}</td>
                  <td>{transfer.batchnumber}</td>
                  <td>{transfer.quantity} {transfer.metric}</td>
                  <td>{transfer.unitCost}</td>
                  <td>{transfer.totalCost}</td>
                  <td>{transfer.amountPaid}</td>
                  <td>{new Date(transfer.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No transfers found.</p>
      )}
    </div>
  );
};

export default Transfers;
