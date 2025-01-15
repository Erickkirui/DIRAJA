import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ShopSales = () => {
  const [sales, setSales] = useState([]); // Initialize sales as an array
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(''); // Error state
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [selectedDate, setSelectedDate] = useState(''); // Selected date state
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !shopId) {
          setError('Access token or shop ID is missing. Please log in again.');
          return;
        }

        const response = await axios.get(`/api/diraja/sales/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        // Log the response to check its structure
        console.log('Sales data fetched:', response.data);

        if (response.status === 200 && response.data && response.data.sales) {
          setSales(response.data.sales); // Update sales state
          setError(''); // Clear any previous error
        } else if (response.status === 404) {
          setError('No sales found for this shop.');
        } else {
          setError('Unexpected response from the server.');
        }
      } catch (err) {
        if (err.response) {
          // Errors from the server
          if (err.response.status === 401) {
            setError('Unauthorized. Please log in again.');
          } else if (err.response.status === 403) {
            setError('Forbidden access. You do not have permission to view this data.');
          } else if (err.response.status === 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(`Error: ${err.response.statusText || 'Unexpected error occurred.'}`);
          }
        } else if (err.request) {
          // No response from the server
          setError('No response from the server. Please check your network connection.');
        } else {
          // Other errors
          setError('An error occurred. Please try again.');
        }
        console.error('Error fetching sales:', err); // Log the error
      }
    };

    fetchSales();
  }, []);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // Filter sales based on search query and selected date
  const filteredSales = sales
    .filter((sale) => {
      const matchesSearch = (
        (sale.item_name && sale.item_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      const matchesDate = selectedDate
        ? new Date(sale.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
        : true;

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by created_at in descending order

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

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
          placeholder="Search by item name or customer name"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to page 1 on new search query
          }}
        />
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentPage(1); // Reset to page 1 when a new date is selected
          }}
        />
      </div>

      {filteredSales.length > 0 ? (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Item name</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.customer_name}</td>
                  <td>{sale.amount_paid} Ksh</td>
                  <td>{sale.item_name}</td>
                  {/* Format the date to show only the date (without time) */}
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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
        <p>No sales found.</p>
      )}

      <Link className="nav-clerk-button" to="/clerk">Home</Link>
    </div>
  );
};

export default ShopSales;
