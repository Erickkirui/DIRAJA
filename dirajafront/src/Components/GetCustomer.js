import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/allcustomers', {
          headers: {
            Authorization: `Bearer ${accessToken}`  // Use access token
          }
        });

        setCustomers(response.data); // Store the fetched customers
      } catch (err) {
        setError('Error fetching customers. Please try again.');
      }
    };

    fetchCustomers(); // Fetch customers when component loads
  }, []);


  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber); // Change the current page
  };

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(customers.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="customers-container">
      
      {customers.length > 0 ? (
        <>
          <table className="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th> {/* Display Username */}
                <th>Mobile no.</th> {/* Display Shop Name */}
                <th>Shop</th>
                <th>Item</th>
                <th>Amount Paid(ksh)</th>
                <th>Payment method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.customer_name}</td>
                  <td>{customer.customer_number}</td>
                  <td>{customer.shop_id}</td>
                  <td>{customer.item}</td>
                  {/* <td>{customer.item_name}</td>
                  <td>{customer.quantity}</td>
                  <td>{customer.unit_price}</td> */}
                  <td>{customer.amount_paid}</td>
                  <td>{customer.payment_method}</td>
                  <td>{new Date(customer.created_at).toLocaleString()}</td>
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
        <p>No customer found.</p>
      )}
    </div>
  );
};

export default Customers;
