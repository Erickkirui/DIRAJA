import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/purchases.css';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchPurchases = async () => {
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

        setPurchases(response.data); // Store the fetched purchases
      } catch (err) {
        setError('Error fetching purchases. Please try again.');
      }
    };

    fetchPurchases(); // Fetch purchases when component loads
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
  const currentPurchases = purchases.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(purchases.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="purchases-container">
      
      {purchases.length > 0 ? (
        <>
          <table id="purchases-table" className="purchases-table">
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
              {currentPurchases.map((purchase) => (
                <tr key={purchase.transfer_id}>
                  <td>{purchase.transfer_id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(purchase.username)}</div>
                      <span className="employee-name">{getFirstName(purchase.username)}</span>
                    </div>
                  </td>
                  <td>{purchase.shop_name}</td>
                  <td>{purchase.itemname}</td>
                  <td>{purchase.batchnumber}</td>
                  <td>{purchase.quantity} {purchase.metric}</td>
                  <td>{purchase.unitCost}</td>
                  <td>{purchase.totalCost}</td>
                  <td>{purchase.amountPaid}</td>
                  <td>{new Date(purchase.created_at).toLocaleString()}</td>
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
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default Purchases;
