import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/sales.css';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/allsales', {
          headers: {
            Authorization: `Bearer ${accessToken}`  // Use access token
          }
        });

        setSales(response.data); // Store the fetched expenses
      } catch (err) {
        setError('Error fetching expenses. Please try again.');
      }
    };

    fetchSales(); // Fetch expenses when component loads
  }, []);

  const getFirstName = (username) => {
    return username.split(' ')[0]; // Return only the first name
  };

  const getFirstLetter = (username) => {
    return username.charAt(0).toUpperCase(); // Return the first letter capitalized
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber); // Change the current page
  };

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = sales.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(sales.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="sales-container">
      
      {sales.length > 0 ? (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th> 
                <th>Shop</th>
                <th>Item</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Customer</th>
                <th>Customer No.</th>
                <th>Unit Cost (ksh)</th>
                <th>Total Cost (ksh)</th>
                <th>Amount Paid (ksh)</th>
                <th>Payment Method</th>
                <th>Balance (ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>{sale.sale_id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(sale.username)}</div>
                      <span className="employee-name">{getFirstName(sale.username)}</span>
                    </div>
                  </td>
                  <td>{sale.shopname}</td>
                  <td>{sale.item_name}</td>
                  <td>{sale.batchnumber}</td>
                  <td>{sale.quantity} {sale.metric}</td>
                  <td>{sale.customer_name}</td>
                  <td>{sale.customer_number}</td>
                  <td>{sale.unit_price}</td>
                  <td>{sale.total_price}</td>
                  <td>{sale.amount_paid}</td>
                  <td>{sale.payment_method}</td>
                  <td>{sale.balance}</td>
                  <td>{new Date(sale.created_at).toLocaleString()}</td>
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
        <p>No sale found.</p>
      )}
    </div>
  );
};

export default Sales;
