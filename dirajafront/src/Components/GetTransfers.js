import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/transfers.css';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/alltransfers', {
          headers: {
            Authorization: `Bearer ${accessToken}`  // Use access token
          }
        });

        setTransfers(response.data); // Store the fetched expenses
      } catch (err) {
        setError('Error fetching transfers. Please try again.');
      }
    };

    fetchTransfers(); // Fetch transfers when component loads
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
  const currentTransfers = transfers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(transfers.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transfers-container">
      
      {transfers.length > 0 ? (
        <>
          <table className="transfers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th> 
                <th>Shop</th> {/* Display Shop Name */}
                <th>Item</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Unit Cost(ksh)</th>
                <th>Total Cost(ksh)</th>
                <th>Amount Paid(ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentTransfers.map((transfer) => (
                <tr key={transfer.transfer_id}>
                  <td>{transfer.transfer_id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(transfer.username)}</div>
                      <span className="employee-name">{getFirstName(transfer.username)}</span>
                    </div>
                  </td>
                  <td>{transfer.shop_name}</td>
                  <td>{transfer.itemname}</td>
                  <td>{transfer.batchnumber}</td>
                  <td>{transfer.quantity} {transfer.metric}</td>
                  <td>{transfer.unitCost}</td>
                  <td>{transfer.totalCost}</td>
                  <td>{transfer.amountPaid}</td>
                  <td>{new Date(transfer.created_at).toLocaleString()}</td>
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
        <p>No transfers found.</p>
      )}
    </div>
  );
};

export default Transfers;
