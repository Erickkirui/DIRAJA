import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ShopCustomers = () => {
  const [customers, setCustomers] = useState([]); // Initialize customers as an array
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const itemsPerPage = 50; // Number of items per page

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !shopId) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get(`/api/diraja/customers/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log('Fetched Customers data:', response.data);

        if (Array.isArray(response.data)) {
          setCustomers(response.data);
        } else if (response.data && Array.isArray(response.data.customers)) {
          setCustomers(response.data.customers);
        } else {
          setError('Unexpected data format received.');
          setCustomers([]);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Error fetching customers. Please try again.');
        setCustomers([]);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="customers-container">
      <h1>Customers</h1>
      
      {/* Search Filter */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by customer name"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
        />
      </div>

      {currentCustomers.length > 0 ? (
        <>
          <table className="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Item</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.customer_name}</td>
                  <td>{customer.customer_number}</td>
                  <td>{customer.item}</td>
                  {/* Show only the date (without time) */}
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
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
        <p>No customers found.</p>
      )}
    </div>
  );
};

export default ShopCustomers;
