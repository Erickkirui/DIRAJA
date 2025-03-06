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

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // **Filter sales based on search & selected date**
  const filteredSales = sales.filter((sale) => {
    const itemName = sale.item_name?.toLowerCase() || '';
    const shopName = sale.shopname?.toLowerCase() || '';
    const userName = sale.username?.toLowerCase() || '';

    const matchesSearch =
      itemName.includes(searchQuery.toLowerCase()) ||
      shopName.includes(searchQuery.toLowerCase()) ||
      userName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(sale.sale_date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
      : true;

    return matchesSearch && matchesDate;
  });

  // **Sort sales by date (newest first)**
  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));

  // **Pagination**
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = sortedSales.slice(indexOfFirstItem, indexOfLastItem);

  // **Pagination Logic - Show 4 Pages at a Time**
  const maxPageNumbers = 4;
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

  if (endPage - startPage < maxPageNumbers - 1) {
    startPage = Math.max(1, endPage - maxPageNumbers + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

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

      {sortedSales.length > 0 ? (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>Item Name</th>
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
                  <td>{sale.total_amount_paid} Ksh</td>
                  <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              className="page-button" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>

            {pageNumbers.map((number) => (
              <button
                key={number}
                className={`page-button ${currentPage === number ? 'active' : ''}`}
                onClick={() => handlePageChange(number)}
              >
                {number}
              </button>
            ))}

            <button 
              className="page-button" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
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
