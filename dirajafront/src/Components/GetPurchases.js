import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/purchases.css';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('http://16.171.22.129/diraja/alltransfers', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setPurchases(response.data);
      } catch (err) {
        setError('Error fetching purchases. Please try again.');
      }
    };

    fetchPurchases();
  }, []);

  const getFirstName = (username) => username.split(' ')[0];
  const getFirstLetter = (username) => username.charAt(0).toUpperCase();

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(purchase.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
      : true;

    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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
      
      <div className='actions-container' >
        <ExportExcel data={filteredPurchases} fileName="PurchasesData" />
        <DownloadPDF tableId="purchases-table" fileName="PurchasesData" />
      </div>

      {filteredPurchases.length > 0 ? (
        <>
          <table id="purchases-table" className="purchases-table">
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
              {currentPurchases.map((purchase) => (
                <tr key={purchase.transfer_id}>
                  <td>{purchase.transfer_id}</td>
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
                  <td>{new Date(purchase.created_at).toLocaleString()}</td>
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
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default Purchases;
