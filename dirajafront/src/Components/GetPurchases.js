import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import UpdateTransfer from './UpdtaeTransfers';
import '../Styles/purchases.css';
import { Link } from 'react-router-dom';
import LoadingAnimation from './LoadingAnimation'

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state
  const itemsPerPage = 50;
  const maxPagesToShow = 5;

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/diraja/alltransfers', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const sortedPurchases = response.data.sort((a, b) => b.transfer_id - a.transfer_id);
        setPurchases(sortedPurchases);
      } catch (err) {
        setError('Error fetching purchases. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const getFirstName = (username) => username.split(' ')[0];
  const getFirstLetter = (username) => username.charAt(0).toUpperCase();

  const handleEdit = (transferId) => {
    setSelectedTransferId(transferId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeUpdateForm = () => setSelectedTransferId(null);

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.batchnumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(purchase.created_at).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  // Calculate pagination range
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  return (
    <div className="purchases-container">
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

      <div className='actions-container'>
        <ExportExcel data={filteredPurchases} fileName="PurchasesData" />
        <DownloadPDF tableId="purchases-table" fileName="PurchasesData" />
        <Link to="/mabandapurchasesmanager" className='add-button'>View Mabanda Purchases</Link>
      </div>

      {selectedTransferId && (
        <div className="update-form-container">
          <UpdateTransfer transferId={selectedTransferId} />
          <button className="button" onClick={closeUpdateForm}>Close</button>
        </div>
      )}

      {loading ? (
        <LoadingAnimation />
      ) : filteredPurchases.length > 0 ? (
        <>
          <table id="purchases-table" className="purchases-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shop</th>
                <th>Item</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Unit Cost (Ksh)</th>
                <th>Total Cost (Ksh)</th>
                <th>Amount Paid (Ksh)</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPurchases.map((purchase) => (
                <tr key={purchase.transfer_id}>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(purchase.username)}</div>
                      <span className="employee-name">{getFirstName(purchase.username)}</span>
                    </div>
                  </td>
                  <td>{purchase.shop_name}</td>
                  <td>{purchase.itemname}</td>
                  <td>{purchase.batchnumber}</td>
                  <td>{purchase.quantity} {purchase.metric}</td>
                  <td>{purchase.unitCost}</td>
                  <td>{purchase.totalCost}</td>
                  <td>{purchase.amountPaid}</td>
                  <td>{new Date(purchase.created_at).toISOString().split('T')[0]}</td>
                  <td>
                    <button className='editeInventory' onClick={() => handleEdit(purchase.transfer_id)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination">
            {startPage > 1 && (
              <>
                <button className="page-button" onClick={() => setCurrentPage(1)}>« First</button>
                <button className="page-button" onClick={() => setCurrentPage(currentPage - 1)}>‹ Prev</button>
              </>
            )}

            {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
              <button
                key={startPage + index}
                className={`page-button ${currentPage === startPage + index ? 'active' : ''}`}
                onClick={() => setCurrentPage(startPage + index)}
              >
                {startPage + index}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                <button className="page-button" onClick={() => setCurrentPage(currentPage + 1)}>Next ›</button>
                <button className="page-button" onClick={() => setCurrentPage(totalPages)}>Last »</button>
              </>
            )}
          </div>
        </>
      ) : (
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default Purchases;
