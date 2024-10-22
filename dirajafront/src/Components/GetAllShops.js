import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/shops.css';


const Shops = () => {
  const [shops, setShops] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shopsPerPage] = useState(10); // Adjust as needed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const accessToken = localStorage.getItem('access_token'); // Assuming the token is stored in localStorage
        
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }
        
        const response = await axios.get('/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${accessToken}` // Passing the token in Authorization header
          }
        });

        setShops(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching shops');
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

    // Get current shops
  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = shops.slice(indexOfFirstShop, indexOfLastShop);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(shops.length / shopsPerPage);

  if (loading) {
    return <p>Loading shops...</p>;
  }

  return (
    <div className="shops-container">
      <h1>All Shops</h1>

      {/* Show error message if there is an error */}
      {error && <div className="error-message">{error}</div>}

      {/* Table for displaying all shops */}
      <table className="shops-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Shop Name</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {currentShops.length > 0 ? (
            currentShops.map((shop) => (
              <tr key={shop.shop_id + shop.shopname + shop.employee + shop.created_at}>
                <td>{shop.shop_id}</td>
                <td>
                  <div className="employee-info">
                    <div className="employee-icon">
                      {shop.employee.charAt(0).toUpperCase()}
                    </div>
                    <span className="employee-name">{shop.employee}</span>
                  </div>
                </td>
                <td>{shop.shopname}</td>
                <td>{shop.shopstatus}</td>
                <td>{new Date(shop.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No shops available</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              className={`page-button ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shops;
