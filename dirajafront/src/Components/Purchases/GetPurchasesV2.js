import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Components/Download/ExportExcel';
import DownloadPDF from '../../Components/Download/DownloadPDF';
import UpdateTransfer from './UpdtaeTransfers';
import GeneralTableLayout from '../../Components/GeneralTableLayout';
import { Link } from 'react-router-dom';
import '../../Styles/purchases.css';

const PurchasesV2 = () => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('https://kulima.co.ke/api/diraja/v2/transfers', {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'X-User-Role': 'manager'
          },
        });

        // Handle the structured response
        if (response.data && response.data.status === "success") {
          const sortedPurchases = response.data.data.sort((a, b) => b.transfer_id - a.transfer_id);
          setPurchases(sortedPurchases);
        } else {
          throw new Error(response.data.message || 'Invalid response format');
        }
      } catch (err) {
        setError(err.message || 'Error fetching purchases. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const getFirstName = (username) => {
    return username?.split(' ')[0] || '';
  };

  const getFirstLetter = (username) => {
    return username?.charAt(0).toUpperCase() || '';
  };

  const handleEdit = (transferId) => {
    setSelectedTransferId(transferId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeUpdateForm = () => {
    setSelectedTransferId(null);
  };
  
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.itemname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.batchnumber?.toLowerCase().includes(searchQuery.toLowerCase());
  
    const matchesDate = selectedDate
      ? new Date(purchase.created_at).toLocaleDateString() ===
        new Date(selectedDate).toLocaleDateString()
      : true;
  
    return matchesSearch && matchesDate;
  });

  const columns = [
    {
      header: 'Employee',
      key: 'username',
      render: (purchase) => (
        <div className="employee-info">
          <div className="employee-icon">{getFirstLetter(purchase.username)}</div>
          <span className="employee-name">{getFirstName(purchase.username)}</span>
        </div>
      )
    },
    { header: 'Shop', key: 'shop_name' },
    { header: 'Item', key: 'itemname' },
    { header: 'Batch', key: 'BatchNumber' },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (purchase) => `${purchase.quantity} ${purchase.metric}`
    },
    { header: 'Unit Cost (Ksh)', key: 'unitCost' },
    { header: 'Total Cost (Ksh)', key: 'total_cost' },
    { header: 'Amount Paid (Ksh)', key: 'amountPaid' },
    {
      header: 'Date',
      key: 'created_at',
      render: (purchase) => new Date(purchase.created_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (purchase) => (
        <button
          className='editeInventory'
          onClick={() => handleEdit(purchase.transfer_id)}
        >
          Edit
        </button>
      )
    }
  ];

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
        <DownloadPDF data={filteredPurchases} columns={columns} fileName="PurchasesData" />
        <Link to="/mabandapurchasesmanager" className='mabandabutton'>
          View Mabanda Purchases
        </Link>
      </div>

      {selectedTransferId && (
        <div className="update-form-container">
          <UpdateTransfer transferId={selectedTransferId} />
          <button className="close-button" onClick={closeUpdateForm}>Close</button>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredPurchases.length > 0 ? (
        <GeneralTableLayout
          data={filteredPurchases}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default PurchasesV2;