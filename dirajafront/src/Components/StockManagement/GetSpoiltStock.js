import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';

const SpoiltStockTable = () => {
  const [spoiltStock, setSpoiltStock] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchSpoiltStock = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('api/diraja/allspoilt', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSpoiltStock(response.data);
      } catch (err) {
        setError('Error fetching spoilt stock. Please try again.');
      }
    };

    fetchSpoiltStock();
  }, []);

  const filteredSpoilt = spoiltStock.filter((entry) => {
    const item = entry.item?.toLowerCase() || '';
    const collector = entry.collector_name?.toLowerCase() || '';
    const user = entry.users?.name?.toLowerCase() || '';
    const shop = entry.shops?.name?.toLowerCase() || '';

    const matchesSearch =
      item.includes(searchQuery.toLowerCase()) ||
      collector.includes(searchQuery.toLowerCase()) ||
      user.includes(searchQuery.toLowerCase()) ||
      shop.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(entry.created_at).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  const getFirstLetter = (username) => username.charAt(0).toUpperCase();
  const getFirstName = (username) => username.split(' ')[0];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEntries = filteredSpoilt.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSpoilt.length / itemsPerPage);

  return (
    <div className="purchases-container">
      <h2>Spoilt stock</h2>
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search item, collector, user, or shop"
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
        <ExportExcel data={filteredSpoilt} fileName="SpoiltStockData" />
        <DownloadPDF tableId="spoilt-stock-table" fileName="SpoiltStockData" />
      </div>

      {filteredSpoilt.length > 0 ? (
        <>
          <table id="spoilt-stock-table" className="inventory-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shop Name</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Disposal Method</th>
                <th>Collector Name</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((entry, idx) => (
                <tr key={idx}>  
                    <td>
                        <div className="employee-info">
                        <div className="employee-icon">{getFirstLetter(entry.username)}</div>
                        <span className="employee-name">{getFirstName(entry.username)}</span>
                        </div>
                    </td>
                    <td>{entry.shop_name}</td>
                    <td>{entry.item}</td>
                    <td>{entry.quantity}</td>
                    <td>{entry.unit}</td>
                    <td>{entry.disposal_method}</td>
                    <td>{entry.collector_name}</td>
                    <td>{entry.comment}</td>
                    <td>{new Date(entry.created_at).toLocaleDateString()}</td>
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
        <p>No spoilt stock found.</p>
      )}
    </div>
  );
};

export default SpoiltStockTable;
