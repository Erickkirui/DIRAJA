import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ShopSales = () => {
  const [sales, setSales] = useState([]); // Initialize sales as an array
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [selectedDate, setSelectedDate] = useState(''); // Selected date state
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

        const response = await axios.get(`/diraja/sales/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Log the response to check its structure
        console.log('Sales data fetched:', response.data);

        // Check if the response contains the sales data
        if (response.data && response.data.sales) {
          setSales(response.data.sales); // Update to match the response structure
        } else {
          setError('Unexpected data format received.'); // Set error if not in expected format
        }
      } catch (err) {
        console.error('Error fetching sales:', err); // Log the error
        setError('Error fetching sales. Please try again.');
      }
    };

    fetchSales();
  }, []);



  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // Filter sales based on search query and selected date
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sale.shopname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sale.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(sale.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
      : true;

    return matchesSearch && matchesDate;
  });

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

      {filteredSales.length > 0 ? (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Clerk</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.sale_id}</td>
                  <td>{sale.username}</td>
                  <td>{sale.quantity} {sale.metric}</td>
                  <td>{sale.amount_paid} Ksh</td>
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
    </div>
  );
};

export default ShopSales;
