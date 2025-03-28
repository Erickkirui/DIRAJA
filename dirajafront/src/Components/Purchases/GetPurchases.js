import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Components/Download/ExportExcel';
import DownloadPDF from '../../Components/Download/DownloadPDF';
import UpdateTransfer from './UpdtaeTransfers';
import '../../Styles/purchases.css';
import { Link } from 'react-router-dom';


const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState(null); // Track which transfer is being updated
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/alltransfers', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const sortedPurchases = response.data.sort((a, b) => b.transfer_id - a.transfer_id);
        setPurchases(sortedPurchases);
      } catch (err) {
        setError('Error fetching purchases. Please try again.');
      }
    };

    fetchPurchases();
  }, []);


  const getFirstName = (username) => {
    return username.split(' ')[0];
  };

  const getFirstLetter = (username) => {
    return username.charAt(0).toUpperCase();
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
      purchase.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.batchnumber.toLowerCase().includes(searchQuery.toLowerCase()); // Fixed
  
    const matchesDate = selectedDate
      ? new Date(purchase.created_at).toLocaleDateString() ===
        new Date(selectedDate).toLocaleDateString()
      : true;
  
    return matchesSearch && matchesDate;
  });
  

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

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
        <Link to="/mabandapurchasesmanager"  className='add-button' >View Mabanda Purchases </Link>
        
      </div>

      {selectedTransferId && (
        <div className="update-form-container">
          <UpdateTransfer transferId={selectedTransferId} />
          <button className="close-button" onClick={closeUpdateForm}>Close</button>
        </div>
      )}

      {filteredPurchases.length > 0 ? (
        <>
          <table id="purchases-table" className="purchases-table">
            <thead>
              <tr>
                {/* <th>ID</th> */}
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
                  {/* <td>{purchase.transfer_id}</td> */}
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
                  <td>{new Date(purchase.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className='editeInventory'
                      onClick={() => handleEdit(purchase.transfer_id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default Purchases;