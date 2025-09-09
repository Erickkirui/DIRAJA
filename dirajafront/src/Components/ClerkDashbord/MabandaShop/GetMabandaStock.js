import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Download/ExportExcel';
import DownloadPDF from '../../Download/DownloadPDF';

const Stock = () => {
  const [stocks, setStock] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('api/diraja/getmabandastock', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setStock(response.data);
      } catch (err) {
        setError('Error fetching stock. Please try again.');
      }
    };

    fetchStock();
  }, []);

  const filteredStock = stocks.filter((stock) => {
    const itemName = stock.itemname ? stock.itemname.toLowerCase() : "";
    const userName = stock.username ? stock.username.toLowerCase() : "";

    const matchesSearch =
      itemName.includes(searchQuery.toLowerCase()) ||
      userName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(stock.stock_date).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStock = filteredStock.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);

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
        <ExportExcel data={filteredStock} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
      </div>

      {filteredStock.length > 0 ? (
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
              {currentStock.map((stock) => (
                <tr key={`${stock.itemname}-${stock.date_added}`}>
                  <td>{stock.itemname}</td>
                  <td>{stock.quantity}</td>
                  <td>{stock.price}</td>
                  <td>{new Date(stock.date_added).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(',', '')}</td>

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
        <p>No stock found.</p>
      )}
    </div>
  );
};

export default Stock;
