import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ShopSales = () => {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;
  const pageGroupSize = 4; // Display only 4 page numbers at a time

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !shopId) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get(`/api/diraja/sales/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('Sales data fetched:', response.data);

        if (response.data && Array.isArray(response.data.sales)) {
          setSales(response.data.sales);
        } else {
          setError('Unexpected data format received.');
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
        setError('Error fetching sales. Please try again.');
      }
    };

    fetchSales();
  }, []);

  // Search and filter logic
  const filteredSales = sales.filter((sale) => {
    const itemName = sale.itemname?.toLowerCase() || '';
    const matchesSearch = itemName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(sale.created_at).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  // **Sort sales by `created_at` in descending order**
  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // **Pagination logic (ensuring latest entries are on page 1)**
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentSales = sortedSales.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // **Pagination Display (4 page numbers at a time)**
  const startPage = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="sales-container">
      <h1>Sales</h1>

      {/* Search and Date Filter */}
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
                <th>Item name</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.item_name}</td>
                  <td>{sale.quantity} {sale.metric}</td>
                  <td>{sale.total_amount_paid} </td>
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
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
        <p>No sales found.</p>
      )}

      <Link className="nav-clerk-button" to="/clerk">Home</Link>
    </div>
  );
};

export default ShopSales;
