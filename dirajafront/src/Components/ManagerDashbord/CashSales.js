import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';

const CashSales = () => {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 50;
  const pageGroupSize = 4;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const params = {};
        if (selectedDate) {
          params.date = selectedDate;
        }

        const response = await axios.get(`https://kulima.co.ke/api/diraja/sales/cash/shops`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        });

        if (response.data && Array.isArray(response.data)) {
          setSales(response.data);
        } else {
          setError('Unexpected data format received.');
        }
      } catch (err) {
        console.error('Error fetching cash sales:', err);
        setError('Error fetching cash sales. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [selectedDate]);

  const filteredSales = sales.filter((sale) => {
    const itemName = sale.item_name?.toLowerCase() || '';
    return itemName.includes(searchQuery.toLowerCase());
  });

  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentSales = sortedSales.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const startPage = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const getFirstLetter = (username) => username?.charAt(0).toUpperCase();
  const getFirstName = (username) => username?.split(' ')[0];

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="sales-container">
      {loading && <LoadingAnimation />}

      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item"
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

      {currentSales.length > 0 ? (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shop Name</th>
                <th>Item name</th>
                <th>Quantity</th>
                <th>Amount Paid</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.sales_id}>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(sale.username)}</div>
                      <span className="employee-name">{getFirstName(sale.username)}</span>
                    </div>
                  </td>
                  <td>{sale.shop_name}</td>
                  <td>{sale.item_name}</td>
                  <td>{sale.quantity} {sale.metric}</td>
                  <td>{sale.amount_paid}</td>
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {startPage > 1 && (
              <button onClick={() => handlePageChange(startPage - 1)}>«</button>
            )}
            {pageNumbers.map((num) => (
              <button
                key={num}
                className={`page-button ${currentPage === num ? 'active' : ''}`}
                onClick={() => handlePageChange(num)}
              >
                {num}
              </button>
            ))}
            {endPage < totalPages && (
              <button onClick={() => handlePageChange(endPage + 1)}>»</button>
            )}
          </div>
        </>
      ) : (
        <p>No cash sales found.</p>
      )}

    </div>
  );
};

export default CashSales;
