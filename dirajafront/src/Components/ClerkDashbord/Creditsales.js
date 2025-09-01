import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const GetUnpaidSalesByClerk = () => {
  const [unpaidSales, setUnpaidSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;
  const pageGroupSize = 4;
  const navigate = useNavigate();

  const shopId = localStorage.getItem("shop_id");

  useEffect(() => {
    const fetchUnpaidSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('https://kulima.co.ke/api/diraja/unpaidsales/clerk', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data && Array.isArray(response.data.unpaid_sales)) {
          setUnpaidSales(response.data.unpaid_sales);
        } else {
          setError('Unexpected data format received.');
        }
      } catch (err) {
        console.error('Error fetching unpaid sales:', err);
        setError('Error fetching unpaid sales. Please try again.');
      }
    };

    fetchUnpaidSales();
  }, []);

  // Search and filter logic
  const filteredSales = unpaidSales.filter((sale) => {
    const customerName = sale.customer_name?.toLowerCase() || '';
    const matchesSearch = customerName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(sale.created_at).toLocaleDateString('en-CA') === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  // Sort unpaid sales by `created_at` in descending order
  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Pagination logic
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentSales = sortedSales.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // Handle viewing single credit sale
  const handleViewSale = (salesId) => {
    const storedShopId = localStorage.getItem("shop_id");
    if (storedShopId) {
      navigate(`/sale/${storedShopId}/${salesId}`);
    } else {
      setError("Shop ID not found. Unable to view sale.");
    }
  };

  // Pagination Display

  const startPage = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="sales-container">
      <h1>Credit Sales</h1>

      {/* Search and Date Filter */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by customer name"
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
                <th>Customer name</th>
                <th>Balance</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.sales_id}>
                  <td>{sale.customer_name}</td>
                  <td>{sale.balance}</td>
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className='editeInventory'
                      onClick={() => handleViewSale(sale.sales_id)}
                    >
                       Pay sale
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination">
            {startPage > 1 && <button onClick={() => handlePageChange(startPage - 1)}>«</button>}
            {pageNumbers.map((num) => (
              <button key={num} className={`page-button ${currentPage === num ? 'active' : ''}`} onClick={() => handlePageChange(num)}>
                {num}
              </button>
            ))}
            {endPage < totalPages && <button onClick={() => handlePageChange(endPage + 1)}>»</button>}
          </div>
        </>
      ) : (
        <p>No sales found.</p>
      )}

      <Link className="nav-clerk-button" to="/clerk">Home</Link>
    </div>
  );
};

export default GetUnpaidSalesByClerk;
