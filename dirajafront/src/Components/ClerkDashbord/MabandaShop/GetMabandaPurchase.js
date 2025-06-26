import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Download/ExportExcel';
import DownloadPDF from '../../Download/DownloadPDF';
import { Link } from 'react-router-dom';


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

        const response = await axios.get('/api/diraja/getmabandapurchase', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setPurchases(response.data);
      } catch (err) {
        setError('Error fetching purchases. Please try again.');
      }
    };

    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter((purchase) => {
    const itemName = purchase.itemname ? purchase.itemname.toLowerCase() : "";
    const userName = purchase.username ? purchase.username.toLowerCase() : "";

    const matchesSearch =
      itemName.includes(searchQuery.toLowerCase()) ||
      userName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(purchase.purchase_date).toISOString().split('T')[0] === selectedDate
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
          placeholder="Search by item "
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
        <ExportExcel data={filteredPurchases} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
        <Link className='add-button' to="/mabandapurchase">Add purchase</Link>
      </div>

      {filteredPurchases.length > 0 ? (
        <>
          <table id="sales-table" className="purchases-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Total Price (Ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentPurchases.map((purchase) => (
                <tr key={`${purchase.itemname}-${purchase.purchase_date}`}>
                  <td>{purchase.itemname}</td>
                  <td>{purchase.quantity}</td>
                  <td>{purchase.price}</td>
                  <td>{new Date(purchase.purchase_date).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(',', '')}</td>

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
        <p>No purchase found.</p>
      )}
    </div>
  );
};

export default Purchases;
